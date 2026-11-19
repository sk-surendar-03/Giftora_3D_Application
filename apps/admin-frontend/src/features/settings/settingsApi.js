import api from '../../services/api'

export async function fetchPricing() {
  const { data } = await api.get('/settings/pricing')
  return data.pricing
}

export async function updatePricing({ perCharacterPriceCents, baseCharacters, basePriceCents }) {
  const { data } = await api.patch('/admin/settings/pricing', { perCharacterPriceCents, baseCharacters, basePriceCents })
  return data.pricing
}

export async function fetchAnnouncement() {
  const { data } = await api.get('/settings/announcement')
  return data.announcement
}

export async function updateAnnouncement({ text, enabled }) {
  const { data } = await api.patch('/admin/settings/announcement', { text, enabled })
  return data.announcement
}

export async function fetchCustomizerColors() {
  const { data } = await api.get('/settings/customizer/colors')
  return data.colors
}

export async function updateCustomizerColors(colors) {
  const { data } = await api.patch('/admin/settings/customizer/colors', { colors })
  return data.colors
}

export async function fetchCustomizerShipping() {
  const { data } = await api.get('/settings/customizer/shipping')
  return data.methods
}

export async function updateCustomizerShipping(methods) {
  const { data } = await api.patch('/admin/settings/customizer/shipping', { methods })
  return data.methods
}

export async function fetchCustomizerSizes() {
  const { data } = await api.get('/settings/customizer/sizes')
  return data.sizes
}

export async function updateCustomizerSizes(sizes) {
  const { data } = await api.patch('/admin/settings/customizer/sizes', { sizes })
  return data.sizes
}

export async function fetchCustomizerThicknesses() {
  const { data } = await api.get('/settings/customizer/thicknesses')
  return data.thicknesses
}

export async function updateCustomizerThicknesses(thicknesses) {
  const { data } = await api.patch('/admin/settings/customizer/thicknesses', { thicknesses })
  return data.thicknesses
}

export async function fetchStandPricing() {
  const { data } = await api.get('/settings/stand-pricing')
  return data.standPricing
}

export async function updateStandPricing({ pricePerCm3Cents, categories }) {
  const { data } = await api.patch('/admin/settings/stand-pricing', { pricePerCm3Cents, categories })
  return data.standPricing
}

export async function fetchNameplatePricing() {
  const { data } = await api.get('/settings/nameplate-pricing')
  return data.nameplatePricing
}

export async function updateNameplatePricing({ pricePerCm3Cents, ledGlowSurchargeCents, layeredBackingSurchargeCents, types }) {
  const { data } = await api.patch('/admin/settings/nameplate-pricing', {
    pricePerCm3Cents,
    ledGlowSurchargeCents,
    layeredBackingSurchargeCents,
    types,
  })
  return data.nameplatePricing
}
