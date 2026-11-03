// Ported from Open Keychain (MIT) — src/domain/keychain/model/edge-finish.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
// See THIRD-PARTY-NOTICES.md.

/** The smallest edge feature that is reliably visible on the standard printer. */
export const EDGE_FINISH_GRID_MM = 0.2
export const EDGE_FINISH_TEXT_CLEARANCE_MM = 0.2

/**
 * @typedef {object} EdgeFinishValues
 * @property {'sharp'|'chamfer'|'round'} style
 * @property {number} topMm
 * @property {number} bottomMm
 * @property {'sharp'|'chamfer'|'round'} textStyle
 * @property {number} textMm
 */

function finiteOrZero(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** Clamp and snap a public edge value to the printer-visible 0.2 mm grid. */
export function canonicalEdgeMm(value, maximum) {
  const clamped = Math.min(maximum, Math.max(0, finiteOrZero(value)))
  return Math.min(maximum, Math.round(clamped / EDGE_FINISH_GRID_MM) * EDGE_FINISH_GRID_MM)
}

/**
 * Resolve the persisted finish controls into the one contract consumed by builders.
 * Legacy values remain readable, while unsupported template combinations become sharp.
 * @param {Pick<import('./types').KeychainParams, 'edgeFinish'|'topEdgeMm'|'bottomEdgeMm'|'textEdgeMm'|'textEdgeFinish'|'reliefDepthMm'>} params
 * @returns {EdgeFinishValues}
 */
export function normalizeEdgeFinish(params) {
  const style = ['sharp', 'chamfer', 'round'].includes(params.edgeFinish ?? '') ? params.edgeFinish : 'sharp'
  const topMm = style === 'sharp' ? 0 : canonicalEdgeMm(params.topEdgeMm, 2)
  const bottomMm = style === 'sharp' ? 0 : canonicalEdgeMm(params.bottomEdgeMm, 2)
  const textStyle = ['sharp', 'chamfer', 'round'].includes(params.textEdgeFinish ?? '') ? params.textEdgeFinish : 'sharp'
  return {
    style,
    topMm,
    bottomMm,
    textStyle,
    textMm:
      textStyle === 'sharp'
        ? 0
        : canonicalEdgeMm(params.textEdgeMm, Math.max(0, finiteOrZero(params.reliefDepthMm) - EDGE_FINISH_TEXT_CLEARANCE_MM)),
  }
}
