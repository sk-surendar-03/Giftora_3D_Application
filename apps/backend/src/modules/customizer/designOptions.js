// The single server-side allow-list for standalone custom designs. Every ID
// and label here mirrors what the customer frontend's geometry engine
// (apps/customer-frontend/src/features/customiser/geometry) supports; a parity
// test (test/designOptions.parity.test.js) fails if the two drift apart.

export const DESIGN_SCHEMA_VERSION = 1
export const MAX_TEXT_LENGTH = 24

export const MAX_STL_BYTES = Number(process.env.MAX_STL_BYTES) || 30 * 1024 * 1024
export const MAX_PREVIEW_BYTES = Number(process.env.MAX_PREVIEW_BYTES) || 512 * 1024

const STANDARD_PLA_COLORS = [
  { label: 'White', hex: '#F5F3EE' },
  { label: 'Black', hex: '#1A1A1A' },
  { label: 'Red', hex: '#B33A3A' },
  { label: 'Natural', hex: '#E8D9B5' },
]
const SILK_METALLIC_PLA_COLORS = [
  { label: 'Gold', hex: '#C9A227' },
  { label: 'Silver', hex: '#C0C0C0' },
  { label: 'Bronze', hex: '#8C6239' },
  { label: 'Copper', hex: '#B5651D' },
  { label: 'Steel Grey', hex: '#71797E' },
]
const METAL_COLORS = [
  { label: 'Steel Silver', hex: '#C4C8CC' },
  { label: 'Matte Black', hex: '#2A2A2A' },
  { label: 'Gold Finish', hex: '#B9923F' },
]
const ACRYLIC_COLORS = [
  { label: 'Clear', hex: '#EEF2F3' },
  { label: 'Frosted White', hex: '#F7F5F0' },
  { label: 'Black', hex: '#161412' },
]

export const MATERIALS = {
  'Standard PLA': { colors: STANDARD_PLA_COLORS },
  'Silk Metallic PLA': { colors: SILK_METALLIC_PLA_COLORS },
  Metal: { colors: METAL_COLORS },
  Acrylic: { colors: ACRYLIC_COLORS },
}

const KEYCHAIN_MATERIALS = ['Standard PLA', 'Silk Metallic PLA', 'Metal']
const NAMEPLATE_MATERIALS = ['Acrylic', 'Metal', 'Silk Metallic PLA']

// The engine's DEFAULT_PARAMS.styleId. Templates without selectable styles
// (articulated name, nameplate) are always built with this one.
export const DEFAULT_STYLE_ID = 'contour'

export const TEMPLATES = {
  'name-keychain': {
    name: 'Name keychain',
    description: 'A backing contour that follows the name.',
    styles: ['contour', 'capsule', 'soft-tag', 'bubble', 'arch', 'ribbon', 'heart-split'],
    supportsSubtitle: true,
    supportsKeyring: true,
    requiresArticulatedFont: false,
    materials: KEYCHAIN_MATERIALS,
    sizes: ['Small (4 cm)', 'Medium (5.5 cm)', 'Large (7 cm)'],
  },
  'articulated-name': {
    name: 'Articulated name',
    description: 'Separate letter-shaped bodies linked by compact captive print-in-place joints.',
    styles: [],
    supportsSubtitle: false,
    supportsKeyring: true,
    requiresArticulatedFont: true,
    materials: KEYCHAIN_MATERIALS,
    sizes: ['Medium (5.5 cm)', 'Large (7 cm)'],
  },
  nameplate: {
    name: 'Nameplate',
    description: 'A rounded sign with a tilted, embedded inscription.',
    styles: [],
    supportsSubtitle: true,
    supportsKeyring: false,
    requiresArticulatedFont: false,
    materials: NAMEPLATE_MATERIALS,
    sizes: ['Desk (15 cm)', 'Door (20 cm)'],
  },
}

