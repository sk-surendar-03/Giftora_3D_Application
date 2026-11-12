import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { generateOrderNumber } from './orderNumber.js'
import { parsePagination, buildMeta } from '../../utils/pagination.js'
import { stlIsAvailable, toPublicDesign } from '../customizer/designService.js'
import { resolveTrackingUrl } from './carrierTracking.js'

const CART_INCLUDE = { items: { include: { product: true, customDesign: true }, orderBy: { createdAt: 'asc' } } }
const ORDER_INCLUDE = { items: { include: { customDesign: true } } }

/**
 * Shapes an order for the API: each custom-design line carries a `design`
 * summary (never storage keys). `admin` additionally exposes the stored
 * file's metadata and the exact engine parameters.
 */
function serializeOrder(order, { admin = false } = {}) {
  if (!order) return order
  return {
    ...order,
    items: order.items.map(({ customDesign, ...item }) => ({
      ...item,
      ...(customDesign !== undefined ? { design: toPublicDesign(customDesign, { admin }) } : {}),
    })),
  }
}

function addressSnapshotFrom(address) {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  }
}

export async function createOrder(userId, { addressId, idempotencyKey }) {
  if (idempotencyKey) {
    const existing = await prisma.order.findUnique({ where: { idempotencyKey }, include: ORDER_INCLUDE })
    if (existing) {
      // A repeated submission with the same key (double-click, a retried
      // network request, etc.) returns the order that was already created
      // instead of creating a second one.
      if (existing.userId !== userId) throw new HttpError(409, 'This order request has already been used.')
      return serializeOrder(existing)
    }
  }

  const address = await prisma.address.findUnique({ where: { id: addressId } })
  if (!address || address.userId !== userId) {
    throw new HttpError(404, 'Address not found.')
  }

  // Everything that reads the cart/products and then writes the order +
  // clears the cart happens inside one transaction: if any validation
  // fails or the write fails partway, nothing is committed — the cart is
  // never cleared without a real, persisted order existing, and no order
  // is left referencing items that were never actually removed.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({ where: { userId }, include: CART_INCLUDE })
        if (!cart || cart.items.length === 0) {
          throw new HttpError(400, 'Your cart is empty.')
        }

        // A catalog line is unavailable once its product is deactivated; a
        // custom design once its STL is no longer stored.
        const unavailable = []
        for (const item of cart.items) {
          if (item.itemType === 'CUSTOM_DESIGN') {
            if (!(await stlIsAvailable(item.customDesign))) unavailable.push({ name: item.customDesign.title })
          } else if (!item.product.isActive) {
            unavailable.push({ name: item.product.name })
          }
        }
        if (unavailable.length > 0) {
          throw new HttpError(409, `${unavailable.map((i) => i.name).join(', ')} ${unavailable.length > 1 ? 'are' : 'is'} no longer available. Please remove ${unavailable.length > 1 ? 'them' : 'it'} from your cart before placing this order.`)
        }

        // Use each cart item's own snapshotted unitPriceCents (the real,
        // per-character customizer price computed at add-to-cart time), not
        // the product's own base priceCents — customizer products have no
        // separate base price; see cartService.js's addItem.
        const subtotalCents = cart.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
        const shippingCents = cart.items.reduce((sum, item) => {
          const selMethod = item.customization?.shippingMethod
          if (selMethod && typeof selMethod.priceCents === 'number') {
            return sum + selMethod.priceCents
          }
          if (item.itemType === 'PRODUCT' && item.product?.shippingCents > 0) {
            return sum + item.product.shippingCents * item.quantity
          }
          return sum
        }, 0)
        const totalCents = subtotalCents + shippingCents

        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            idempotencyKey: idempotencyKey ?? null,
            userId,
            addressId: address.id,
            shippingAddress: addressSnapshotFrom(address),
            subtotalCents,
            shippingCents,
            totalCents,
            items: {
              create: cart.items.map((item) =>
                item.itemType === 'CUSTOM_DESIGN'
                  ? {
                      // Standalone design: no product. The design title is the
                      // name snapshot and the validated params are snapshotted
                      // on the line; the STL stays linked via customDesignId.
                      itemType: 'CUSTOM_DESIGN',
                      customDesignId: item.customDesignId,
                      productName: item.customDesign.title,
                      productSlug: null,
                      productImage: null,
                      quantity: item.quantity,
                      customization: item.customDesign.params,
                      unitPriceCents: item.unitPriceCents,
                    }
                  : {
                      itemType: 'PRODUCT',
                      productId: item.productId,
                      productName: item.product.name,
                      productSlug: item.product.slug,
                      productImage: item.product.images?.[0] ?? null,
                      quantity: item.quantity,
                      customization: item.customization ?? undefined,
                      unitPriceCents: item.unitPriceCents,
                    },
              ),
            },
          },
          include: ORDER_INCLUDE,
        })

        // Clear the cart only now that the order has actually been created
        // (same transaction — both commit together or neither does).
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

        return serializeOrder(order)
      })
    } catch (err) {
      if (err.code === 'P2002' && err.meta?.target?.includes?.('orderNumber')) {
        // Astronomically unlikely collision on the random order number —
        // retry with a freshly generated one rather than failing the order.
        continue
      }
      if (err.code === 'P2002' && err.meta?.target?.includes?.('idempotencyKey')) {
        // Lost a race with a concurrent identical request — return the
        // order the other request just created instead of erroring.
        const existing = await prisma.order.findUnique({ where: { idempotencyKey }, include: ORDER_INCLUDE })
        if (existing) return serializeOrder(existing)
      }
      throw err
    }
  }

  throw new HttpError(500, 'Could not create the order. Please try again.')
}

