export const QR_STAND_SCHEMA_VERSION = 1

export const DEFAULT_QR_STAND_PRICE_PER_CM3_CENTS = 120 // ₹1.20 / cm³

export const DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES = {
  classic_upright: 49900, // ₹499
  angled_desk: 54900, // ₹549
  rounded_rect: 49900, // ₹499
  arch_shaped: 59900, // ₹599
  circular_display: 54900, // ₹549
  square_block: 44900, // ₹449
  double_sided: 69900, // ₹699
  triple_display: 89900, // ₹899
  restaurant_tent: 59900, // ₹599
  social_media: 54900, // ₹549
  business_plaque: 64900, // ₹649
  mini_keychain: 19900, // ₹199
}

export const DEFAULT_QR_STAND_ADDON_PRICES = {
  centerLogoSurchargeCents: 15000, // ₹150 for center logo in QR
  inlayModeSurchargeCents: 10000, // ₹100 for dual-extrusion / inlay mode
  multiQrSurchargeCents: 15000, // ₹150 for multi-QR / rear layout
}

export const QR_STAND_TEMPLATES = [
  { id: 'classic_upright', name: 'Classic Upright QR Stand', category: 'Desk', hasBase: true },
  { id: 'angled_desk', name: 'Angled Desk QR Stand', category: 'Desk', hasBase: true },
  { id: 'rounded_rect', name: 'Rounded Rectangle QR Stand', category: 'Retail', hasBase: true },
  { id: 'arch_shaped', name: 'Arch QR Stand', category: 'Modern', hasBase: true },
  { id: 'circular_display', name: 'Circular QR Plaque', category: 'Creative', hasBase: true },
  { id: 'square_block', name: 'Square Block Display', category: 'Minimalist', hasBase: false },
  { id: 'double_sided', name: 'Double-Sided Tent Stand', category: 'Retail', hasBase: true },
  { id: 'triple_display', name: 'Tri-Panel QR Prism', category: 'Hospitality', hasBase: false },
  { id: 'restaurant_tent', name: 'Restaurant Table Tent', category: 'Hospitality', hasBase: true },
  { id: 'social_media', name: 'Multi-Badge Social Stand', category: 'Creative', hasBase: true },
  { id: 'business_plaque', name: 'Executive Business Plaque', category: 'Modern', hasBase: true },
  { id: 'mini_keychain', name: 'Portable QR Keychain', category: 'Compact', hasBase: false },
]

export const VALID_TEMPLATE_IDS = new Set(QR_STAND_TEMPLATES.map((t) => t.id))
export const VALID_PRINT_MODES = new Set(['raised', 'recessed', 'inlay'])
export const VALID_QR_TYPES = new Set([
  'url',
  'upi',
  'wifi',
  'whatsapp',
  'instagram',
  'google_review',
  'vcard',
  'facebook',
  'youtube',
  'menu',
  'email',
  'phone',
  'custom_text',
])
export const VALID_ERROR_CORRECTION = new Set(['L', 'M', 'Q', 'H'])

/**
 * Calculates the authoritative server-side price for a QR Stand design.
 * Formula: Base Price (by template) + Volumetric Price (cm³ * rate) + Add-ons.
 */
export function priceForQrStand(templateId, solidVolumeCm3, designConfig, pricingConfig) {
  const basePrices = pricingConfig?.templates || DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES
  const baseEntry = basePrices[templateId]
  const basePriceCents =
    baseEntry && Number.isInteger(baseEntry.basePriceCents)
      ? baseEntry.basePriceCents
      : Number.isInteger(baseEntry)
        ? baseEntry
        : DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES[templateId] ?? 49900

  const ratePerCm3 =
    Number.isInteger(pricingConfig?.pricePerCm3Cents) && pricingConfig.pricePerCm3Cents >= 0
      ? pricingConfig.pricePerCm3Cents
      : DEFAULT_QR_STAND_PRICE_PER_CM3_CENTS

  const volume = Math.max(0, Number(solidVolumeCm3) || 0)
  const volumeCents = Math.round(volume * ratePerCm3)

  let addOnsCents = 0
  const addOns = pricingConfig?.addOns || DEFAULT_QR_STAND_ADDON_PRICES

  // Center logo add-on
  if (designConfig?.logo?.enabled) {
    addOnsCents += addOns.centerLogoSurchargeCents ?? DEFAULT_QR_STAND_ADDON_PRICES.centerLogoSurchargeCents
  }

  // Multi-material inlay print mode
  if (designConfig?.printMode === 'inlay') {
    addOnsCents += addOns.inlayModeSurchargeCents ?? DEFAULT_QR_STAND_ADDON_PRICES.inlayModeSurchargeCents
  }

  // Multi-panel or dual-sided layout
  if (
    designConfig?.dimensions?.frontAndRearLayout ||
    templateId === 'double_sided' ||
    templateId === 'triple_display'
  ) {
    addOnsCents += addOns.multiQrSurchargeCents ?? DEFAULT_QR_STAND_ADDON_PRICES.multiQrSurchargeCents
  }

  return basePriceCents + volumeCents + addOnsCents
}

export function buildPublicOptions(pricingConfig) {
  const basePrices = pricingConfig?.templates || DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES
  const ratePerCm3 = pricingConfig?.pricePerCm3Cents ?? DEFAULT_QR_STAND_PRICE_PER_CM3_CENTS
  const addOns = pricingConfig?.addOns || DEFAULT_QR_STAND_ADDON_PRICES

  return {
    templates: QR_STAND_TEMPLATES.map((t) => {
      const entry = basePrices[t.id]
      const basePriceCents =
        entry && Number.isInteger(entry.basePriceCents)
          ? entry.basePriceCents
          : Number.isInteger(entry)
            ? entry
            : DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES[t.id] ?? 49900
      return {
        ...t,
        basePriceCents,
      }
    }),
    printModes: Array.from(VALID_PRINT_MODES),
    supportedQrTypes: Array.from(VALID_QR_TYPES),
    pricing: {
      pricePerCm3Cents: ratePerCm3,
      addOns,
    },
    versionLimit: {
      min: 1,
      max: 14,
    },
  }
}
