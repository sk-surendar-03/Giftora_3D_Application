import api from '../../services/api'

// Thin wrappers around the Phase 3 backend endpoints, using the existing
// shared `services/api.js` axios client (same baseURL/config every other
// API call in this app would use).
export async function fetchProducts(params, signal) {
  const { data } = await api.get('/products', { params, signal })
  return data // { products, meta }
}

export async function fetchProductBySlug(slug, signal) {
  const { data } = await api.get(`/products/${encodeURIComponent(slug)}`, { signal })
  return data.product
}
