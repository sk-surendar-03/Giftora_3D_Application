import { DEFAULT_STAND_PRICE_PER_CM3_CENTS, DEFAULT_STAND_CATEGORY_BASE_PRICES } from '../settings/settingsService.js'

export const STAND_SCHEMA_VERSION = 1
export const MAX_STL_BYTES = 50 * 1024 * 1024
export const MAX_PREVIEW_BYTES = 2 * 1024 * 1024

export const CATEGORIES = {
  'phone-stand':       { name: 'Phone Stand' },
  'pen-holder':        { name: 'Pen Holder' },
  'combined':          { name: 'Combined Phone + Pen Stand' },
  'desk-organizer':    { name: 'Desk Organizer' },
  'personalized-gift': { name: 'Personalized Gift Stand' },
}

export const FINISHES = ['matte', 'satin', 'metallic-gold', 'metallic-silver', 'metallic-copper', 'two-tone', 'gradient', 'wood-grain', 'marble']

export const FONTS = ['modern-sans', 'bold', 'serif', 'rounded', 'futuristic', 'handwritten', 'cursive', 'playful']

export const MOTIFS = ['none', 'star', 'heart', 'flower', 'leaf', 'gear', 'hexagon', 'diamond']

export const THEMES = ['minimalist', 'luxury-executive', 'gaming-rgb', 'modern-geometric', 'cute-pastel', 'industrial', 'nature-inspired', 'futuristic', 'corporate-gift', 'kids-student']

/**
 * Compute the total price for a stand design from its final bounding volume.
 * Price comes from admin config (DB), not hardcoded.
 * Called by standDesignService.storeStl and cartService.addStandItem.
 */
export function priceForStand(category, solidVolumeCm3, config) {
  const cfg = config || { pricePerCm3Cents: DEFAULT_STAND_PRICE_PER_CM3_CENTS, categories: {} }
  const base = cfg.categories?.[category]?.basePriceCents ?? DEFAULT_STAND_CATEGORY_BASE_PRICES[category] ?? 50000
  const perCm3 = cfg.pricePerCm3Cents ?? DEFAULT_STAND_PRICE_PER_CM3_CENTS
  const volumeFee = Math.max(0, Math.round(solidVolumeCm3 * perCm3))
  return base + volumeFee
}

/** The public shape served by GET /stand-designer/options. */
export async function buildPublicOptions() {
  const { getStandPricingConfig } = await import('../settings/settingsService.js')
  const config = await getStandPricingConfig()
  return {
    schemaVersion: STAND_SCHEMA_VERSION,
    categories: Object.entries(CATEGORIES).map(([id, c]) => ({
      id,
      name: c.name,
      basePriceCents: config.categories?.[id]?.basePriceCents ?? DEFAULT_STAND_CATEGORY_BASE_PRICES[id] ?? 50000,
    })),
    finishes: FINISHES,
    fonts: FONTS,
    motifs: MOTIFS,
    themes: THEMES,
    pricePerCm3Cents: config.pricePerCm3Cents ?? DEFAULT_STAND_PRICE_PER_CM3_CENTS,
    stl: { maxBytes: MAX_STL_BYTES },
    previewMaxBytes: MAX_PREVIEW_BYTES,
  }
}