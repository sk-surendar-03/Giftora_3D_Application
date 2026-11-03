// Ported from Open Keychain (MIT) — src/domain/keychain/build/styled-types.ts.
// Pure type definitions upstream; no runtime code, so this file is JSDoc only.
// See THIRD-PARTY-NOTICES.md.

/**
 * @typedef {object} StandardStyledGeometry
 * @property {'standard'} kind
 * @property {import('../model/types').GeometryParameterLimits} [parameterLimits]
 * @property {number} scale
 * @property {import('manifold-3d').CrossSection} rawText
 * @property {import('manifold-3d').CrossSection} relief
 * @property {import('manifold-3d').CrossSection} [subtitle]
 * @property {import('manifold-3d').CrossSection} backing
 * @property {Array<{section: import('manifold-3d').CrossSection, depthMm: number}>} recesses
 * @property {Array<{section: import('manifold-3d').CrossSection, depthMm: number}>} rearRecesses
 * @property {import('manifold-3d').CrossSection[]} [throughCuts]
 * @property {import('../model/types').MagnetPocketMetadata} [magnetPocket]
 * @property {number} [reliefDepthMm]
 * @property {number} widthMm
 * @property {number} heightMm
 */

export {}
