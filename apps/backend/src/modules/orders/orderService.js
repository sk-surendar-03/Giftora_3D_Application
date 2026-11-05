import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { generateOrderNumber } from './orderNumber.js'
import { parsePagination, buildMeta } from '../../utils/pagination.js'

const CART_INCLUDE = { items: { include: { product: true }, orderBy: { createdAt: 'asc' } } }
const ORDER_INCLUDE = { items: true }

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
      return existing
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

        const unavailable = cart.items.filter((item) => !item.product.isActive)
        if (unavailable.length > 0) {
          throw new HttpError(409, `${unavailable.map((i) => i.product.name).join(', ')} ${unavailable.length > 1 ? 'are' : 'is'} no longer available. Please remove ${unavailable.length > 1 ? 'them' : 'it'} from your cart before placing this order.`)
        }

        // Use each cart item's own snapshotted unitPriceCents (the real,
        // per-character customizer price computed at add-to-cart time), not
        // the product's own base priceCents — customizer products have no
        // separate base price; see cartService.js's addItem.
        const subtotalCents = cart.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
        const shippingCents = 0
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
              create: cart.items.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                productSlug: item.product.slug,
                productImage: item.product.images?.[0] ?? null,
                quantity: item.quantity,
                customization: item.customization ?? undefined,
                unitPriceCents: item.unitPriceCents,
              })),
            },
          },
          include: ORDER_INCLUDE,
        })

        // Clear the cart only now that the order has actually been created
        // (same transaction — both commit together or neither does).
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

        return order
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
        if (existing) return existing
      }
      throw err
    }
  }

  throw new HttpError(500, 'Could not create the order. Please try again.')
}

export async function listOrders(userId) {
  return prisma.order.findMany({ where: { userId }, include: ORDER_INCLUDE, orderBy: { createdAt: 'desc' } })
}

export async function getOrder(userId, orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE })
  if (!order || order.userId !== userId) {
    throw new HttpError(404, 'Order not found.')
  }
  return order
}

const ADMIN_ORDER_INCLUDE = {
  items: true,
  user: { select: { id: true, name: true, email: true } },
}

/**
 * Unlike `listOrders`/`getOrder` above (scoped to the calling customer),
 * these three are for the admin order-management screens and deliberately
 * have no `userId` filter — an admin can see and manage every customer's
 * orders. Access to these functions must only ever be reached through a
 * route gated by `authorize('ADMIN')` (see adminOrderRoutes.js).
 */
export async function listOrdersForAdmin({ page, pageSize, search, status }) {
  const pagination = parsePagination({ page, pageSize })

  const where = {
    ...(status ? { status } : {}),
    // No `mode: 'insensitive'` (Postgres-only) — MySQL's default collation
    // is already case-insensitive.
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search } },
            { user: { name: { contains: search } } },
            { user: { email: { contains: search } } },
          ],
        }
      : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: ADMIN_ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.take }),
    prisma.order.count({ where }),
  ])

  return { orders, meta: buildMeta(pagination, total) }
}

export async function getOrderForAdmin(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ADMIN_ORDER_INCLUDE })
  if (!order) throw new HttpError(404, 'Order not found.')
  return order
}

// The allowed order-processing workflow. A terminal status (CANCELLED,
// REFUNDED) has no further transitions. Anything not listed as a valid
// "next" status for the order's current status is rejected — this is the
// backend validation the requirements ask for, not just accepting any enum
// value.
const ALLOWED_TRANSITIONS = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

export async function updateOrderStatus(orderId, nextStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new HttpError(404, 'Order not found.')

  if (order.status === nextStatus) {
    throw new HttpError(400, `This order is already ${nextStatus}.`)
  }
  if (!ALLOWED_TRANSITIONS[order.status]?.includes(nextStatus)) {
    throw new HttpError(400, `Cannot change an order from ${order.status} to ${nextStatus}.`)
  }

  return prisma.order.update({ where: { id: orderId }, data: { status: nextStatus }, include: ADMIN_ORDER_INCLUDE })
}
