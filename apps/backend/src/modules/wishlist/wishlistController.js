import { listWishlist, listWishlistProductIds, addToWishlist, removeFromWishlist } from './wishlistService.js'

export async function getWishlist(req, res) {
  const items = await listWishlist(req.user.id)
  const productIds = items.map((i) => i.productId)
  res.json({ items, productIds })
}

export async function addWishlistItem(req, res) {
  const { productId } = req.body ?? {}
  const item = await addToWishlist(req.user.id, productId)
  res.status(201).json({ item })
}

export async function removeWishlistItem(req, res) {
  const { productId } = req.params
  const result = await removeFromWishlist(req.user.id, productId)
  res.json(result)
}
