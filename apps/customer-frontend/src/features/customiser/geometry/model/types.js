// Ported from Open Keychain (MIT) — src/domain/keychain/model/types.ts.
// Logic unchanged; TS type annotations replaced with JSDoc. See the
// "What could not be preserved directly" note at the bottom of this file,
// and THIRD-PARTY-NOTICES.md for the upstream license.

import { normalizeEdgeFinish } from './edgeFinish.js'
import { KEYRING_POSITIONS } from './keyringPosition.js'
import { KEYRING_PRESETS } from './keyringPresets.js'
import { reconcileDependentParameterValues } from './parameterConstraints.js'

/**
 * @typedef {'plain'|'contour'|'capsule'|'soft-tag'|'bubble'|'arch'|'ribbon'|'heart-split'} StyleId
 * @typedef {'name-keychain'|'articulated-name'|'nameplate'|'plant-label'|'magnet'} TemplateId
 * @typedef {'6x2'|'8x2'|'10x3'|'12x3'|'15x3'} MagnetPocketPreset
 * @typedef {'center'|'upper'|'lower'|'left'|'right'} MagnetPocketPlacement
 * @typedef {'relief'|'through-cut'} HeartInteriorMode
 * @typedef {'sharp'|'chamfer'|'round'} EdgeFinish
 * @typedef {{widthMm: number, heightMm: number}} SizeEnvelope
 * @typedef {object} MagnetPocketPresetMetadata
 * @property {MagnetPocketPreset} id
 * @property {number} diameterMm
 * @property {number} thicknessMm
 * @property {number} pocketDiameterMm
 * @property {number} pocketDepthMm
 */

/** @type {readonly MagnetPocketPresetMetadata[]} */
export const MAGNET_POCKET_PRESETS = [
  { id: '6x2', diameterMm: 6, thicknessMm: 2, pocketDiameterMm: 6.4, pocketDepthMm: 2.2 },
  { id: '8x2', diameterMm: 8, thicknessMm: 2, pocketDiameterMm: 8.4, pocketDepthMm: 2.2 },
  { id: '10x3', diameterMm: 10, thicknessMm: 3, pocketDiameterMm: 10.4, pocketDepthMm: 3.2 },
  { id: '12x3', diameterMm: 12, thicknessMm: 3, pocketDiameterMm: 12.4, pocketDepthMm: 3.2 },
  { id: '15x3', diameterMm: 15, thicknessMm: 3, pocketDiameterMm: 15.4, pocketDepthMm: 3.2 },
]
export const MAGNET_POCKET_PRESET_MAP = Object.fromEntries(MAGNET_POCKET_PRESETS.map((preset) => [preset.id, preset]))

/**
 * The full upstream keychain parameter model. One flat object; which fields
 * are meaningful depends on `templateId`/`styleId` — see parameters.js's
 * `hasActiveParameter`/`parameterRange` for the applicability rules.
 * @typedef {object} KeychainParams
 * @property {string} text
 * @property {string} subtitle
 * @property {string} subtitleFontId
 * @property {number} subtitleOffsetXRatio
 * @property {number} subtitleOffsetYRatio
 * @property {MagnetPocketPreset} magnetPocketPreset
 * @property {MagnetPocketPlacement} magnetPocketPlacement
 * @property {string} fontId
 * @property {TemplateId} templateId
 * @property {StyleId} styleId
 * @property {number} textSizeMm
 * @property {number} fontWeightMm
 * @property {number} baseThicknessMm
 * @property {number} reliefDepthMm
 * @property {number} paddingMm
 * @property {number} edgeInsetMm
 * @property {number} letterSpacingMm
 * @property {number} holeDiameterMm
 * @property {import('./keyringPresets').KeyringPresetId} [keyringPreset]
 * @property {import('./keyringPosition').KeyringPosition} [keyringPosition]
 * @property {import('./keyringPresets').KeyringOpeningShape} [keyringOpeningShape]
 * @property {number} [keyringSlotLengthMm]
 * @property {number} connectorWidthMm
 * @property {number} cornerRadiusMm
 * @property {number} stakeLengthMm
 * @property {boolean} plantAccentEnabled
 * @property {number} nameplateTiltDeg
 * @property {number} nameplateEmbedMm
 * @property {number} jointClearanceMm
 * @property {number} mechanicalGapMm
 * @property {number} maxJointAngleDeg
 * @property {number} minimumWallMm
 * @property {number} bottomClearanceMm
 * @property {number} reliefHaloMm
 * @property {number} ringOffsetMm
 * @property {number} bubbleLobeMm
 * @property {number} tagTailMm
 * @property {number} archCurveMm
 * @property {number} stakeShoulderMm
 * @property {number} jointBossMm
 * @property {number} ribbonTailMm
 * @property {number} ribbonNotchMm
 * @property {number} heartSizeMm
 * @property {number} heartBorderMm
 * @property {number} heartLeftGapMm
 * @property {number} heartRightGapMm
 * @property {number} heartVerticalOffsetMm
 * @property {HeartInteriorMode} heartInteriorMode
 * @property {number} [subtitleTextSizeMm]
 * @property {number} [subtitleFontWeightMm]
 * @property {number} [subtitleLetterSpacingMm]
 * @property {number} [subtitleReliefDepthMm]
 * @property {number} [subtitleGapMm]
 * @property {EdgeFinish} [edgeFinish]
 * @property {number} [topEdgeMm]
 * @property {number} [bottomEdgeMm]
 * @property {number} [textEdgeMm]
 * @property {EdgeFinish} [textEdgeFinish]
 * @property {SizeEnvelope} [sizeEnvelope]
 * @property {import('./modelFeature').ModelFeature[]} [modelFeatures]
 */

