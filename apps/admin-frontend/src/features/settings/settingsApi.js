import api from '../../services/api'

export async function fetchPricing() {
  const { data } = await api.get('/settings/pricing')
  return data.pricing
}

export async function updatePricing(perCharacterPriceCents) {
  const { data } = await api.patch('/admin/settings/pricing', { perCharacterPriceCents })
  return data.pricing
}
