import api from '../../services/api'

export async function fetchStandOptions(signal) {
  const { data } = await api.get('/stand-designer/options', { signal })
  return data.options
}

export async function createStandDesign(designConfig) {
  const { data } = await api.post('/stand-designs', designConfig)
  return data
}

export async function uploadStandStl(designId, stlBlob, options) {
  const opts = options || {}
  const headers = { 'Content-Type': 'application/octet-stream' }
  if (opts.sha256) headers['X-Content-SHA256'] = opts.sha256
  // Volume is measured server-side from the STL; no volume header is sent.

  const { data } = await api.put('/stand-designs/' + designId + '/stl', stlBlob, {
    headers,
    transformRequest: [(body) => body],
    maxBodyLength: Infinity,
  })
  return data.design
}

export async function uploadStandPreview(designId, pngBlob) {
  const { data } = await api.put('/stand-designs/' + designId + '/preview', pngBlob, {
    headers: { 'Content-Type': 'image/png' },
    transformRequest: [(body) => body],
  })
  return data.design
}

export async function addStandToCart(payload) {
  const { data } = await api.post('/cart/stand-items', payload)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('giftora:cart-updated', { detail: data.cart }))
  }
  return data.cart
}

export async function fetchStandPreviewBlob(designId, signal) {
  const { data } = await api.get('/stand-designs/' + designId + '/preview', { responseType: 'blob', signal })
  return data
}