export const MAGNET_SUBTITLE_MAX_LENGTH = 24
export const DEFAULT_MAGNET_POCKET_PRESET = '10x3'
export const DEFAULT_MAGNET_POCKET_PLACEMENT = 'center'

export function magnetTextContent(text, subtitle) {
  return subtitle ? `${text} ${subtitle}` : text
}

export function supportsMagnetSubtitle(text, subtitle) {
  return Boolean(text.trim()) && [...subtitle].length <= MAGNET_SUBTITLE_MAX_LENGTH
}

/** @typedef {KeychainParams} NormalizedParams */
/**
 * @typedef {object} KeyringMetrics
 * @property {number} wallMm
 * @property {number} outerRadiusMm
 * @property {number} rootWidthMm
 * @property {number} overlapMm
 */
/**
 * @typedef {object} MeshBuffer
 * @property {Float32Array} positions
 * @property {Uint32Array} indices
 */
/** @typedef {'stl'|'3mf'} ExportFormat */
/** @typedef {'separate-colors'|'merged'} ThreeMfMode */
/**
 * @typedef {object} Dimensions
 * @property {number} widthMm
 * @property {number} heightMm
 * @property {number} thicknessMm
 * @property {[number, number, number]} centerMm
 */
/**
 * @typedef {object} ValidationIssue
 * @property {'warning'|'error'} severity
 * @property {string} code
 * @property {string} message
 * @property {unknown} [failure] - upstream typed this as `RecoveryFailure` (Open
 *   Keychain's own error-recovery framework). Giftora doesn't have that system —
 *   see the note at the bottom of this file — so this stays an untyped optional.
 */

/** Manufacturing limits carried alongside generated geometry. All values are millimetres.
 * @typedef {object} GeometryConstraints
 * @property {number} minimumWallMm
 * @property {number} minimumClearanceMm
 * @property {number} maximumWidthMm
 */
/** The assumptions under which geometry validation and printability are evaluated.
 * @typedef {object} PrintProfile
 * @property {string} id
 * @property {'fdm'} technology
 * @property {number} nozzleDiameterMm
 * @property {number} layerHeightMm
 * @property {boolean} supports
 * @property {'flat'|'custom'} recommendedOrientation
 * @property {number} maxUnsupportedOverhangDeg
 * @property {GeometryConstraints} constraints
 */

/** @type {GeometryConstraints} */
export const DEFAULT_GEOMETRY_CONSTRAINTS = { minimumWallMm: 1.2, minimumClearanceMm: 0.2, maximumWidthMm: 120 }

/** @type {PrintProfile} */
export const DEFAULT_PRINT_PROFILE = {
  id: 'fdm-standard-0.4',
  technology: 'fdm',
  nozzleDiameterMm: 0.4,
  layerHeightMm: 0.2,
  supports: false,
  recommendedOrientation: 'flat',
  maxUnsupportedOverhangDeg: 45,
  constraints: DEFAULT_GEOMETRY_CONSTRAINTS,
}

/**
 * @param {Pick<KeychainParams, 'templateId'|'minimumWallMm'|'jointClearanceMm'|'mechanicalGapMm'>} params
 * @returns {GeometryConstraints}
 */
export function geometryConstraintsFor(params) {
  return {
    minimumWallMm: params.minimumWallMm,
    minimumClearanceMm: Math.max(
      DEFAULT_GEOMETRY_CONSTRAINTS.minimumClearanceMm,
      ...(params.templateId === 'articulated-name' ? [params.jointClearanceMm, params.mechanicalGapMm] : []),
    ),
    maximumWidthMm: DEFAULT_GEOMETRY_CONSTRAINTS.maximumWidthMm,
  }
}

/** @param {GeometryConstraints} constraints @returns {PrintProfile} */
export function printProfileFor(constraints) {
  return { ...DEFAULT_PRINT_PROFILE, constraints }
}

/**
 * @typedef {object} PrintAppearance
 * @property {{name: string, color: string}} base
 * @property {{name: string, color: string}} relief
 */
/** Session-only color choices. Geometry and hosted project data remain unchanged.
 * @typedef {object} PrintAppearanceOverrides
 * @property {1} version
 * @property {string} [base]
 * @property {string} [relief]
 */

