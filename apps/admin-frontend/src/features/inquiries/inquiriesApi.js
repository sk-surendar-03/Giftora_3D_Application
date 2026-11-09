import api from '../../services/api'

export async function fetchInquiries(params) {
  const { data } = await api.get('/admin/inquiries', { params })
  return data
}

export async function fetchNewInquiryCount() {
  const { data } = await api.get('/admin/inquiries/count')
  return data.count
}

export async function fetchInquiry(id) {
  const { data } = await api.get(`/admin/inquiries/${id}`)
  return data
}

export async function updateInquiryStatus(id, status) {
  const { data } = await api.patch(`/admin/inquiries/${id}`, { status })
  return data
}
