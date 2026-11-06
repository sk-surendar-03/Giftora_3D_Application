import api from '../../services/api'

export async function fetchPricing(signal) {
  const { data } = await api.get('/settings/pricing', { signal })
  return data.pricing
}
