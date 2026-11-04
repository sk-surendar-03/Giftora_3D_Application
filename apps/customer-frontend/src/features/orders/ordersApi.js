import api from '../../services/api'

export async function createOrder(addressId, idempotencyKey) {
  const { data } = await api.post('/orders', { addressId, idempotencyKey })
  return data.order
}

export async function fetchOrder(orderId, signal) {
  const { data } = await api.get(`/orders/${orderId}`, { signal })
  return data.order
}

export async function fetchOrders(signal) {
  const { data } = await api.get('/orders', { signal })
  return data.orders
}
