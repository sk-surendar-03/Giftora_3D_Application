import api from '../../services/api'

export async function fetchDesignOptions(signal) {
  const { data } = await api.get('/customizer/options', { signal })
  return data.options
}

/** Validates the design on the server and records it. Safe to repeat: the same design returns the same record. */
export async function createDesign(design) {
  const { data } = await api.post('/custom-designs', design)
  return data // { design, needsStl }
}

export async function uploadDesignStl(designId, stlBytes, sha256) {
  const { data } = await api.put(`/custom-designs/${designId}/stl`, stlBytes, {
    headers: { 'Content-Type': 'application/octet-stream', ...(sha256 ? { 'X-Content-SHA256': sha256 } : {}) },
    // Binary body: skip axios' JSON handling.
    transformRequest: [(body) => body],
    maxBodyLength: Infinity,
  })
  return data.design
}

export async function uploadDesignPreview(designId, pngBlob) {
  const { data } = await api.put(`/custom-designs/${designId}/preview`, pngBlob, {
    headers: { 'Content-Type': 'image/png' },
    transformRequest: [(body) => body],
  })
  return data.design
}

export async function addCustomDesignToCart({ customDesignId, quantity }) {
  const { data } = await api.post('/cart/custom-items', { customDesignId, quantity })
  return data.cart
}

export async function fetchDesignPreviewBlob(designId, signal) {
  const { data } = await api.get(`/custom-designs/${designId}/preview`, { responseType: 'blob', signal })
  return data
}
