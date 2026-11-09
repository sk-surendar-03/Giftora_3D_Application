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

// Product photo image upload (JPG / PNG / WEBP). Sent as a raw binary body;
// the backend validates signatures and stores the file in persistent storage.
export async function uploadProductImage(file, onProgress) {
  const { data } = await api.post('/products/images', file, {
    params: { filename: file.name },
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })
  return data.image // { url, key, filename, format, sizeBytes }
}

// STL/3MF preview model. Sent as a raw binary body (never Base64); the
// backend stores the file and keeps only a storage key on the product.
export async function uploadProductModel(id, file, onProgress) {
  const { data } = await api.put(`/products/${id}/model`, file, {
    params: { filename: file.name },
    headers: { 'Content-Type': 'application/octet-stream' },
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })
  return data.product
}

export async function deleteProductModel(id) {
  const { data } = await api.delete(`/products/${id}/model`)
  return data.product
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`)
}
