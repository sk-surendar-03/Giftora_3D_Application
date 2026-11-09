import api from '../../services/api'

// With an admin Bearer token attached (see services/api.js's interceptor),
// the backend's GET /products already includes inactive products — see
// productService.listProducts's `includeInactive` branch (Phase 3).
export async function fetchAdminProducts(params = {}) {
  const { data } = await api.get('/products', { params: { pageSize: 20, ...params } })
  return data // { products, meta }
}

export async function fetchAdminProductBySlug(slug) {
  const { data } = await api.get(`/products/${encodeURIComponent(slug)}`)
  return data.product
}

export async function createProduct(payload) {
  const { data } = await api.post('/products', payload)
  return data.product
}

export async function updateProduct(id, payload) {
  const { data } = await api.patch(`/products/${id}`, payload)
  return data.product
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`)
}