export const FONTS = {
  nunito: { name: 'Nunito', supportsArticulated: false },
  quicksand: { name: 'Quicksand', supportsArticulated: false },
  fredoka: { name: 'Fredoka', supportsArticulated: false },
  oswald: { name: 'Oswald', supportsArticulated: false },
  'bree-serif': { name: 'Bree Serif', supportsArticulated: false },
  baloo2: { name: 'Baloo 2', supportsArticulated: false },
  kalam: { name: 'Kalam', supportsArticulated: false },
  bungee: { name: 'Bungee', supportsArticulated: true },
  rubik: { name: 'Rubik Black', supportsArticulated: true },
  montserrat: { name: 'Montserrat Black', supportsArticulated: true },
  caveat: { name: 'Caveat', supportsArticulated: false },
  'marck-script': { name: 'Marck Script', supportsArticulated: false },
  'bad-script': { name: 'Bad Script', supportsArticulated: false },
  neucha: { name: 'Neucha', supportsArticulated: false },
  'amatic-sc': { name: 'Amatic SC', supportsArticulated: false },
  lobster: { name: 'Lobster', supportsArticulated: false },
  pangolin: { name: 'Pangolin', supportsArticulated: false },
  'playpen-sans': { name: 'Playpen Sans', supportsArticulated: false },
  'shantell-sans': { name: 'Shantell Sans', supportsArticulated: false },
  'balsamiq-sans': { name: 'Balsamiq Sans', supportsArticulated: false },
  comforter: { name: 'Comforter', supportsArticulated: false },
  'comforter-brush': { name: 'Comforter Brush', supportsArticulated: false },
  underdog: { name: 'Underdog', supportsArticulated: false },
}

// baseThicknessMm values are the engine's valid, in-range settings
// (mirrors the customer frontend's thicknessOptions.js).
export const THICKNESSES = {
  standard: { label: 'Standard', description: 'Our default thickness.', baseThicknessMm: 2.4 },
  premium: { label: 'Premium', description: 'Extra-thick, more durable.', baseThicknessMm: 3.6 },
}

export const KEYRING_POSITIONS = ['left', 'right', 'top', 'bottom', 'top-left', 'top-right']
export const DEFAULT_KEYRING_POSITION = 'left'

function parseCm(label) {
  const match = /([\d.]+)\s*cm/i.exec(label ?? '')
  return match ? parseFloat(match[1]) : null
}

// Mirrors customer-frontend productMapping.js `shapeDefaultsForSize`.
export function textSizeMmForSize(sizeLabel) {
  const cm = parseCm(sizeLabel) ?? 5.5
  return Math.min(30, Math.max(12, Math.round(cm * 3.2)))
}

/** The public shape served by GET /customizer/options. */
export function buildPublicOptions() {
  return {
    schemaVersion: DESIGN_SCHEMA_VERSION,
    maxTextLength: MAX_TEXT_LENGTH,
    stl: { maxBytes: MAX_STL_BYTES },
    previewMaxBytes: MAX_PREVIEW_BYTES,
    templates: Object.entries(TEMPLATES).map(([id, t]) => ({
      id,
      name: t.name,
      description: t.description,
      styles: t.styles,
      supportsSubtitle: t.supportsSubtitle,
      supportsKeyring: t.supportsKeyring,
      requiresArticulatedFont: t.requiresArticulatedFont,
      materials: t.materials,
      sizes: t.sizes,
    })),
    materials: Object.entries(MATERIALS).map(([name, m]) => ({ name, colors: m.colors })),
    fonts: Object.entries(FONTS).map(([id, f]) => ({ id, name: f.name, supportsArticulated: f.supportsArticulated })),
    thicknesses: Object.entries(THICKNESSES).map(([id, t]) => ({ id, ...t })),
    keyringPositions: KEYRING_POSITIONS,
    defaultKeyringPosition: DEFAULT_KEYRING_POSITION,
  }
}
