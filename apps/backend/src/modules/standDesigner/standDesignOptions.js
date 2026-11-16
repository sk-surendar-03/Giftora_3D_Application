// Server-side allow-list for the stand customizer. Mirrors the frontend's
// features/standStudio/types/design.ts and core/defaults.ts. The server only
// accepts categories, finishes, fonts, motifs from these lists — anything
// else is rejected. A parity test can be added later.

export const STAND_SCHEMA_VERSION = 1

export const MAX_STL_BYTES = 50 * 1024 * 1024
export const MAX_PREVIEW_BYTES = 2 * 1024 * 1024

export const CATEGORIES = {
  'phone-stand':       { name: 'Phone Stand',       basePriceCents: 50000 },
  'pen-holder':        { name: 'Pen Holder',        basePriceCents: 60000 },
  'combined':          { name: 'Combined Phone + Pen Stand', basePriceCents: 90000 },
  'desk-organizer':    { name: 'Desk Organizer',    basePriceCents: 120000 },
  'personalized-gift': { name: 'Personalized Gift Stand', basePriceCents: 80000 },
}

export const FINISHES = ['matte', 'satin', 'metallic-gold', 'metallic-silver', 'metallic-copper', 'two-tone', 'gradient', 'wood-grain', 'marble']

export const FONTS = ['modern-sans', 'bold', 'serif', 'rounded', 'futuristic', 'handwritten', 'cursive', 'playful']

export const MOTIFS = ['none', 'star', 'heart', 'flower', 'leaf', 'gear', 'hexagon', 'diamond']

export const THEMES = ['minimalist', 'luxury-executive', 'gaming-rgb', 'modern-geometric', 'cute-pastel', 'industrial', 'nature-inspired', 'futuristic', 'corporate-gift', 'kids-student']

// Volume-based price add-on on top of category base price. Admin-configurable
// later; hardcoded for now.
export const PRICE_PER_CM3_CENTS = 100

/**
 * Compute the total price for a stand design from its final bounding volume.
 * Called by standDesignService.createStandDesign.
 */
export function priceForStand(category, solidVolumeCm3) {
  const base = CATEGORIES[category]?.basePriceCents ?? 50000
  const volumeFee = Math.max(0, Math.round(solidVolumeCm3 * PRICE_PER_CM3_CENTS))
  return base + volumeFee
}

/** The public shape served by GET /stand-designer/options. */
export function buildPublicOptions() {
  return {
    schemaVersion: STAND_SCHEMA_VERSION,
    categories: Object.entries(CATEGORIES).map(([id, c]) => ({
      id,
      name: c.name,
      basePriceCents: c.basePriceCents,
    })),
    finishes: FINISHES,
    fonts: FONTS,
    motifs: MOTIFS,
    themes: THEMES,
    pricePerCm3Cents: PRICE_PER_CM3_CENTS,
    stl: { maxBytes: MAX_STL_BYTES },
    previewMaxBytes: MAX_PREVIEW_BYTES,
  }
}