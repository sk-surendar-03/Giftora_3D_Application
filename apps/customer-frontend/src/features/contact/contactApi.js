import api from '../../services/api'

export async function submitContactInquiry(inquiryData) {
  const { data } = await api.post('/contact', inquiryData)
  return data
}
