// Ported from Open Keychain (MIT) — src/domain/keychain/model/keyring-position.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
// See THIRD-PARTY-NOTICES.md.

/** @typedef {'left'|'right'|'top'|'bottom'|'top-left'|'top-right'} KeyringPosition */

/** @type {readonly KeyringPosition[]} */
export const KEYRING_POSITIONS = ['left', 'right', 'top', 'bottom', 'top-left', 'top-right']

// Upstream maps each position to an i18next translation key (keyringPositionNameKey).
// Giftora has no i18n system yet, so this returns the upstream key string itself —
// a plain, stable identifier a future Giftora UI can map to its own copy.
const NAME_KEYS = {
  left: 'keyringPositionLeft',
  right: 'keyringPositionRight',
  top: 'keyringPositionTop',
  bottom: 'keyringPositionBottom',
  'top-left': 'keyringPositionTopLeft',
  'top-right': 'keyringPositionTopRight',
}

/** @param {KeyringPosition} position @returns {string} */
export function keyringPositionNameKey(position) {
  return NAME_KEYS[position]
}
