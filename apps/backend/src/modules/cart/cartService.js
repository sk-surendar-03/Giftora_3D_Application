import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'

const CART_INCLUDE = { items: { include: { product: true }, orderBy: { createdAt: 'asc' } } }

export async function getOrCreateCart(userId) {
  const existing = await prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE })
  if (existing) return existing
  return prisma.cart.create({ data: { userId }, include: CART_INCLUDE })
}

function sameCustomization(a, b) {
  // Both are plain JSON values (or null/undefined) — a stable string
  // comparison is enough since the frontend always sends the same key
  // order for a given selection set.
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

export async function addItem(userId, { productId, quantity, customization }) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) {
    throw new HttpError(404, 'Product not found or unavailable.')
  }

  const cart = await getOrCreateCart(userId)
  const existingItem = cart.items.find((item) => item.productId === productId && sameCustomization(item.customization, customization))

  if (existingItem) {
    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
      include: { product: true },
    })
    return updated
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
      customization: customization ?? undefined,
      // Snapshot the price at add-time — standard ecommerce practice, so a
      // later price change doesn't silently alter what's already in a
      // customer's cart.
      unitPriceCents: product.priceCents,
    },
    include: { product: true },
  })
}

async function findOwnedItem(userId, itemId) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } })
  if (!item || item.cart.userId !== userId) {
    // Same 404 whether the item doesn't exist or belongs to someone else —
    // never reveal that a given cart-item id belongs to another account.
    throw new HttpError(404, 'Cart item not found.')
  }
  return item
}

export async function updateItemQuantity(userId, itemId, quantity) {
  await findOwnedItem(userId, itemId)
  return prisma.cartItem.update({ where: { id: itemId }, data: { quantity }, include: { product: true } })
}

export async function removeItem(userId, itemId) {
  await findOwnedItem(userId, itemId)
  await prisma.cartItem.delete({ where: { id: itemId } })
}
