// Ported from Open Keychain (MIT) — src/domain/keychain/model/keyring-presets.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
// See THIRD-PARTY-NOTICES.md.

/**
 * @typedef {'compact-round'|'standard-round'|'large-round'|'oval-slot'|'custom'} KeyringPresetId
 * @typedef {'round'|'slot'} KeyringOpeningShape
 * @typedef {object} KeyringPreset
 * @property {Exclude<KeyringPresetId, 'custom'>} id
 * @property {KeyringOpeningShape} shape
 * @property {number} widthMm
 * @property {number} lengthMm
 */

/** Dimensions describe the clear opening, not a guaranteed fit to specific hardware. */
export const KEYRING_PRESETS = [
  { id: 'compact-round', shape: 'round', widthMm: 3.5, lengthMm: 3.5 },
  { id: 'standard-round', shape: 'round', widthMm: 5, lengthMm: 5 },
  { id: 'large-round', shape: 'round', widthMm: 7, lengthMm: 7 },
  { id: 'oval-slot', shape: 'slot', widthMm: 4, lengthMm: 8 },
]

const NAME_KEYS = {
  'compact-round': 'keyringPresetCompactRound',
  'standard-round': 'keyringPresetStandardRound',
  'large-round': 'keyringPresetLargeRound',
  'oval-slot': 'keyringPresetOvalSlot',
  custom: 'keyringPresetCustom',
}

/** @param {KeyringPresetId} id @returns {string} */
export function keyringPresetNameKey(id) {
  return NAME_KEYS[id]
}

/**
 * @param {Exclude<KeyringPresetId, 'custom'>} id
 * @returns {Pick<import('./types').KeychainParams, 'keyringPreset'|'keyringOpeningShape'|'holeDiameterMm'|'keyringSlotLengthMm'>}
 */
export function keyringPresetValues(id) {
  const preset = KEYRING_PRESETS.find((item) => item.id === id)
  if (!preset) throw new Error(`Unknown keyring preset: ${id}`)
  return {
    keyringPreset: preset.id,
    keyringOpeningShape: preset.shape,
    holeDiameterMm: preset.widthMm,
    keyringSlotLengthMm: preset.lengthMm,
  }
}
