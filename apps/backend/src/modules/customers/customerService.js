import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { parsePagination, buildMeta } from '../../utils/pagination.js'

// Never select passwordHash anywhere in this module — every query below is
// explicit about the fields it returns rather than using a bare
// `findMany()`/`findUnique()`, specifically so a password hash (or any
// other sensitive field added to User later) can never leak through an
// admin response by accident.
const SAFE_USER_SELECT = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }

export async function listCustomers({ page, pageSize, search }) {
  const pagination = parsePagination({ page, pageSize })
  const where = {
    role: 'CUSTOMER',
    // No `mode: 'insensitive'` (Postgres-only) — MySQL's default collation
    // is already case-insensitive.
    ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        ...SAFE_USER_SELECT,
        addresses: { where: { isDefault: true }, take: 1, select: { phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.user.count({ where }),
  ])

  const userIds = users.map((u) => u.id)
  const orderStats = await prisma.order.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _count: { _all: true },
    _sum: { totalCents: true },
  })
  const statsByUserId = new Map(orderStats.map((s) => [s.userId, s]))

  const customers = users.map((user) => {
    const stats = statsByUserId.get(user.id)
    const { addresses, ...rest } = user
    return {
      ...rest,
      phone: addresses[0]?.phone ?? null,
      orderCount: stats?._count._all ?? 0,
      totalOrderValueCents: stats?._sum.totalCents ?? 0,
    }
  })

  return { customers, meta: buildMeta(pagination, total) }
}

export async function getCustomer(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT })
  if (!user || user.role !== 'CUSTOMER') {
    throw new HttpError(404, 'Customer not found.')
  }

  const [addresses, orders] = await Promise.all([
    prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }),
    prisma.order.findMany({
      where: { userId },
      select: { id: true, orderNumber: true, status: true, totalCents: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const orderCount = orders.length
  const totalOrderValueCents = orders.reduce((sum, order) => sum + order.totalCents, 0)

  return { ...user, addresses, orders, orderCount, totalOrderValueCents }
}

export async function setCustomerActive(userId, isActive) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
  if (!user) throw new HttpError(404, 'Customer not found.')
  if (user.role !== 'CUSTOMER') {
    // Explicit, not hidden behind a generic 404 — this is an admin-only
    // endpoint already, so there's no information-disclosure concern in
    // saying plainly that admin accounts can't be managed this way.
    throw new HttpError(403, 'Admin accounts cannot be activated or deactivated here.')
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive }, select: SAFE_USER_SELECT })
  return updated
}