export function normalizeAppearanceColor(color, fallback) {
  if (color === undefined) return fallback
  const value = color?.trim().toUpperCase() ?? ''
  if (!/^#[0-9A-F]{6}$/.test(value)) throw new Error(`Invalid appearance color: ${color}`)
  return value
}

/** @param {PrintAppearance} appearance @param {PrintAppearanceOverrides} [overrides] @returns {PrintAppearance} */
export function applyPrintAppearanceOverrides(appearance, overrides) {
  return {
    ...appearance,
    base: { ...appearance.base, color: normalizeAppearanceColor(overrides?.base, appearance.base.color) },
    relief: { ...appearance.relief, color: normalizeAppearanceColor(overrides?.relief, appearance.relief.color) },
  }
}

/** @type {PrintAppearance} */
export const DEFAULT_PRINT_APPEARANCE = {
  base: { name: 'Backing', color: '#B84838' },
  relief: { name: 'Raised text', color: '#FAF4E9' },
}
/** @type {PrintAppearance} */
export const ARTICULATED_PRINT_APPEARANCE = {
  base: { name: 'Structural letters and connectors', color: '#E7E2DA' },
  relief: { name: 'Decorative letter caps', color: '#D94A52' },
}

/** @typedef {Partial<Record<'cornerRadiusMm'|'stakeShoulderMm', number>>} GeometryParameterLimits */

/**
 * @typedef {object} GeometryResult
 * @property {GeometryParameterLimits} [parameterLimits]
 * @property {number} generationId
 * @property {MeshBuffer} baseMesh
 * @property {MeshBuffer} reliefMesh
 * @property {Dimensions} dimensions
 * @property {ValidationIssue[]} issues
 * @property {boolean} printable
 * @property {PrintAppearance} appearance
 * @property {GeometryConstraints} [constraints]
 * @property {PrintProfile} [printProfile]
 * @property {'creased'|'flat'} [baseShading]
 * @property {number} [solidCount]
 * @property {MagnetPocketMetadata} [magnetPocket]
 * @property {GeometryPart[]} [parts]
 * @property {GeometryChecks} [validation]
 * @property {Record<string, number>} [timings]
 * @property {EdgeFinishQuality} [edgeFinish]
 * @property {{chamferMaxMm: number, roundMaxMm: number}} [textFinishLimits]
 * @property {{chamferMaxMm: number, roundMaxMm: number}} [baseFinishLimits]
 */
/**
 * @typedef {object} EdgeFinishQuality
 * @property {EdgeFinish} style
 * @property {EdgeFinish} [textStyle]
 * @property {number} topMm
 * @property {number} bottomMm
 * @property {number} textMm
 * @property {'verified'|'degraded'|'unverified'} quality
 */
/**
 * @typedef {object} GeometryPart
 * @property {string} id
 * @property {string} name
 * @property {'base'|'relief'} role
 * @property {MeshBuffer} mesh
 */
/**
 * @typedef {object} GeometryChecks
 * @property {'passed'|'failed'} mesh
 * @property {'connected'|'separate-parts'|'assembly'} connectivity
 * @property {'software-checked'|'unverified'} manufacturing
 * @property {'unverified'} physical
 */
/**
 * @typedef {object} MagnetPocketMetadata
 * @property {MagnetPocketPreset} preset
 * @property {MagnetPocketPlacement} placement
 * @property {number} diameterMm
 * @property {number} depthMm
 * @property {[number, number]} centerMm
 * @property {boolean} adjusted
 * @property {boolean} safe
 */
/** A complete candidate result, kept separate from the preview queue.
 * @typedef {Omit<GeometryResult, 'generationId'>} GeometryValidation
 */

/** Reject malformed worker payloads before they can reach rendering or export.
 * @param {GeometryResult} result
 * @returns {boolean}
 */
export function validateGeometryResult(result) {
  const isRecord = (value) => typeof value === 'object' && value !== null
  const meshValid = (mesh) => {
    if (!isRecord(mesh)) return false
    const positions = mesh.positions
    const indices = mesh.indices
    return (
      positions instanceof Float32Array &&
      indices instanceof Uint32Array &&
      positions.length % 3 === 0 &&
      indices.length % 3 === 0 &&
      positions.every(Number.isFinite) &&
      indices.every((index) => index < positions.length / 3)
    )
  }
  if (!isRecord(result)) return false
  const dimensionsValid =
    isRecord(result.dimensions) &&
    Object.values(result.dimensions).every((value) =>
      Array.isArray(value) ? value.length === 3 && value.every(Number.isFinite) : Number.isFinite(value),
    )
  const edgeFinishValid = (finish) => {
    if (!isRecord(finish)) return false
    const style = finish.style
    const textStyle = finish.textStyle ?? style
    const topMm = finish.topMm
    const bottomMm = finish.bottomMm
    const textMm = finish.textMm
    const quality = finish.quality
    return (
      typeof style === 'string' &&
      ['sharp', 'chamfer', 'round'].includes(style) &&
      (textStyle === undefined || (typeof textStyle === 'string' && ['sharp', 'chamfer', 'round'].includes(textStyle))) &&
      typeof topMm === 'number' &&
      typeof bottomMm === 'number' &&
      typeof textMm === 'number' &&
      Number.isFinite(topMm) &&
      Number.isFinite(bottomMm) &&
      Number.isFinite(textMm) &&
      topMm >= 0 &&
      topMm <= 2 &&
      bottomMm >= 0 &&
      bottomMm <= 2 &&
      textMm >= 0 &&
      textMm <= 2 &&
      [topMm, bottomMm, textMm].every((value) => Math.abs(value / 0.2 - Math.round(value / 0.2)) < 1e-6) &&
      ['sharp', 'chamfer', 'round'].includes(textStyle) &&
      (style !== 'sharp' || (topMm === 0 && bottomMm === 0)) &&
      (textStyle !== 'sharp' || textMm === 0) &&
      typeof quality === 'string' &&
      ['verified', 'degraded', 'unverified'].includes(quality)
    )
  }
  const textFinishLimitsValid = (limits) =>
    isRecord(limits) &&
    typeof limits.chamferMaxMm === 'number' &&
    Number.isFinite(limits.chamferMaxMm) &&
    limits.chamferMaxMm >= 0 &&
    limits.chamferMaxMm <= 1 &&
    Math.abs(limits.chamferMaxMm / 0.2 - Math.round(limits.chamferMaxMm / 0.2)) < 1e-8 &&
    typeof limits.roundMaxMm === 'number' &&
    Number.isFinite(limits.roundMaxMm) &&
    limits.roundMaxMm >= 0 &&
    limits.roundMaxMm <= 1 &&
    Math.abs(limits.roundMaxMm / 0.2 - Math.round(limits.roundMaxMm / 0.2)) < 1e-8
  const baseFinishLimitsValid = (limits) =>
    isRecord(limits) &&
    ['chamferMaxMm', 'roundMaxMm'].every((key) => {
      const value = limits[key]
      return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 2 &&
        Math.abs(value / 0.2 - Math.round(value / 0.2)) < 1e-8
      )
    })
  const magnetPocketValid = (pocket) => {
    if (!isRecord(pocket) || !Array.isArray(pocket.centerMm)) return false
    const centerMm = pocket.centerMm
    return (
      typeof pocket.preset === 'string' &&
      ['6x2', '8x2', '10x3', '12x3', '15x3'].includes(pocket.preset) &&
      typeof pocket.placement === 'string' &&
      ['center', 'upper', 'lower', 'left', 'right'].includes(pocket.placement) &&
      Number.isFinite(pocket.diameterMm) &&
      Number.isFinite(pocket.depthMm) &&
      centerMm.length === 2 &&
      centerMm.every((value) => typeof value === 'number' && Number.isFinite(value)) &&
      typeof pocket.adjusted === 'boolean' &&
      typeof pocket.safe === 'boolean'
    )
  }
  return (
    Number.isInteger(result.generationId) &&
    meshValid(result.baseMesh) &&
    meshValid(result.reliefMesh) &&
    dimensionsValid &&
    Array.isArray(result.issues) &&
    result.issues.every(
      (issue) =>
        isRecord(issue) &&
        (issue.severity === 'warning' || issue.severity === 'error') &&
        typeof issue.code === 'string' &&
        typeof issue.message === 'string',
    ) &&
    typeof result.printable === 'boolean' &&
    !!result.appearance &&
    (!result.magnetPocket || magnetPocketValid(result.magnetPocket)) &&
    (!result.edgeFinish || edgeFinishValid(result.edgeFinish)) &&
    (!result.textFinishLimits || textFinishLimitsValid(result.textFinishLimits)) &&
    (!result.baseFinishLimits || baseFinishLimitsValid(result.baseFinishLimits)) &&
    (!result.parameterLimits ||
      (isRecord(result.parameterLimits) &&
        Object.entries(result.parameterLimits).every(
          ([key, value]) =>
            ['cornerRadiusMm', 'stakeShoulderMm'].includes(key) && typeof value === 'number' && Number.isFinite(value) && value >= 0,
        )))
  )
}

