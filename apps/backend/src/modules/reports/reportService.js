import { prisma } from '../../config/db.js'
import { bucketByDate } from '../../utils/dateRange.js'

/**
 * Revenue recognition rule for every report in this module: a status only
 * counts toward revenue once it's been paid for and hasn't been reversed.
 * - PENDING is excluded — nothing has been paid yet.
 * - CANCELLED and REFUNDED are excluded — explicitly required ("prevent
 *   cancelled or refunded orders from being incorrectly counted as
 *   completed revenue"). A REFUNDED order reverses revenue even though it
 *   necessarily passed through a revenue-counting status first.
 * - PAID, PROCESSING, SHIPPED, DELIVERED all count — the money has been
 *   collected and the order hasn't been reversed.
 */
export const REVENUE_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']

const ALL_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

// No inventory/stock field exists anywhere in the schema (Product has no
// quantity column) — implementing that is out of scope for this phase (and
// was explicitly excluded from earlier phases too). Rather than fabricate
// numbers, every report below reports these as `null` with
// `inventoryTrackingAvailable: false` alongside them.
const INVENTORY_TRACKING_AVAILABLE = false

export async function getDashboardSummary(range = null) {
  const where = range ? { createdAt: { gte: range.from, lt: range.to } } : {}
  const customerWhere = { role: 'CUSTOMER' }

  const [totalCustomers, totalOrders, statusCounts, revenueAgg, totalProducts] = await Promise.all([
    prisma.user.count({ where: customerWhere }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.order.aggregate({ where: { status: { in: REVENUE_STATUSES }, ...where }, _sum: { totalCents: true } }),
    prisma.product.count(),
  ])

  const countByStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]))
  for (const row of statusCounts) countByStatus[row.status] = row._count._all

  return {
    from: range?.from ?? null,
    to: range?.to ?? null,
    totalCustomers,
    totalOrders,
    totalRevenueCents: revenueAgg._sum.totalCents ?? 0,
    ordersByStatus: countByStatus,
    totalProducts,
    lowStockProducts: null,
    outOfStockProducts: null,
    inventoryTrackingAvailable: INVENTORY_TRACKING_AVAILABLE,
    revenueStatuses: REVENUE_STATUSES,
  }
}

export async function getSalesReport({ from, to, granularity }) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES } },
    select: { totalCents: true, createdAt: true },
  })

  const totalSalesCents = orders.reduce((sum, o) => sum + o.totalCents, 0)
  const orderCount = orders.length
  const averageOrderValueCents = orderCount > 0 ? Math.round(totalSalesCents / orderCount) : 0

  const salesByDate = bucketByDate(
    orders,
    granularity,
    (acc, order) => ({ totalCents: acc.totalCents + order.totalCents, orderCount: acc.orderCount + 1 }),
    () => ({ totalCents: 0, orderCount: 0 }),
  )

  return { from, to, granularity, totalSalesCents, orderCount, averageOrderValueCents, salesByDate, revenueStatuses: REVENUE_STATUSES }
}

