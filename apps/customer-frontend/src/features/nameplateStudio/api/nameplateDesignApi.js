import api from '../../../services/api'

export async function fetchNameplateOptions() {
  const res = await api.get('/nameplate-designer/options')
  return res.data?.options
}

export async function createNameplateDesign(input) {
  const res = await api.post('/nameplate-designs', input)
  return res.data?.design
}

export async function uploadNameplateStl(designId, buffer, sha256) {
  const res = await api.put(`/nameplate-designs/${designId}/stl`, buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      ...(sha256 ? { 'X-STL-SHA256': sha256 } : {}),
    },
  })
  return res.data?.design
}

export async function uploadNameplatePreview(designId, blob) {
  const res = await api.put(`/nameplate-designs/${designId}/preview`, blob, {
    headers: { 'Content-Type': 'image/png' },
  })
  return res.data?.design
}

export async function fetchNameplatePreviewBlob(designId, signal) {
  const res = await api.get(`/nameplate-designs/${designId}/preview`, { responseType: 'blob', signal })
  return res.data
}