export async function listOrders(userId) {
  const orders = await prisma.order.findMany({ where: { userId }, include: ORDER_INCLUDE, orderBy: { createdAt: 'desc' } })
  return orders.map((order) => serializeOrder(order))
}

export async function getOrder(userId, orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE })
  if (!order || order.userId !== userId) {
    throw new HttpError(404, 'Order not found.')
  }
  return serializeOrder(order)
}

// The admin list only needs each line's type (no design join); the detail and
// status-update responses include the full design record (admin view).
const USER_SELECT = { select: { id: true, name: true, email: true } }
const ADMIN_ORDER_LIST_INCLUDE = { items: true, user: USER_SELECT }
const ADMIN_ORDER_INCLUDE = { items: { include: { customDesign: true } }, user: USER_SELECT }

/**
 * Unlike `listOrders`/`getOrder` above (scoped to the calling customer),
 * these three are for the admin order-management screens and deliberately
 * have no `userId` filter — an admin can see and manage every customer's
 * orders. Access to these functions must only ever be reached through a
 * route gated by `authorize('ADMIN')` (see adminOrderRoutes.js).
 */
export async function listOrdersForAdmin({ page, pageSize, search, status, type }) {
  const pagination = parsePagination({ page, pageSize })

  const where = {
    ...(status ? { status } : {}),
    // Orders containing at least one line of the given kind (PRODUCT or CUSTOM_DESIGN).
    ...(type ? { items: { some: { itemType: type } } } : {}),
    // No `mode: 'insensitive'` (Postgres-only) — MySQL's default collation
    // is already case-insensitive.
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search } },
            { user: { name: { contains: search } } },
            { user: { email: { contains: search } } },
            // Also matches product names and custom design titles (which
            // contain the customer's text).
            { items: { some: { productName: { contains: search } } } },
          ],
        }
      : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: ADMIN_ORDER_LIST_INCLUDE, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.take }),
    prisma.order.count({ where }),
  ])

  return { orders: orders.map((order) => serializeOrder(order, { admin: true })), meta: buildMeta(pagination, total) }
}

export async function getOrderForAdmin(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ADMIN_ORDER_INCLUDE })
  if (!order) throw new HttpError(404, 'Order not found.')
  return serializeOrder(order, { admin: true })
}

// The allowed order-processing workflow. A terminal status (CANCELLED,
// REFUNDED) has no further transitions. Anything not listed as a valid
// "next" status for the order's current status is rejected — this is the
// backend validation the requirements ask for, not just accepting any enum
// value.
//
// In stores without online payment gateway webhooks (e.g. cash on delivery,
// manual invoice, or admin-managed fulfillment), an order placed by a customer
// starts in PENDING and can transition directly to PAID (payment confirmed) or
// PROCESSING (manufacturing / production started), or CANCELLED.
const ALLOWED_TRANSITIONS = {
  PENDING: ['PAID', 'PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

export async function updateOrderStatus(orderId, input) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new HttpError(404, 'Order not found.')

  const isLegacy = typeof input === 'string'
  const nextStatus = isLegacy ? input : input?.status
  const shippingCarrier = !isLegacy ? input?.shippingCarrier : undefined
  const trackingNumber = !isLegacy ? input?.trackingNumber : undefined
  const trackingUrl = !isLegacy ? input?.trackingUrl : undefined

  const data = {}

  if (nextStatus !== undefined && nextStatus !== order.status) {
    if (!ALLOWED_TRANSITIONS[order.status]?.includes(nextStatus)) {
      throw new HttpError(400, `Cannot change an order from ${order.status} to ${nextStatus}.`)
    }
    data.status = nextStatus
  }

  if (shippingCarrier !== undefined) {
    data.shippingCarrier = typeof shippingCarrier === 'string' && shippingCarrier.trim() ? shippingCarrier.trim() : null
  }

  if (trackingNumber !== undefined) {
    data.trackingNumber = typeof trackingNumber === 'string' && trackingNumber.trim() ? trackingNumber.trim() : null
  }

  if (trackingUrl !== undefined) {
    if (typeof trackingUrl === 'string' && trackingUrl.trim()) {
      const trimmedUrl = trackingUrl.trim()
      if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
        throw new HttpError(400, 'Tracking URL must be a valid http or https URL.')
      }
      data.trackingUrl = trimmedUrl
    } else {
      data.trackingUrl = null
    }
  }

  // Auto-generate canonical carrier URL if trackingUrl is not explicitly set
  const effectiveCarrier = data.shippingCarrier !== undefined ? data.shippingCarrier : order.shippingCarrier
  const effectiveTrackingNum = data.trackingNumber !== undefined ? data.trackingNumber : order.trackingNumber
  const effectiveTrackingUrl = data.trackingUrl !== undefined ? data.trackingUrl : order.trackingUrl

  if (!effectiveTrackingUrl && effectiveCarrier && effectiveTrackingNum) {
    const autoUrl = resolveTrackingUrl(effectiveCarrier, effectiveTrackingNum)
    if (autoUrl) {
      data.trackingUrl = autoUrl
    }
  }

  if (isLegacy && nextStatus === order.status) {
    throw new HttpError(400, `This order is already ${nextStatus}.`)
  }

  if (Object.keys(data).length === 0) {
    const existing = await prisma.order.findUnique({ where: { id: orderId }, include: ADMIN_ORDER_INCLUDE })
    return serializeOrder(existing, { admin: true })
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
    include: ADMIN_ORDER_INCLUDE,
  })

  return serializeOrder(updated, { admin: true })
}
