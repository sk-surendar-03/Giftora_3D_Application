import api from '../../../services/api'

export async function fetchPhotoLampOptions() {
  const res = await api.get('/photo-lamp-designer/options')
  return res.data?.options
}

export async function uploadPhotoLampImage(blobOrFile, mimeType = 'image/jpeg') {
  const resolvedMime = blobOrFile.type || mimeType || 'image/jpeg'
  const res = await api.post('/photo-lamp-designs/photos', blobOrFile, {
    headers: { 'Content-Type': resolvedMime },
    transformRequest: [(body) => body],
    maxBodyLength: Infinity,
  })
  return res.data
}

export async function createPhotoLampDesign(input) {
  const res = await api.post('/photo-lamp-designs', input)
  return res.data?.design
}

export async function uploadPhotoLampStl(designId, buffer, sha256) {
  const headers = { 'Content-Type': 'application/octet-stream' }
  if (sha256) {
    headers['X-STL-SHA256'] = sha256
    headers['X-Content-SHA256'] = sha256
  }
  const res = await api.put(`/photo-lamp-designs/${designId}/stl`, buffer, {
    headers,
    transformRequest: [(body) => body],
    maxBodyLength: Infinity,
  })
  return res.data?.design
}

export async function uploadPhotoLampBaseStl(designId, buffer, sha256) {
  const headers = { 'Content-Type': 'application/octet-stream' }
  if (sha256) {
    headers['X-STL-SHA256'] = sha256
    headers['X-Content-SHA256'] = sha256
  }
  const res = await api.put(`/photo-lamp-designs/${designId}/base-stl`, buffer, {
    headers,
    transformRequest: [(body) => body],
    maxBodyLength: Infinity,
  })
  return res.data?.design
}

export async function uploadPhotoLampPreview(designId, blob) {
  const res = await api.put(`/photo-lamp-designs/${designId}/preview`, blob, {
    headers: { 'Content-Type': 'image/png' },
    transformRequest: [(body) => body],
    maxBodyLength: Infinity,
  })
  return res.data?.design
}

export async function fetchPhotoLampPreviewBlob(designId, signal) {
  const res = await api.get(`/photo-lamp-designs/${designId}/preview`, { responseType: 'blob', signal })
  return res.data
}

export async function addPhotoLampToCart({ lithophaneDesignId, quantity, shippingMethod, note }) {
  const res = await api.post('/cart/photo-lamp', {
    lithophaneDesignId,
    quantity,
    shippingMethod,
    note,
  })
  return res.data
}