/**
 * Worker message shapes — documented here for Step (c) (worker integration),
 * not implemented yet. Upstream typed `fontDefinition`/`subtitleFontDefinition`
 * as `FontDefinition` (src/domain/keychain/fonts/catalog.ts, 375 lines — not
 * ported in this step) and the error branch's `failure`/`diagnostics` fields
 * as `RecoveryFailure`/`OperationDiagnostics` (Open Keychain's own
 * error-recovery framework, intentionally not ported — Giftora's simpler
 * `GeometryError` from geometry/errors.js serves the equivalent purpose).
 * @typedef {
 *   | {type: 'warmup'}
 *   | {type: 'generate', requestId: number, params: KeychainParams, fontDefinition?: unknown, subtitleFontDefinition?: unknown}
 *   | {type: 'validate', requestId: number, params: KeychainParams, fontDefinition?: unknown, subtitleFontDefinition?: unknown}
 *   | {type: 'export', requestId: number, params: KeychainParams, format?: ExportFormat, mode?: ThreeMfMode, appearanceOverrides?: PrintAppearanceOverrides, fontDefinition?: unknown, subtitleFontDefinition?: unknown, allowDisconnected?: boolean}
 * } WorkerRequest
 * @typedef {
 *   | {type: 'ready', requestId: 0}
 *   | {type: 'geometry', requestId: number, result: Omit<GeometryResult, 'generationId'>}
 *   | {type: 'validation', requestId: number, result: GeometryValidation}
 *   | {type: 'export', requestId: number, filename: string, mimeType: string, data: ArrayBuffer}
 *   | {type: 'error', requestId: number, message: string, failure?: unknown, diagnostics?: unknown}
 * } WorkerResponse
 */

