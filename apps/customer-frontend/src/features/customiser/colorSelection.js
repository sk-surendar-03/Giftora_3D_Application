// Colour selection rules for the customiser. Kept free of React so the
// resolution logic is easy to reason about and test.

const normalizeHex = (hex) => (typeof hex === 'string' ? hex.trim().toLowerCase() : '')
const sameHex = (a, b) => normalizeHex(a) !== '' && normalizeHex(a) === normalizeHex(b)

function relativeLuminance(hex) {
  const match = /^#([0-9a-f]{6})$/.exec(normalizeHex(hex))
  if (!match) return 0
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(hexA, hexB) {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

/** The palette colour that reads best against `baseHex` (never the base itself unless it is the only colour). */
export function pickContrastingColor(baseHex, palette) {
  if (!palette?.length) return undefined
  const candidates = palette.filter((c) => !sameHex(c.hex, baseHex))
  if (candidates.length === 0) return palette[0]
  return candidates.reduce((best, c) => (contrastRatio(c.hex, baseHex) > contrastRatio(best.hex, baseHex) ? c : best))
}

/**
 * Resolves what the customer has chosen against the available palette.
 * - Base: the chosen colour if it is in the palette, otherwise the first palette colour.
 * - Text: the chosen colour if it is in the palette, otherwise the best-contrast colour for the base
 *   (so an untouched text colour follows the base colour; a picked one stays put).
 */
export function resolveColorSelection(palette, baseChoice, textChoice) {
  if (!palette?.length) return { base: baseChoice, text: textChoice }
  const inPalette = (choice) => (choice ? palette.find((c) => sameHex(c.hex, choice.hex)) : undefined)
  const base = inPalette(baseChoice) ?? palette[0]
  const text = inPalette(textChoice) ?? pickContrastingColor(base.hex, palette)
  return { base, text }
}
