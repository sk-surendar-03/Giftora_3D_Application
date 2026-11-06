import { prisma } from '../../config/db.js'

const PRICING_KEY = 'customizer_pricing'

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
