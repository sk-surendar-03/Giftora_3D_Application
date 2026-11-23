import api from '../../../services/api'

export async function fetchQrStandOptions() {
  const res = await api.get('/qr-stand-designer/options')
  return res.data?.options
}

export async function createQrStandDesign(input) {
  const res = await api.post('/qr-stand-designs', input)
  return res.data?.design
}

export async function uploadQrStandStl(designId, buffer, sha256) {
  const headers = { 'Content-Type': 'application/octet-stream' }
  if (sha256) {
    headers['X-STL-SHA256'] = sha256
    headers['X-Content-SHA256'] = sha256
  }
  const res = await api.put(`/qr-stand-designs/${designId}/stl`, buffer, {
    headers,
    transformRequest: [(body) => body],
    maxBodyLength: Infinity,
  })
  return res.data?.design
}

export async function uploadQrStandPreview(designId, blob) {
  const res = await api.put(`/qr-stand-designs/${designId}/preview`, blob, {
    headers: { 'Content-Type': 'image/png' },
    transformRequest: [(body) => body],
    maxBodyLength: Infinity,
  })
  return res.data?.design
}

export async function fetchQrStandPreviewBlob(designId, signal) {
  const res = await api.get(`/qr-stand-designs/${designId}/preview`, { responseType: 'blob', signal })
  return res.data
}

export async function addQrStandToCart({ qrStandDesignId, quantity, shippingMethod, note }) {
  const res = await api.post('/cart/qr-stand', {
    qrStandDesignId,
    quantity,
    shippingMethod,
    note,
  })
  return res.data
}