/** @type {KeychainParams} */
export const DEFAULT_PARAMS = {
  text: 'ALEX',
  subtitle: '',
  subtitleFontId: 'nunito',
  subtitleOffsetXRatio: 0,
  subtitleOffsetYRatio: 0,
  magnetPocketPreset: DEFAULT_MAGNET_POCKET_PRESET,
  magnetPocketPlacement: DEFAULT_MAGNET_POCKET_PLACEMENT,
  fontId: 'nunito',
  templateId: 'name-keychain',
  styleId: 'contour',
  textSizeMm: 20,
  fontWeightMm: 0.6,
  baseThicknessMm: 2.4,
  reliefDepthMm: 1,
  paddingMm: 2.4,
  edgeInsetMm: 2.4,
  letterSpacingMm: 1,
  holeDiameterMm: 5,
  keyringPreset: 'standard-round',
  keyringPosition: 'left',
  keyringOpeningShape: 'round',
  keyringSlotLengthMm: 5,
  connectorWidthMm: 1.8,
  cornerRadiusMm: 4,
  stakeLengthMm: 48,
  plantAccentEnabled: true,
  nameplateTiltDeg: 6,
  nameplateEmbedMm: 0.4,
  jointClearanceMm: 0.35,
  mechanicalGapMm: 0.6,
  maxJointAngleDeg: 35,
  minimumWallMm: 1.2,
  bottomClearanceMm: 0.25,
  reliefHaloMm: 0,
  ringOffsetMm: 0,
  bubbleLobeMm: 0,
  tagTailMm: 0,
  archCurveMm: 0,
  stakeShoulderMm: 0,
  jointBossMm: 0,
  ribbonTailMm: 12,
  ribbonNotchMm: 4,
  heartSizeMm: 22,
  heartBorderMm: 1.6,
  heartLeftGapMm: -1.5,
  heartRightGapMm: -1.5,
  heartVerticalOffsetMm: 1.5,
  heartInteriorMode: 'relief',
  subtitleTextSizeMm: 6,
  subtitleFontWeightMm: 0,
  subtitleLetterSpacingMm: 0.5,
  subtitleReliefDepthMm: 0.8,
  subtitleGapMm: 1.5,
  textEdgeMm: 0,
  textEdgeFinish: 'sharp',
  edgeFinish: 'sharp',
  topEdgeMm: 0,
  bottomEdgeMm: 0,
  sizeEnvelope: undefined,
  modelFeatures: [],
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * @param {KeychainParams} params
 * @returns {NormalizedParams}
 */
export function normalizeParams(params) {
  const sizeEnvelope = params.sizeEnvelope
  if (
    sizeEnvelope !== undefined &&
    (!Number.isFinite(sizeEnvelope.widthMm) ||
      !Number.isFinite(sizeEnvelope.heightMm) ||
      sizeEnvelope.widthMm < 20 ||
      sizeEnvelope.widthMm > 120 ||
      sizeEnvelope.heightMm < 15 ||
      sizeEnvelope.heightMm > 80)
  )
    throw new Error('Size must be 20–120 mm wide and 15–80 mm high.')
  const text = params.text.normalize('NFC').trim().replace(/\s+/g, ' ')
  const baseThicknessMm = clamp(
    params.baseThicknessMm,
    params.templateId === 'articulated-name' ? 3.4 : params.templateId === 'magnet' ? 4.4 : 1.6,
    params.templateId === 'magnet' ? 5 : 4,
  )
  const keyringOpeningShape = params.keyringOpeningShape === 'slot' ? 'slot' : 'round'
  const keyringPosition = KEYRING_POSITIONS.includes(params.keyringPosition ?? 'left') ? (params.keyringPosition ?? 'left') : 'left'
  const holeDiameterMm = clamp(params.holeDiameterMm, 3, 7)
  const keyringSlotLengthMm =
    keyringOpeningShape === 'slot'
      ? Math.max(holeDiameterMm, clamp(params.keyringSlotLengthMm ?? 8, 4, 14))
      : clamp(params.keyringSlotLengthMm ?? holeDiameterMm, 3, 14)
  const requestedKeyringPreset = ['compact-round', 'standard-round', 'large-round', 'oval-slot', 'custom'].includes(
    params.keyringPreset ?? '',
  )
    ? params.keyringPreset
    : 'standard-round'
  const keyringPreset =
    requestedKeyringPreset === 'custom' ||
    !KEYRING_PRESETS.some(
      (preset) =>
        preset.id === requestedKeyringPreset &&
        preset.shape === keyringOpeningShape &&
        preset.widthMm === holeDiameterMm &&
        preset.lengthMm === keyringSlotLengthMm,
    )
      ? 'custom'
      : requestedKeyringPreset
  const normalized = {
    ...params,
    text,
    edgeFinish: ['sharp', 'chamfer', 'round'].includes(params.edgeFinish ?? '') ? params.edgeFinish : 'sharp',
    topEdgeMm: clamp(Number.isFinite(params.topEdgeMm) ? params.topEdgeMm : 0, 0, 2),
    bottomEdgeMm: clamp(Number.isFinite(params.bottomEdgeMm) ? params.bottomEdgeMm : 0, 0, 2),
    textEdgeMm: clamp(Number.isFinite(params.textEdgeMm) ? params.textEdgeMm : 0, 0, 1),
    textEdgeFinish: ['sharp', 'chamfer', 'round'].includes(params.textEdgeFinish ?? '') ? params.textEdgeFinish : 'sharp',
    sizeEnvelope,
    styleId:
      params.styleId === 'heart-split' && params.templateId !== 'name-keychain'
        ? params.templateId === 'magnet'
          ? 'plain'
          : 'contour'
        : params.templateId === 'magnet' &&
            !['plain', 'contour', 'capsule', 'soft-tag', 'bubble', 'arch', 'ribbon'].includes(params.styleId)
          ? 'plain'
          : params.styleId === 'ribbon' && params.templateId !== 'name-keychain' && params.templateId !== 'magnet'
            ? 'contour'
            : params.styleId,
    subtitle: params.templateId !== 'articulated-name' ? (params.subtitle ?? '').normalize('NFC').trim().replace(/\s+/g, ' ') : '',
    subtitleFontId:
      params.templateId !== 'articulated-name' && params.subtitleFontId?.trim()
        ? params.subtitleFontId.trim()
        : DEFAULT_PARAMS.subtitleFontId,
    subtitleOffsetXRatio: params.templateId !== 'articulated-name' ? clamp(params.subtitleOffsetXRatio ?? 0, -1, 1) : 0,
    subtitleOffsetYRatio: params.templateId !== 'articulated-name' ? clamp(params.subtitleOffsetYRatio ?? 0, -1, 1) : 0,
    magnetPocketPreset:
      params.templateId === 'magnet' && ['6x2', '8x2', '10x3', '12x3', '15x3'].includes(params.magnetPocketPreset)
        ? params.magnetPocketPreset
        : DEFAULT_MAGNET_POCKET_PRESET,
    magnetPocketPlacement:
      params.templateId === 'magnet' && ['center', 'upper', 'lower', 'left', 'right'].includes(params.magnetPocketPlacement)
        ? params.magnetPocketPlacement
        : DEFAULT_MAGNET_POCKET_PLACEMENT,
    templateId: params.templateId ?? 'name-keychain',
    textSizeMm: clamp(params.textSizeMm, 12, 30),
    fontWeightMm: clamp(params.fontWeightMm ?? 0, 0, 1.5),
    baseThicknessMm,
    reliefDepthMm: clamp(params.reliefDepthMm, 0.6, 2),
    paddingMm: clamp(params.paddingMm, 1.2, 5),
    edgeInsetMm: clamp(params.edgeInsetMm ?? params.paddingMm, 0.8, 4),
    letterSpacingMm: clamp(params.letterSpacingMm ?? 1, 0, 8),
    holeDiameterMm,
    keyringPreset,
    keyringPosition,
    keyringOpeningShape,
    keyringSlotLengthMm,
    connectorWidthMm: clamp(params.connectorWidthMm ?? 1.8, 1.4, 3),
    cornerRadiusMm: clamp(params.cornerRadiusMm ?? 4, 1.5, 12),
    stakeLengthMm: clamp(params.stakeLengthMm ?? 48, 24, 100),
    plantAccentEnabled: params.plantAccentEnabled ?? true,
    nameplateTiltDeg: clamp(params.nameplateTiltDeg ?? 6, 0, 90),
    nameplateEmbedMm: clamp(params.nameplateEmbedMm ?? 0.4, 0.2, Math.max(0.2, baseThicknessMm - 0.3)),
    jointClearanceMm: clamp(params.jointClearanceMm ?? 0.35, 0.2, 0.6),
    mechanicalGapMm: clamp(params.mechanicalGapMm ?? 0.6, 0.4, 1.5),
    maxJointAngleDeg: clamp(params.maxJointAngleDeg ?? 35, 15, 50),
    minimumWallMm: clamp(params.minimumWallMm ?? 1.2, 0.8, 3),
    bottomClearanceMm: clamp(params.bottomClearanceMm ?? 0.25, 0.15, 0.6),
    reliefHaloMm:
      params.templateId === 'name-keychain' || params.templateId === 'nameplate' ? clamp(params.reliefHaloMm ?? 0, 0, 2) : 0,
    ringOffsetMm:
      params.templateId === 'name-keychain' || params.templateId === 'articulated-name'
        ? clamp(params.ringOffsetMm ?? 0, -3, 3)
        : 0,
    bubbleLobeMm:
      params.styleId === 'bubble' &&
      (params.templateId === 'name-keychain' || params.templateId === 'plant-label' || params.templateId === 'magnet')
        ? clamp(params.bubbleLobeMm ?? 0, 0, 4)
        : 0,
    tagTailMm:
      params.styleId === 'soft-tag' &&
      (params.templateId === 'name-keychain' || params.templateId === 'plant-label' || params.templateId === 'magnet')
        ? clamp(params.tagTailMm ?? 0, 0, 4)
        : 0,
    archCurveMm:
      params.styleId === 'arch' &&
      (params.templateId === 'name-keychain' || params.templateId === 'plant-label' || params.templateId === 'magnet')
        ? clamp(params.archCurveMm ?? 0, 0, 6)
        : 0,
    stakeShoulderMm: params.templateId === 'plant-label' ? clamp(params.stakeShoulderMm ?? 0, 0, 8) : 0,
    jointBossMm: params.templateId === 'articulated-name' ? clamp(params.jointBossMm ?? 0, 0, 3) : 0,
    ribbonTailMm:
      params.styleId === 'ribbon' && (params.templateId === 'name-keychain' || params.templateId === 'magnet')
        ? clamp(params.ribbonTailMm ?? 12, 6, 24)
        : 0,
    ribbonNotchMm:
      params.styleId === 'ribbon' && (params.templateId === 'name-keychain' || params.templateId === 'magnet')
        ? clamp(params.ribbonNotchMm ?? 4, 1, 10)
        : 0,
    heartSizeMm:
      params.templateId === 'name-keychain' && params.styleId === 'heart-split' ? clamp(params.heartSizeMm ?? 22, 12, 32) : 22,
    heartBorderMm:
      params.templateId === 'name-keychain' && params.styleId === 'heart-split'
        ? clamp(params.heartBorderMm ?? 1.6, 1.2, Math.min(4, (params.heartSizeMm ?? 22) * 0.2))
        : 1.6,
    heartLeftGapMm:
      params.templateId === 'name-keychain' && params.styleId === 'heart-split'
        ? clamp(params.heartLeftGapMm ?? -1.5, -6, 12)
        : -1.5,
    heartRightGapMm:
      params.templateId === 'name-keychain' && params.styleId === 'heart-split'
        ? clamp(params.heartRightGapMm ?? -1.5, -6, 12)
        : -1.5,
    heartVerticalOffsetMm:
      params.templateId === 'name-keychain' && params.styleId === 'heart-split'
        ? clamp(params.heartVerticalOffsetMm ?? 1.5, -10, 10)
        : 1.5,
    heartInteriorMode:
      params.templateId === 'name-keychain' &&
      params.styleId === 'heart-split' &&
      (params.heartInteriorMode === 'through-cut' || params.heartInteriorMode === 'relief')
        ? params.heartInteriorMode
        : 'relief',
    subtitleTextSizeMm: clamp(params.subtitleTextSizeMm ?? 6, 4, 12),
    subtitleFontWeightMm: clamp(params.subtitleFontWeightMm ?? 0, 0, 1.5),
    subtitleLetterSpacingMm: clamp(params.subtitleLetterSpacingMm ?? 0.5, 0, 4),
    subtitleReliefDepthMm: clamp(params.subtitleReliefDepthMm ?? 0.8, 0.4, 1.5),
    subtitleGapMm: clamp(params.subtitleGapMm ?? 1.5, 1.5, 8),
  }
  if (normalized.templateId === 'magnet') normalized.baseThicknessMm = clamp(params.baseThicknessMm, 4.4, 5)
  if (normalized.templateId !== 'name-keychain' && normalized.templateId !== 'nameplate') normalized.reliefHaloMm = 0
  if (normalized.templateId !== 'name-keychain' && normalized.templateId !== 'articulated-name') normalized.ringOffsetMm = 0
  if (
    !(normalized.templateId === 'name-keychain' || normalized.templateId === 'plant-label' || normalized.templateId === 'magnet') ||
    normalized.styleId !== 'bubble'
  )
    normalized.bubbleLobeMm = 0
  if (
    !(normalized.templateId === 'name-keychain' || normalized.templateId === 'plant-label' || normalized.templateId === 'magnet') ||
    normalized.styleId !== 'soft-tag'
  )
    normalized.tagTailMm = 0
  if (
    !(normalized.templateId === 'name-keychain' || normalized.templateId === 'plant-label' || normalized.templateId === 'magnet') ||
    normalized.styleId !== 'arch'
  )
    normalized.archCurveMm = 0
  if (normalized.templateId !== 'plant-label') normalized.stakeShoulderMm = 0
  if (normalized.templateId === 'plant-label') {
    const foundationHeight = Math.max(5, Math.min(8, normalized.textSizeMm * 0.26))
    const cornerRadiusMax = Math.max(1.5, Math.floor((foundationHeight / 2 - 0.5) / 0.5) * 0.5)
    normalized.cornerRadiusMm = clamp(normalized.cornerRadiusMm, 1.5, cornerRadiusMax)
  }
  if (normalized.templateId !== 'articulated-name') normalized.jointBossMm = 0
  if (normalized.templateId !== 'magnet') {
    normalized.magnetPocketPreset = DEFAULT_MAGNET_POCKET_PRESET
    normalized.magnetPocketPlacement = DEFAULT_MAGNET_POCKET_PLACEMENT
  }
  if (!['name-keychain', 'magnet'].includes(normalized.templateId) || normalized.styleId !== 'ribbon') {
    normalized.ribbonTailMm = 0
    normalized.ribbonNotchMm = 0
  }
  if (normalized.templateId === 'articulated-name') {
    normalized.fontWeightMm = 0
    normalized.edgeInsetMm = normalized.paddingMm
    normalized.letterSpacingMm = 0
    normalized.edgeFinish = 'sharp'
    normalized.topEdgeMm = 0
    normalized.bottomEdgeMm = 0
  }
  const finish = normalizeEdgeFinish(normalized)
  normalized.edgeFinish = finish.style
  normalized.topEdgeMm = finish.topMm
  normalized.bottomEdgeMm = finish.bottomMm
  normalized.textEdgeMm = finish.textMm
  normalized.textEdgeFinish = finish.textStyle
  return normalized
}

/**
 * Reconcile affected control values before normalizing a proposed editor change.
 * @param {KeychainParams} previous
 * @param {KeychainParams} candidate
 * @returns {KeychainParams}
 */
export function reconcileCandidateParams(previous, candidate) {
  const changedKeys = Object.keys(candidate).filter((key) => !Object.is(previous[key], candidate[key]))
  return reconcileDependentParameterValues(normalizeParams(candidate), changedKeys)
}

export function ringWallMm(holeDiameterMm) {
  return Math.max(2.2, Math.min(3.5, holeDiameterMm * 0.46))
}

/** @param {number} holeDiameterMm @returns {KeyringMetrics} */
export function keyringMetrics(holeDiameterMm) {
  const wallMm = ringWallMm(holeDiameterMm)
  return {
    wallMm,
    outerRadiusMm: holeDiameterMm / 2 + wallMm,
    rootWidthMm: Math.max(6, wallMm * 2.5),
    overlapMm: Math.max(5, wallMm * 2),
  }
}

/**
 * @param {string} text
 * @param {string} styleId
 * @param {ExportFormat} [extension]
 * @returns {string}
 */
export function sanitizeFilename(text, styleId, extension = 'stl') {
  const slug =
    text
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 48) || 'name'
  return `keychain-${slug}-${styleId}.${extension}`
}

