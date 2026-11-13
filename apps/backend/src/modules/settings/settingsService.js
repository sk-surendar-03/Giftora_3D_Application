import { prisma } from '../../config/db.js'

const PRICING_KEY = 'customizer_pricing'
const ANNOUNCEMENT_KEY = 'announcement_bar'
const COLORS_KEY = 'customizer_colors'
const SHIPPING_KEY = 'customizer_shipping'
const SIZES_KEY = 'customizer_sizes'
const THICKNESSES_KEY = 'customizer_thicknesses'

export const DEFAULT_PER_CHARACTER_PRICE_CENTS = 500
export const DEFAULT_BASE_CHARACTERS = 10
export const DEFAULT_BASE_PRICE_CENTS = 0

export async function getPricingConfig() {
  const row = await prisma.setting.findUnique({ where: { key: PRICING_KEY } })
  const v = row?.value ?? {}
  const perCharacterPriceCents = Number.isInteger(v.perCharacterPriceCents) && v.perCharacterPriceCents >= 0 ? v.perCharacterPriceCents : DEFAULT_PER_CHARACTER_PRICE_CENTS
  const baseCharacters = Number.isInteger(v.baseCharacters) && v.baseCharacters >= 0 ? v.baseCharacters : DEFAULT_BASE_CHARACTERS
  const basePriceCents = Number.isInteger(v.basePriceCents) && v.basePriceCents >= 0 ? v.basePriceCents : DEFAULT_BASE_PRICE_CENTS
  return { perCharacterPriceCents, baseCharacters, basePriceCents }
}

export async function updatePricingConfig({ perCharacterPriceCents, baseCharacters, basePriceCents }) {
  const current = await getPricingConfig()
  const next = {
    perCharacterPriceCents: Number.isInteger(perCharacterPriceCents) && perCharacterPriceCents >= 0 ? perCharacterPriceCents : current.perCharacterPriceCents,
    baseCharacters: Number.isInteger(baseCharacters) && baseCharacters >= 0 ? baseCharacters : current.baseCharacters,
    basePriceCents: Number.isInteger(basePriceCents) && basePriceCents >= 0 ? basePriceCents : current.basePriceCents,
  }
  await prisma.setting.upsert({
    where: { key: PRICING_KEY },
    create: { key: PRICING_KEY, value: next },
    update: { value: next },
  })
  return next
}

export async function getCustomizerColors() {
  const row = await prisma.setting.findUnique({ where: { key: COLORS_KEY } })
  const colors = Array.isArray(row?.value?.colors) ? row.value.colors : []
  return { colors }
}

export async function updateCustomizerColors({ colors }) {
  const safe = Array.isArray(colors) ? colors.filter((c) => c && typeof c.name === 'string' && typeof c.hex === 'string') : []
  await prisma.setting.upsert({
    where: { key: COLORS_KEY },
    create: { key: COLORS_KEY, value: { colors: safe } },
    update: { value: { colors: safe } },
  })
  return { colors: safe }
}

export async function getCustomizerShipping() {
  const row = await prisma.setting.findUnique({ where: { key: SHIPPING_KEY } })
  const methods = Array.isArray(row?.value?.methods) ? row.value.methods : []
  return { methods }
}

export async function updateCustomizerShipping({ methods }) {
  const safe = Array.isArray(methods) ? methods.filter((m) => m && typeof m.name === 'string' && Number.isInteger(m.priceCents) && m.priceCents >= 0) : []
  await prisma.setting.upsert({
    where: { key: SHIPPING_KEY },
    create: { key: SHIPPING_KEY, value: { methods: safe } },
    update: { value: { methods: safe } },
  })
  return { methods: safe }
}

export async function getCustomizerSizes() {
  const row = await prisma.setting.findUnique({ where: { key: SIZES_KEY } })
  const sizes = Array.isArray(row?.value?.sizes) ? row.value.sizes : []
  return { sizes }
}

export async function updateCustomizerSizes({ sizes }) {
  const safe = Array.isArray(sizes) ? sizes.filter((s) => s && typeof s.name === 'string' && Number.isInteger(s.priceCents) && s.priceCents >= 0) : []
  await prisma.setting.upsert({
    where: { key: SIZES_KEY },
    create: { key: SIZES_KEY, value: { sizes: safe } },
    update: { value: { sizes: safe } },
  })
  return { sizes: safe }
}

export async function getCustomizerThicknesses() {
  const row = await prisma.setting.findUnique({ where: { key: THICKNESSES_KEY } })
  const thicknesses = Array.isArray(row?.value?.thicknesses) ? row.value.thicknesses : []
  return { thicknesses }
}

export async function updateCustomizerThicknesses({ thicknesses }) {
  const safe = Array.isArray(thicknesses)
    ? thicknesses
        .filter((t) => t && typeof t.name === 'string' && Number.isInteger(t.priceCents) && t.priceCents >= 0)
        .map((t) => ({
          name: t.name,
          priceCents: t.priceCents,
          ...(typeof t.mm === 'number' && t.mm > 0 ? { mm: t.mm } : {}),
          ...(typeof t.displayValue === 'number' && t.displayValue > 0 ? { displayValue: t.displayValue } : {}),
          ...(typeof t.displayUnit === 'string' ? { displayUnit: t.displayUnit } : {}),
        }))
    : []
  await prisma.setting.upsert({
    where: { key: THICKNESSES_KEY },
    create: { key: THICKNESSES_KEY, value: { thicknesses: safe } },
    update: { value: { thicknesses: safe } },
  })
  return { thicknesses: safe }
}

export async function getAnnouncementConfig() {
  const row = await prisma.setting.findUnique({ where: { key: ANNOUNCEMENT_KEY } })
  const text = typeof row?.value?.text === 'string' ? row.value.text : ''
  const enabled = typeof row?.value?.enabled === 'boolean' ? row.value.enabled : false
  return { text, enabled }
}

export async function updateAnnouncementConfig({ text, enabled }) {
  const current = await getAnnouncementConfig()
  const safeText = text !== undefined ? (typeof text === 'string' ? text.trim() : '') : current.text
  const safeEnabled = enabled !== undefined ? Boolean(enabled) : current.enabled

  await prisma.setting.upsert({
    where: { key: ANNOUNCEMENT_KEY },
    create: { key: ANNOUNCEMENT_KEY, value: { text: safeText, enabled: safeEnabled } },
    update: { value: { text: safeText, enabled: safeEnabled } },
  })
  return { text: safeText, enabled: safeEnabled }
}
