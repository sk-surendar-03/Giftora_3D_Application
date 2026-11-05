import api from '../../services/api'

export async function fetchOrders(params = {}) {
  const { data } = await api.get('/admin/orders', { params: { pageSize: 50, ...params } })
  return data // { orders, meta }
}

export async function fetchOrder(id) {
  const { data } = await api.get(`/admin/orders/${id}`)
  return data.order
}

export async function updateOrderStatus(id, status) {
  const { data } = await api.patch(`/admin/orders/${id}/status`, { status })
  return data.order
}