// --- What could not be preserved directly from TypeScript ---
//
// 1. `RecoveryFailure`/`OperationDiagnostics` (upstream's own error-recovery
//    framework, from shared/lib/recovery/) typed a few optional fields
//    (`ValidationIssue.failure`, `WorkerResponse`'s error branch). Giftora has
//    no equivalent system and isn't adopting one here — those fields are kept
//    as untyped optionals. Giftora's own `GeometryError` (geometry/errors.js)
//    covers the same "something went wrong, here's why" need for now.
// 2. `FontDefinition` (from fonts/catalog.ts, not ported in this step) typed
//    `WorkerRequest`/`WorkerResponse`'s `fontDefinition`/`subtitleFontDefinition`
//    fields. Documented as `unknown` until the font-catalog step.
// 3. TypeScript's structural typing/exhaustiveness checking on `StyleId`/
//    `TemplateId` discriminated-union-like fields is enforced at compile time
//    upstream; in JS these are plain strings with no compiler-enforced
//    exhaustiveness. The runtime logic (which branches fire for which
//    template/style) is unchanged — only the compile-time safety net is gone.
//    Verification for this step therefore leans on running real inputs
//    through `normalizeParams`/`reconcileCandidateParams` (see the test
//    script referenced in DEVELOPMENT_PROGRESS.md) rather than type-checking.
