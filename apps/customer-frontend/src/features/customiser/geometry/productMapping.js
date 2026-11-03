// Giftora-specific glue: maps Giftora's own product/catalog data (category,
// size labels) onto the real ported Open Keychain parameter model. This is
// new code, not ported from upstream — upstream has no concept of Giftora's
// product catalog.

import { fontDefinition, fontSupportsArticulatedName, articulatedFallbackFont } from './fonts/catalog.js'

/**
 * Giftora's catalog only lists "Keychains" and "Nameplates" categories
 * today — no magnet or plant-label products exist (no corresponding
 * hardware/pricing), so those two upstream templates aren't offered here.
 * "Keychains" products may become either a standard or an articulated
 * (print-in-place letters) name-keychain; "Nameplates" products map to the
 * nameplate template, which has no selectable style (its 2D shape is fixed).
 * @param {string} category
 * @returns {{ templateIds: string[], defaultTemplateId: string }}
 */
export function templateOptionsForCategory(category) {
  if (category === 'Nameplates') return { templateIds: ['nameplate'], defaultTemplateId: 'nameplate' }
  return { templateIds: ['name-keychain', 'articulated-name'], defaultTemplateId: 'name-keychain' }
}

function parseCm(label) {
  const match = /([\d.]+)\s*cm/i.exec(label ?? '')
  return match ? parseFloat(match[1]) : null
}

/**
 * Giftora's product sizes are plain labels like "Small (4 cm)", not real
 * mm-based shape parameters. This maps a size label to real textSizeMm/
 * baseThicknessMm values within the engine's own valid ranges — a Giftora-
 * specific convenience, not an upstream concept.
 * @param {string|undefined} sizeLabel
 * @returns {{ textSizeMm: number, baseThicknessMm: number }}
 */
export function shapeDefaultsForSize(sizeLabel) {
  const cm = parseCm(sizeLabel) ?? 5.5
  const textSizeMm = Math.min(30, Math.max(12, Math.round(cm * 3.2)))
  const baseThicknessMm = Math.min(4, Math.max(1.6, Number((2 + (cm - 4) * 0.3).toFixed(1))))
  return { textSizeMm, baseThicknessMm }
}

/**
 * Picks a font id that's valid for the given template — if the current
 * selection doesn't support articulated-name, falls back to the first
 * bundled font that does (mirrors the engine's own `articulatedFallbackFont`).
 * @param {string} templateId
 * @param {string} currentFontId
 * @param {string} text
 * @returns {string}
 */
export function fontIdForTemplate(templateId, currentFontId, text) {
  if (templateId !== 'articulated-name') return currentFontId
  const current = fontDefinition(currentFontId)
  if (fontSupportsArticulatedName(current, text || 'A')) return currentFontId
  return articulatedFallbackFont(text || 'A').id
}
