export const NAMEPLATE_SCHEMA_VERSION = 1

export const DEFAULT_NAMEPLATE_TYPES = [
  { id: 'desk', name: 'Desk Nameplates', basePriceCents: 55000 },
  { id: 'door', name: 'Door Nameplates', basePriceCents: 65000 },
  { id: 'wall', name: 'Wall-Mounted Signs', basePriceCents: 75000 },
  { id: 'kids', name: "Kids' Room Nameplates", basePriceCents: 60000 },
  { id: 'business', name: 'Business Signs', basePriceCents: 85000 },
  { id: 'led', name: 'LED-Style Signs', basePriceCents: 95000 },
  { id: 'decorative-3d', name: 'Decorative 3D Text', basePriceCents: 50000 },
  { id: 'wedding', name: 'Wedding & Event', basePriceCents: 70000 },
  { id: 'house-number', name: 'House Number Plates', basePriceCents: 65000 },
  { id: 'gaming', name: 'Gaming Desk Tags', basePriceCents: 60000 },
]

export const DEFAULT_NAMEPLATE_SHAPES = [
  'rectangle',
  'rounded-rectangle',
  'chamfer-plate',
  'oval',
  'circle',
  'hexagon',
  'octagon',
  'diamond',
  'shield',
  'crest',
  'arch',
  'cloud',
  'heart',
  'scalloped',
  'ribbon-banner',
  'ticket-notch',
  'house-roof',
  'butterfly',
  'star-burst',
  'text-outline',
]

export const DEFAULT_NAMEPLATE_FINISHES = [
  'matte-pla',
  'silk-pla',
  'metallic-pla',
  'wood-pla',
  'marble-pla',
  'transparent',
  'dual-color',
]

export const DEFAULT_NAMEPLATE_CONFIG = {
  pricePerCm3Cents: 120, // ₹1.20 per cm³
  ledGlowSurchargeCents: 15000, // ₹150.00
  layeredBackingSurchargeCents: 10000, // ₹100.00
  types: Object.fromEntries(DEFAULT_NAMEPLATE_TYPES.map((t) => [t.id, { basePriceCents: t.basePriceCents }])),
}

export function priceForNameplate(type, volumeCm3, designConfig = {}, config = DEFAULT_NAMEPLATE_CONFIG) {
  const typeConfig = config.types?.[type] || DEFAULT_NAMEPLATE_CONFIG.types[type] || { basePriceCents: 55000 }
  const basePriceCents = Number(typeConfig.basePriceCents) || 55000

  const ratePerCm3 = Number(config.pricePerCm3Cents) || DEFAULT_NAMEPLATE_CONFIG.pricePerCm3Cents
  const safeVolume = Math.max(0, Number(volumeCm3) || 0)
  const volumeCents = Math.round(Math.ceil(safeVolume) * ratePerCm3)

  let surcharges = 0
  if (designConfig.ledGlowEnabled) {
    surcharges += Number(config.ledGlowSurchargeCents) || DEFAULT_NAMEPLATE_CONFIG.ledGlowSurchargeCents
  }
  if (designConfig.mountingStyle === 'layered-background') {
    surcharges += Number(config.layeredBackingSurchargeCents) || DEFAULT_NAMEPLATE_CONFIG.layeredBackingSurchargeCents
  }

  return basePriceCents + volumeCents + surcharges
}

export function buildPublicOptions(config = DEFAULT_NAMEPLATE_CONFIG) {
  const types = DEFAULT_NAMEPLATE_TYPES.map((t) => ({
    ...t,
    basePriceCents: config.types?.[t.id]?.basePriceCents ?? t.basePriceCents,
  }))

  return {
    schemaVersion: NAMEPLATE_SCHEMA_VERSION,
    types,
    shapes: DEFAULT_NAMEPLATE_SHAPES,
    finishes: DEFAULT_NAMEPLATE_FINISHES,
    pricePerCm3Cents: config.pricePerCm3Cents ?? DEFAULT_NAMEPLATE_CONFIG.pricePerCm3Cents,
    ledGlowSurchargeCents: config.ledGlowSurchargeCents ?? DEFAULT_NAMEPLATE_CONFIG.ledGlowSurchargeCents,
    layeredBackingSurchargeCents: config.layeredBackingSurchargeCents ?? DEFAULT_NAMEPLATE_CONFIG.layeredBackingSurchargeCents,
    stl: { maxBytes: 50 * 1024 * 1024 },
    previewMaxBytes: 2 * 1024 * 1024,
  }
}
