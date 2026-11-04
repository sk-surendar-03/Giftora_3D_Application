import api from '../../services/api'

export async function fetchCart(signal) {
  const { data } = await api.get('/cart', { signal })
  return data.cart
}

export async function addCartItem({ productId, quantity, customization }) {
  const { data } = await api.post('/cart/items', { productId, quantity, customization })
  return data.cart
}

export async function updateCartItemQuantity(itemId, quantity) {
  const { data } = await api.patch(`/cart/items/${itemId}`, { quantity })
  return data.cart
}

export async function removeCartItem(itemId) {
  const { data } = await api.delete(`/cart/items/${itemId}`)
  return data.cart
}
