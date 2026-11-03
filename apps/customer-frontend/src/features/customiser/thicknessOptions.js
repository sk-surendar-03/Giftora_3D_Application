// Both values are real, valid `baseThicknessMm` settings for the geometry
// engine (clamped 1.6–4 mm for name-keychain/nameplate templates — see
// `normalizeParams` in `geometry/model/types.js`), not invented numbers —
// "Standard" matches the engine's own default, "Premium" is a thicker,
// still in-range value.
export const THICKNESS_OPTIONS = {
  standard: { label: 'Standard', description: 'Our default thickness.', baseThicknessMm: 2.4 },
  premium: { label: 'Premium', description: 'Extra-thick, more durable.', baseThicknessMm: 3.6 },
}
