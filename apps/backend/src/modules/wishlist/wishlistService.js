import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'

/**
 * Returns all wishlisted products for a user.
 * Each item contains the wishlisted productId, addedAt, and the product details.
 */
export async function listWishlist(userId) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    createdAt: item.createdAt,
    product: item.product,
  }))
}

/**
 * Returns just the list of wishlisted product IDs for fast lookup on catalog cards.
 */
export async function listWishlistProductIds(userId) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  })
  return items.map((item) => item.productId)
}

/**
 * Adds a product to user's wishlist idempotently.
 */
export async function addToWishlist(userId, productId) {
  if (!productId || typeof productId !== 'string') {
    throw new HttpError(400, 'productId is required.')
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  })
  if (!product) {
    throw new HttpError(404, 'Product not found.')
  }

  // Idempotent upsert so duplicate requests never throw error
  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    create: {
      userId,
      productId,
    },
    update: {},
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  })

  return {
    id: item.id,
    productId: item.productId,
    createdAt: item.createdAt,
    product: item.product,
  }
}

/**
 * Removes a product from user's wishlist by productId.
 */
export async function removeFromWishlist(userId, productId) {
  if (!productId || typeof productId !== 'string') {
    throw new HttpError(400, 'productId is required.')
  }

  await prisma.wishlistItem.deleteMany({
    where: {
      userId,
      productId,
    },
  })

  return { success: true, productId }
}
