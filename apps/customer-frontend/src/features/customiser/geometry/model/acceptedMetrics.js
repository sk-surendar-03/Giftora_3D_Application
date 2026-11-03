// Ported from Open Keychain (MIT) — src/domain/keychain/model/accepted-metrics.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
// See THIRD-PARTY-NOTICES.md.

/**
 * @typedef {object} AcceptedMetrics
 * @property {number} widthMm
 * @property {number} heightMm
 * @property {number} thicknessMm
 * @property {number|undefined} parts
 * @property {import('./types').SizeEnvelope} [maximum]
 * @property {boolean} [fitsWithinMaximum]
 */

/**
 * Derive display metrics only from the last accepted geometry and its accepted size envelope.
 * @param {import('./types').GeometryResult|undefined} result
 * @param {import('./types').SizeEnvelope|undefined} sizeEnvelope
 * @returns {AcceptedMetrics|undefined}
 */
export function selectAcceptedMetrics(result, sizeEnvelope) {
  if (!result) return undefined
  const { widthMm, heightMm, thicknessMm } = result.dimensions
  if (![widthMm, heightMm, thicknessMm].every((value) => Number.isFinite(value) && value > 0)) return undefined
  return {
    widthMm,
    heightMm,
    thicknessMm,
    parts: result.solidCount,
    maximum: sizeEnvelope,
    fitsWithinMaximum: sizeEnvelope ? widthMm <= sizeEnvelope.widthMm + 0.1 && heightMm <= sizeEnvelope.heightMm + 0.1 : undefined,
  }
}

/** @param {Pick<AcceptedMetrics, 'widthMm'|'heightMm'>} metrics @returns {string} */
export function formatAcceptedSize(metrics) {
  return `${metrics.widthMm.toFixed(1)} × ${metrics.heightMm.toFixed(1)} mm`
}

/** @param {AcceptedMetrics} metrics @returns {string} */
export function formatAcceptedThickness(metrics) {
  return `${metrics.thicknessMm.toFixed(1)} mm`
}

/** @param {AcceptedMetrics} metrics @returns {string|undefined} */
export function formatAcceptedMaximum(metrics) {
  return metrics.maximum ? formatAcceptedSize(metrics.maximum) : undefined
}
