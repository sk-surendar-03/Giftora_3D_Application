import api from '../../services/api'

export async function fetchWishlist(signal) {
  const { data } = await api.get('/wishlist', { signal })
  return data // { items, productIds }
}

export async function addWishlist(productId) {
  const { data } = await api.post('/wishlist', { productId })
  return data.item
}

export async function removeWishlist(productId) {
  const { data } = await api.delete(`/wishlist/${productId}`)
  return data
}
