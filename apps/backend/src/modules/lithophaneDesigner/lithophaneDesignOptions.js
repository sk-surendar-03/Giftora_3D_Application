export const LITHOPHANE_SCHEMA_VERSION = 1

export const DEFAULT_LITHOPHANE_PRICE_PER_CM3_CENTS = 120 // ₹1.20 / cm³

export const DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES = {
  cylinder: 79900, // ₹799
  rectangle: 69900, // ₹699
  prism_4: 99900, // ₹999
  heart: 84900, // ₹849
  curved: 74900, // ₹749
  moon: 109900, // ₹1,099
  lantern_6: 129900, // ₹1,299
  medallion: 59900, // ₹599
  carousel_3: 139900, // ₹1,399
}

export const DEFAULT_LITHOPHANE_ADDON_PRICES = {
  ledPuckWarmWhiteCents: 15000, // ₹150 for Warm White LED puck kit
  ledPuckCoolWhiteCents: 15000, // ₹150 for Cool White LED puck kit
  ledPuckRgbRemoteCents: 25000, // ₹250 for Multi-color RGB LED with remote
  woodenBaseSurchargeCents: 25000, // ₹250 for Solid Wood / Weighted base
  baseEngravingSurchargeCents: 10000, // ₹100 for custom plinth text engraving
  premiumGiftBoxCents: 7500, // ₹75 for premium presentation box & card
}

export const LITHOPHANE_TEMPLATES = [
  {
    id: 'cylinder',
    name: 'Cylindrical 360° Wrap',
    category: 'Panoramic',
    photoCount: 1,
    defaultDimensions: { diameterMm: 90, heightMm: 120 },
    hasBase: true,
  },
  {
    id: 'rectangle',
    name: 'Rectangular Light Box',
    category: 'Desk',
    photoCount: 1,
    defaultDimensions: { widthMm: 90, heightMm: 120, depthMm: 3.2 },
    hasBase: true,
  },
  {
    id: 'prism_4',
    name: 'Four-Sided Pillar (4 Photos)',
    category: 'Multi-Panel',
    photoCount: 4,
    defaultDimensions: { widthMm: 70, heightMm: 120 },
    hasBase: true,
  },
  {
    id: 'heart',
    name: 'Heart-Shaped Lithophane',
    category: 'Romantic',
    photoCount: 1,
    defaultDimensions: { widthMm: 90, heightMm: 120 },
    hasBase: true,
  },
  {
    id: 'curved',
    name: 'Curved Portrait (110° Arc)',
    category: 'Portrait',
    photoCount: 1,
    defaultDimensions: { widthMm: 90, heightMm: 120, arcAngleDeg: 110 },
    hasBase: true,
  },
  {
    id: 'moon',
    name: 'Moon Sphere Lithophane',
    category: 'Spherical',
    photoCount: 1,
    defaultDimensions: { diameterMm: 90 },
    hasBase: true,
  },
  {
    id: 'lantern_6',
    name: 'Hexagonal Lantern (6 Photos)',
    category: 'Multi-Panel',
    photoCount: 6,
    defaultDimensions: { diameterMm: 110, heightMm: 120 },
    hasBase: true,
  },
  {
    id: 'medallion',
    name: 'Circular Medallion',
    category: 'Compact',
    photoCount: 1,
    defaultDimensions: { diameterMm: 90 },
    hasBase: true,
  },
  {
    id: 'carousel_3',
    name: 'Rotating Carousel (3 Photos)',
    category: 'Mechanical',
    photoCount: 3,
    defaultDimensions: { diameterMm: 90, heightMm: 120 },
    hasBase: true,
  },
]

export const VALID_TEMPLATE_IDS = new Set(LITHOPHANE_TEMPLATES.map((t) => t.id))
export const VALID_PUCK_TYPES = new Set(['warm_white', 'cool_white', 'rgb_remote', 'none'])
export const VALID_BASE_TYPES = new Set(['printed', 'wooden', 'none'])

/**
 * Calculates the authoritative server-side price for a 3D Lithophane Photo Lamp design.
 * Formula: Base Price (by template) + Volumetric PLA Price (cm³ * rate) + Selected Add-ons.
 */
