import { prisma } from '../../config/db.js'

const PRICING_KEY = 'customizer_pricing'
const ANNOUNCEMENT_KEY = 'announcement_bar'

// Used only until an admin sets a real rate via the admin UI.
export const DEFAULT_PER_CHARACTER_PRICE_CENTS = 500

export async function getPricingConfig() {
  const row = await prisma.setting.findUnique({ where: { key: PRICING_KEY } })
  const stored = row?.value?.perCharacterPriceCents
  const perCharacterPriceCents = Number.isInteger(stored) && stored >= 0 ? stored : DEFAULT_PER_CHARACTER_PRICE_CENTS
  return { perCharacterPriceCents }
}

export async function updatePricingConfig({ perCharacterPriceCents }) {
  await prisma.setting.upsert({
    where: { key: PRICING_KEY },
    create: { key: PRICING_KEY, value: { perCharacterPriceCents } },
    update: { value: { perCharacterPriceCents } },
  })
  return { perCharacterPriceCents }
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
