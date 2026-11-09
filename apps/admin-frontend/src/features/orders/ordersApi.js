import api from '../../services/api'

export async function fetchOrders(params = {}) {
  const { data } = await api.get('/admin/orders', { params: { pageSize: 20, ...params } })
  return data // { orders, meta }
}

export async function fetchOrder(id) {
  const { data } = await api.get(`/admin/orders/${id}`)
  return data.order
}

export async function updateOrderStatus(id, payload) {
  const body = typeof payload === 'string' ? { status: payload } : payload
  const { data } = await api.patch(`/admin/orders/${id}/status`, body)
  return data.order
}

export async function fetchOrderItemStlBlob(orderId, itemId, signal) {
  const { data } = await api.get(`/admin/orders/${orderId}/items/${itemId}/stl`, {
    responseType: 'blob',
    signal,
  })
  return data
}

export async function fetchOrderItem3mfBlob(orderId, itemId, signal) {
  const { data } = await api.get(`/admin/orders/${orderId}/items/${itemId}/3mf`, {
    responseType: 'blob',
    signal,
  })
  return data
}

export async function fetchOrderItemPreviewBlob(orderId, itemId, signal) {
  const { data } = await api.get(`/admin/orders/${orderId}/items/${itemId}/preview`, {
    responseType: 'blob',
    signal,
  })
  return data
}