export function priceForLithophane(templateId, solidVolumeCm3, designConfig, pricingConfig) {
  const basePrices = pricingConfig?.templates || DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES
  const baseEntry = basePrices[templateId]
  const basePriceCents =
    baseEntry && Number.isInteger(baseEntry.basePriceCents)
      ? baseEntry.basePriceCents
      : Number.isInteger(baseEntry)
        ? baseEntry
        : DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES[templateId] ?? 79900

  const ratePerCm3 =
    Number.isInteger(pricingConfig?.pricePerCm3Cents) && pricingConfig.pricePerCm3Cents >= 0
      ? pricingConfig.pricePerCm3Cents
      : DEFAULT_LITHOPHANE_PRICE_PER_CM3_CENTS

  const volume = Math.max(0, Number(solidVolumeCm3) || 0)
  const volumeCents = Math.round(volume * ratePerCm3)

  let addOnsCents = 0
  const addOns = pricingConfig?.addOns || DEFAULT_LITHOPHANE_ADDON_PRICES

  // Lighting puck kit add-on
  const puckType = designConfig?.lighting?.puckType
  if (puckType === 'warm_white') {
    addOnsCents += addOns.ledPuckWarmWhiteCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckWarmWhiteCents
  } else if (puckType === 'cool_white') {
    addOnsCents += addOns.ledPuckCoolWhiteCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckCoolWhiteCents
  } else if (puckType === 'rgb_remote') {
    addOnsCents += addOns.ledPuckRgbRemoteCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckRgbRemoteCents
  }

  // Base material add-on
  if (designConfig?.base?.type === 'wooden') {
    addOnsCents += addOns.woodenBaseSurchargeCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.woodenBaseSurchargeCents
  }

  // Base engraving personalization add-on
  if (designConfig?.personalization?.engravedText && String(designConfig.personalization.engravedText).trim().length > 0) {
    addOnsCents += addOns.baseEngravingSurchargeCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.baseEngravingSurchargeCents
  }

  // Premium packaging add-on
  if (designConfig?.packaging?.premiumGiftBox) {
    addOnsCents += addOns.premiumGiftBoxCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.premiumGiftBoxCents
  }

  return basePriceCents + volumeCents + addOnsCents
}

export function buildPublicOptions(pricingConfig) {
  const basePrices = pricingConfig?.templates || DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES
  const ratePerCm3 = pricingConfig?.pricePerCm3Cents ?? DEFAULT_LITHOPHANE_PRICE_PER_CM3_CENTS
  const addOns = pricingConfig?.addOns || DEFAULT_LITHOPHANE_ADDON_PRICES

  return {
    schemaVersion: LITHOPHANE_SCHEMA_VERSION,
    templates: LITHOPHANE_TEMPLATES.map((t) => {
      const entry = basePrices[t.id]
      const basePriceCents =
        entry && Number.isInteger(entry.basePriceCents)
          ? entry.basePriceCents
          : Number.isInteger(entry)
            ? entry
            : DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES[t.id] ?? 79900
      return {
        ...t,
        basePriceCents,
      }
    }),
    lightingOptions: [
      { id: 'warm_white', name: 'Warm White LED (3000K)', surchargeCents: addOns.ledPuckWarmWhiteCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckWarmWhiteCents },
      { id: 'cool_white', name: 'Cool White LED (6000K)', surchargeCents: addOns.ledPuckCoolWhiteCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckCoolWhiteCents },
      { id: 'rgb_remote', name: 'Multi-Color RGB LED with Remote', surchargeCents: addOns.ledPuckRgbRemoteCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckRgbRemoteCents },
      { id: 'none', name: 'Shade Only (No LED Puck)', surchargeCents: 0 },
    ],
    baseOptions: [
      { id: 'printed', name: 'Matching 3D Printed Base', surchargeCents: 0 },
      { id: 'wooden', name: 'Solid Hardwood Finished Base', surchargeCents: addOns.woodenBaseSurchargeCents ?? DEFAULT_LITHOPHANE_ADDON_PRICES.woodenBaseSurchargeCents },
      { id: 'none', name: 'No Base', surchargeCents: 0 },
    ],
    pricing: {
      pricePerCm3Cents: ratePerCm3,
      addOns,
    },
    constraints: {
      minThicknessMm: 0.8,
      maxThicknessMm: 4.0,
      minHeightMm: 60,
      maxHeightMm: 220,
      minDiameterMm: 50,
      maxDiameterMm: 180,
    },
  }
}