export async function getOrderReport({ from, to, status, granularity }) {
  const where = { createdAt: { gte: from, lt: to }, ...(status ? { status } : {}) }

  const [orders, statusCounts, recentOrders] = await Promise.all([
    prisma.order.findMany({ where, select: { id: true, orderNumber: true, status: true, totalCents: true, createdAt: true } }),
    prisma.order.groupBy({ by: ['status'], where: { createdAt: { gte: from, lt: to } }, _count: { _all: true } }),
    prisma.order.findMany({
      where,
      select: { id: true, orderNumber: true, status: true, totalCents: true, createdAt: true, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const countByStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]))
  for (const row of statusCounts) countByStatus[row.status] = row._count._all

  const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED')
  const orderTotalsCents = orders.reduce((sum, o) => sum + o.totalCents, 0)

  const ordersOverTime = bucketByDate(
    orders,
    granularity,
    (acc) => ({ orderCount: acc.orderCount + 1 }),
    () => ({ orderCount: 0 }),
  )

  return {
    from,
    to,
    status: status ?? null,
    ordersByStatus: countByStatus,
    ordersOverTime,
    recentOrders,
    cancelledOrders: { count: cancelledOrders.length, orders: cancelledOrders },
    orderTotalsCents,
    orderCount: orders.length,
  }
}

export async function getProductReport({ from, to, limit }) {
  const itemsInRange = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES } } },
    select: { itemType: true, productId: true, productName: true, quantity: true, unitPriceCents: true },
  })

  // Standalone custom designs have no productId (and each has its own title),
  // so all of them are reported together as one "Custom 3D designs" row.
  const CUSTOM_KEY = 'custom-designs'
  const byProduct = new Map()
  for (const item of itemsInRange) {
    const isCustom = item.itemType === 'CUSTOM_DESIGN'
    const key = isCustom ? CUSTOM_KEY : item.productId
    const existing =
      byProduct.get(key) ??
      (isCustom
        ? { productId: null, productName: 'Custom 3D designs', isCustomDesign: true, quantitySold: 0, revenueCents: 0 }
        : { productId: item.productId, productName: item.productName, quantitySold: 0, revenueCents: 0 })
    existing.quantitySold += item.quantity
    existing.revenueCents += item.quantity * item.unitPriceCents
    byProduct.set(key, existing)
  }

  const soldProducts = [...byProduct.values()]
  const bestSellingByQuantity = [...soldProducts].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, limit)
  const bestSellingByRevenue = [...soldProducts].sort((a, b) => b.revenueCents - a.revenueCents).slice(0, limit)

  const allActiveProducts = await prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true } })
  const soldProductIds = new Set(soldProducts.map((p) => p.productId))
  const productsWithNoSales = allActiveProducts.filter((p) => !soldProductIds.has(p.id)).map((p) => ({ productId: p.id, productName: p.name }))

  return {
    from,
    to,
    bestSellingByQuantity,
    bestSellingByRevenue,
    productsWithNoSales,
    totalProductsSold: soldProducts.length,
    lowStockProducts: null,
    outOfStockProducts: null,
    inventoryTrackingAvailable: INVENTORY_TRACKING_AVAILABLE,
  }
}

function maskEmail(email) {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const visible = local.slice(0, 1)
  return `${visible}***@${domain}`
}

export async function getCustomerReport({ from, to, limit }) {
  const [totalCustomers, newCustomers, orderCountGroups, orderValueGroups] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: from, lt: to } } }),
    // Order by a specific named counted field, not `_all` — Prisma's
    // groupBy `orderBy` on a count only accepts a field name (verified
    // against real MariaDB; `_count: { _all: 'desc' }` is rejected).
    prisma.order.groupBy({ by: ['userId'], _count: { userId: true }, orderBy: { _count: { userId: 'desc' } }, take: limit }),
    prisma.order.groupBy({
      by: ['userId'],
      where: { status: { in: REVENUE_STATUSES } },
      _sum: { totalCents: true },
      orderBy: { _sum: { totalCents: 'desc' } },
      take: limit,
    }),
  ])

  const userIds = [...new Set([...orderCountGroups.map((g) => g.userId), ...orderValueGroups.map((g) => g.userId)])]
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
  const userById = new Map(users.map((u) => [u.id, u]))

  // Reports are aggregate/leaderboard views, not the dedicated customer
  // record screen (Phase 13's Admin Customer Management already shows the
  // full email there) — email is masked here as an extra, deliberate
  // precaution against over-exposing personal data in a summary widget.
  const topCustomersByOrderCount = orderCountGroups.map((g) => ({
    userId: g.userId,
    name: userById.get(g.userId)?.name ?? 'Unknown',
    email: userById.get(g.userId) ? maskEmail(userById.get(g.userId).email) : null,
    orderCount: g._count.userId,
  }))
  const topCustomersByOrderValue = orderValueGroups.map((g) => ({
    userId: g.userId,
    name: userById.get(g.userId)?.name ?? 'Unknown',
    email: userById.get(g.userId) ? maskEmail(userById.get(g.userId).email) : null,
    totalOrderValueCents: g._sum.totalCents ?? 0,
  }))

  return { from, to, totalCustomers, newCustomers, topCustomersByOrderCount, topCustomersByOrderValue, revenueStatuses: REVENUE_STATUSES }
}
