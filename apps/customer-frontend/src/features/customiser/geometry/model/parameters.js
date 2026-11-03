// Ported from Open Keychain (MIT) — src/domain/keychain/model/parameters.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
// See THIRD-PARTY-NOTICES.md.

import { DEPENDENT_PARAMETER_RANGES, dependentParameterRange } from './parameterConstraints.js'
import { DEFAULT_PARAMS } from './types.js'

/**
 * @typedef {object} ParameterRange
 * @property {number} min
 * @property {number} max
 * @property {number} step
 * @property {'mm'|'°'} unit
 */
/**
 * @typedef {ParameterRange & {
 *   labelKey: string,
 *   dependencies: readonly ShapeParameter[],
 *   randomization: 'uniform'|'boolean'|'derived',
 *   defaultValue: number,
 *   applicable: (params: Pick<import('./types').KeychainParams, 'templateId'|'styleId'>) => boolean,
 * }} ParameterDefinition
 */
/**
 * @typedef {'textSizeMm'|'fontWeightMm'|'baseThicknessMm'|'reliefDepthMm'|'paddingMm'|'edgeInsetMm'|
 *   'letterSpacingMm'|'holeDiameterMm'|'keyringSlotLengthMm'|'connectorWidthMm'|'jointClearanceMm'|
 *   'mechanicalGapMm'|'maxJointAngleDeg'|'cornerRadiusMm'|'stakeLengthMm'|'nameplateTiltDeg'|
 *   'nameplateEmbedMm'|'reliefHaloMm'|'ringOffsetMm'|'bubbleLobeMm'|'tagTailMm'|'archCurveMm'|
 *   'stakeShoulderMm'|'jointBossMm'|'ribbonTailMm'|'ribbonNotchMm'|'heartSizeMm'|'heartBorderMm'|
 *   'heartLeftGapMm'|'heartRightGapMm'|'heartVerticalOffsetMm'} ShapeParameter
 * @typedef {'template-details'|'style-details'|'refine'|'print'} ParameterPresentationGroup
 * @typedef {ShapeParameter|'plantAccentEnabled'} CustomizerParameter
 */

/** @type {Record<ShapeParameter, ParameterRange>} */
export const PARAMETER_RANGES = {
  textSizeMm: { min: 12, max: 30, step: 0.5, unit: 'mm' },
  fontWeightMm: { min: 0, max: 1.5, step: 0.1, unit: 'mm' },
  baseThicknessMm: { min: 1.6, max: 4, step: 0.1, unit: 'mm' },
  reliefDepthMm: { min: 0.6, max: 2, step: 0.1, unit: 'mm' },
  paddingMm: { min: 1.2, max: 5, step: 0.1, unit: 'mm' },
  edgeInsetMm: { min: 0.8, max: 4, step: 0.1, unit: 'mm' },
  letterSpacingMm: { min: 0, max: 8, step: 0.1, unit: 'mm' },
  holeDiameterMm: { min: 3, max: 7, step: 0.1, unit: 'mm' },
  keyringSlotLengthMm: DEPENDENT_PARAMETER_RANGES.keyringSlotLengthMm,
  connectorWidthMm: { min: 1.4, max: 3, step: 0.1, unit: 'mm' },
  jointClearanceMm: { min: 0.2, max: 0.6, step: 0.05, unit: 'mm' },
  mechanicalGapMm: { min: 0.4, max: 1.5, step: 0.1, unit: 'mm' },
  maxJointAngleDeg: { min: 15, max: 50, step: 1, unit: '°' },
  cornerRadiusMm: DEPENDENT_PARAMETER_RANGES.cornerRadiusMm,
  stakeLengthMm: { min: 24, max: 100, step: 1, unit: 'mm' },
  nameplateTiltDeg: { min: 0, max: 90, step: 1, unit: '°' },
  nameplateEmbedMm: { min: 0.2, max: 1.8, step: 0.1, unit: 'mm' },
  reliefHaloMm: DEPENDENT_PARAMETER_RANGES.reliefHaloMm,
  ringOffsetMm: DEPENDENT_PARAMETER_RANGES.ringOffsetMm,
  bubbleLobeMm: { min: 0, max: 4, step: 0.1, unit: 'mm' },
  tagTailMm: { min: 0, max: 4, step: 0.1, unit: 'mm' },
  archCurveMm: { min: 0, max: 6, step: 0.1, unit: 'mm' },
  stakeShoulderMm: { min: 0, max: 8, step: 0.1, unit: 'mm' },
  jointBossMm: DEPENDENT_PARAMETER_RANGES.jointBossMm,
  ribbonTailMm: { min: 6, max: 24, step: 0.5, unit: 'mm' },
  ribbonNotchMm: DEPENDENT_PARAMETER_RANGES.ribbonNotchMm,
  heartSizeMm: { min: 12, max: 32, step: 0.5, unit: 'mm' },
  heartBorderMm: { min: 1.2, max: 4, step: 0.1, unit: 'mm' },
  heartLeftGapMm: { min: -6, max: 12, step: 0.1, unit: 'mm' },
  heartRightGapMm: { min: -6, max: 12, step: 0.1, unit: 'mm' },
  heartVerticalOffsetMm: { min: -10, max: 10, step: 0.5, unit: 'mm' },
}

const LABEL_KEYS = {
  textSizeMm: 'textSize',
  fontWeightMm: 'fontWeight',
  baseThicknessMm: 'baseThickness',
  reliefDepthMm: 'raisedText',
  paddingMm: 'borderPadding',
  edgeInsetMm: 'backingSize',
  letterSpacingMm: 'letterSpacing',
  holeDiameterMm: 'keyringHole',
  keyringSlotLengthMm: 'keyringSlotLength',
  connectorWidthMm: 'connectorWidth',
  jointClearanceMm: 'jointClearance',
  mechanicalGapMm: 'mechanicalGap',
  maxJointAngleDeg: 'maxJointAngle',
  cornerRadiusMm: 'cornerRadius',
  stakeLengthMm: 'stakeLength',
  nameplateTiltDeg: 'textTilt',
  nameplateEmbedMm: 'embedDepth',
  reliefHaloMm: 'reliefHalo',
  ringOffsetMm: 'keyringHoleOffset',
  bubbleLobeMm: 'bubbleLobe',
  tagTailMm: 'tagTail',
  archCurveMm: 'archCurve',
  stakeShoulderMm: 'stakeShoulder',
  jointBossMm: 'jointBoss',
  ribbonTailMm: 'ribbonTail',
  ribbonNotchMm: 'ribbonNotch',
  heartSizeMm: 'heartSize',
  heartBorderMm: 'heartBorder',
  heartLeftGapMm: 'heartLeftGap',
  heartRightGapMm: 'heartRightGap',
  heartVerticalOffsetMm: 'heartVerticalOffset',
}

function dependenciesFor(parameter) {
  if (parameter === 'paddingMm' || parameter === 'reliefHaloMm') return ['textSizeMm']
  if (parameter === 'reliefDepthMm') return ['baseThicknessMm']
  if (parameter === 'jointBossMm') return ['connectorWidthMm', 'jointClearanceMm']
  if (parameter === 'heartBorderMm') return ['heartSizeMm']
  if (parameter === 'cornerRadiusMm') return ['textSizeMm', 'paddingMm', 'nameplateEmbedMm', 'nameplateTiltDeg']
  return []
}

function applicableFor(parameter) {
  return (params) =>
    hasTemplateParameter(params.templateId, parameter) &&
    !(parameter === 'keyringSlotLengthMm' && params.templateId !== 'name-keychain' && params.templateId !== 'articulated-name') &&
    !(parameter === 'bubbleLobeMm' && params.styleId !== 'bubble') &&
    !(parameter === 'tagTailMm' && params.styleId !== 'soft-tag') &&
    !(parameter === 'archCurveMm' && params.styleId !== 'arch') &&
    !(parameter === 'ribbonTailMm' && params.styleId !== 'ribbon') &&
    !(parameter === 'ribbonNotchMm' && params.styleId !== 'ribbon') &&
    !(parameter === 'cornerRadiusMm' && params.templateId === 'magnet' && params.styleId !== 'plain' && params.styleId !== 'ribbon') &&
    !(
      ['heartSizeMm', 'heartBorderMm', 'heartLeftGapMm', 'heartRightGapMm', 'heartVerticalOffsetMm'].includes(parameter) &&
      (params.templateId !== 'name-keychain' || params.styleId !== 'heart-split')
    ) &&
    !(parameter === 'cornerRadiusMm' && params.templateId === 'plant-label' && params.styleId === 'capsule')
}

/** @type {Record<ShapeParameter, ParameterDefinition>} */
export const PARAMETER_DEFINITIONS = Object.fromEntries(
  Object.keys(PARAMETER_RANGES).map((parameter) => [
    parameter,
    {
      ...PARAMETER_RANGES[parameter],
      labelKey: LABEL_KEYS[parameter],
      dependencies: dependenciesFor(parameter),
      randomization: 'uniform',
      defaultValue: DEFAULT_PARAMS[parameter],
      applicable: applicableFor(parameter),
    },
  ]),
)

export const CUSTOMIZER_PARAMETER_DEFINITIONS = {
  plantAccentEnabled: { labelKey: 'plantAccents', dependencies: [], randomization: 'boolean' },
  ...PARAMETER_DEFINITIONS,
}

/** Single registry consumed by controls, randomization, and normalization. */
export const PARAMETER_REGISTRY = PARAMETER_DEFINITIONS

/** UI ownership follows the selected template/style and stays beside that choice.
 * @param {Pick<import('./types').KeychainParams, 'templateId'|'styleId'>} params
 * @param {ShapeParameter} parameter
 * @returns {ParameterPresentationGroup}
 */
export function parameterPresentationGroup(params, parameter) {
  if (
    [
      'holeDiameterMm',
      'keyringSlotLengthMm',
      'ringOffsetMm',
      'connectorWidthMm',
      'jointClearanceMm',
      'mechanicalGapMm',
      'maxJointAngleDeg',
      'jointBossMm',
      'nameplateTiltDeg',
      'nameplateEmbedMm',
      'stakeLengthMm',
      'stakeShoulderMm',
    ].includes(parameter)
  )
    return 'template-details'
  if (parameter === 'cornerRadiusMm' && params.templateId === 'nameplate') return 'template-details'
  if (
    [
      'bubbleLobeMm',
      'tagTailMm',
      'archCurveMm',
      'ribbonTailMm',
      'ribbonNotchMm',
      'heartSizeMm',
      'heartBorderMm',
      'heartLeftGapMm',
      'heartRightGapMm',
      'heartVerticalOffsetMm',
    ].includes(parameter) ||
    parameter === 'cornerRadiusMm'
  )
    return 'style-details'
  if (parameter === 'baseThicknessMm' || parameter === 'reliefDepthMm') return 'print'
  return 'refine'
}

/**
 * @param {import('./types').KeychainParams} params
 * @param {ParameterPresentationGroup} group
 * @returns {ShapeParameter[]}
 */
export function parametersForPresentationGroup(params, group) {
  return Object.keys(PARAMETER_REGISTRY).filter(
    (parameter) => hasActiveParameter(params, parameter) && parameterPresentationGroup(params, parameter) === group,
  )
}

/** Presentation groups for the registry-driven controls in Shape > Figure. */
export const PARAMETER_GROUPS = [
  { key: 'common', parameters: ['baseThicknessMm', 'paddingMm', 'edgeInsetMm', 'holeDiameterMm', 'keyringSlotLengthMm', 'ringOffsetMm'] },
  { key: 'relief', parameters: ['reliefDepthMm', 'reliefHaloMm'] },
  { key: 'outline', parameters: ['cornerRadiusMm', 'bubbleLobeMm', 'tagTailMm', 'archCurveMm'] },
  {
    key: 'templateDetails',
    parameters: ['nameplateTiltDeg', 'nameplateEmbedMm', 'stakeLengthMm', 'stakeShoulderMm', 'ribbonTailMm', 'ribbonNotchMm'],
  },
  { key: 'heart', parameters: ['heartSizeMm', 'heartBorderMm', 'heartLeftGapMm', 'heartRightGapMm', 'heartVerticalOffsetMm'] },
  { key: 'mechanics', parameters: ['connectorWidthMm', 'jointClearanceMm', 'mechanicalGapMm', 'maxJointAngleDeg', 'jointBossMm'] },
]

const COMMON_PARAMETERS = ['textSizeMm', 'baseThicknessMm']
const STANDARD_TEXT_PARAMETERS = ['fontWeightMm', 'edgeInsetMm']
const RELIEF_PARAMETERS = ['reliefDepthMm']

/** @type {Record<import('./types').TemplateId, readonly ShapeParameter[]>} */
export const TEMPLATE_PARAMETER_KEYS = {
  'name-keychain': [
    ...COMMON_PARAMETERS,
    ...STANDARD_TEXT_PARAMETERS,
    ...RELIEF_PARAMETERS,
    'paddingMm',
    'letterSpacingMm',
    'holeDiameterMm',
    'keyringSlotLengthMm',
    'reliefHaloMm',
    'ringOffsetMm',
    'bubbleLobeMm',
    'tagTailMm',
    'archCurveMm',
    'ribbonTailMm',
    'ribbonNotchMm',
    'heartSizeMm',
    'heartBorderMm',
    'heartLeftGapMm',
    'heartRightGapMm',
    'heartVerticalOffsetMm',
  ],
  'articulated-name': [
    ...COMMON_PARAMETERS,
    ...RELIEF_PARAMETERS,
    'holeDiameterMm',
    'keyringSlotLengthMm',
    'connectorWidthMm',
    'jointClearanceMm',
    'mechanicalGapMm',
    'maxJointAngleDeg',
    'jointBossMm',
    'ringOffsetMm',
  ],
  nameplate: [
    ...COMMON_PARAMETERS,
    ...STANDARD_TEXT_PARAMETERS,
    ...RELIEF_PARAMETERS,
    'paddingMm',
    'letterSpacingMm',
    'nameplateTiltDeg',
    'nameplateEmbedMm',
    'cornerRadiusMm',
    'reliefHaloMm',
  ],
  'plant-label': [
    ...COMMON_PARAMETERS,
    ...STANDARD_TEXT_PARAMETERS,
    ...RELIEF_PARAMETERS,
    'paddingMm',
    'letterSpacingMm',
    'cornerRadiusMm',
    'stakeLengthMm',
    'stakeShoulderMm',
    'bubbleLobeMm',
    'tagTailMm',
    'archCurveMm',
  ],
  magnet: [
    ...COMMON_PARAMETERS,
    ...STANDARD_TEXT_PARAMETERS,
    ...RELIEF_PARAMETERS,
    'paddingMm',
    'letterSpacingMm',
    'cornerRadiusMm',
    'bubbleLobeMm',
    'tagTailMm',
    'archCurveMm',
    'ribbonTailMm',
    'ribbonNotchMm',
  ],
}

/** @param {import('./types').TemplateId} templateId @returns {readonly ShapeParameter[]} */
export function templateParameterKeys(templateId) {
  return TEMPLATE_PARAMETER_KEYS[templateId]
}

/** Return active parameters in dependency-first order for deterministic updates.
 * @param {import('./types').TemplateId} templateId
 * @returns {readonly ShapeParameter[]}
 */
export function orderedTemplateParameterKeys(templateId) {
  const active = new Set(TEMPLATE_PARAMETER_KEYS[templateId])
  const ordered = []
  const visiting = new Set()
  const visited = new Set()
  const visit = (parameter) => {
    if (visited.has(parameter) || !active.has(parameter)) return
    if (visiting.has(parameter)) return
    visiting.add(parameter)
    for (const dependency of PARAMETER_REGISTRY[parameter].dependencies) visit(dependency)
    visiting.delete(parameter)
    visited.add(parameter)
    ordered.push(parameter)
  }
  for (const parameter of TEMPLATE_PARAMETER_KEYS[templateId]) visit(parameter)
  return ordered
}

/** @param {import('./types').TemplateId} templateId @param {CustomizerParameter} parameter @returns {boolean} */
export function hasTemplateParameter(templateId, parameter) {
  if (parameter === 'plantAccentEnabled') return templateId === 'plant-label'
  return templateParameterKeys(templateId).includes(parameter)
}

/** Parameters that are meaningful for the currently selected template and style.
 * @param {import('./types').KeychainParams} params
 * @param {CustomizerParameter} parameter
 * @returns {boolean}
 */
export function hasActiveParameter(params, parameter) {
  if (parameter === 'plantAccentEnabled')
    return hasTemplateParameter(params.templateId, parameter) && ['contour', 'capsule', 'soft-tag', 'bubble', 'arch'].includes(params.styleId)
  return PARAMETER_DEFINITIONS[parameter].applicable(params)
}

function roundedDown(value, step) {
  return Math.floor(value / step) * step
}

/**
 * Limits controls to values the active generator can use without silently
 * clamping them. These formulas mirror the corresponding template builders.
 * @param {import('./types').KeychainParams} params
 * @param {ShapeParameter} parameter
 * @returns {ParameterRange}
 */
export function parameterRange(params, parameter) {
  if (['reliefHaloMm', 'ringOffsetMm', 'jointBossMm', 'keyringSlotLengthMm', 'ribbonNotchMm'].includes(parameter))
    return dependentParameterRange(params, parameter, PARAMETER_RANGES[parameter])
  if (parameter === 'cornerRadiusMm' && (params.templateId === 'magnet' || params.styleId === 'ribbon'))
    return dependentParameterRange(params, parameter, PARAMETER_RANGES[parameter])
  if (parameter === 'heartBorderMm') {
    const range = PARAMETER_RANGES.heartBorderMm
    return { ...range, max: Math.max(range.min, Math.min(range.max, params.heartSizeMm * 0.2)) }
  }
  if (parameter === 'baseThicknessMm' && params.templateId === 'articulated-name')
    return { ...PARAMETER_RANGES.baseThicknessMm, min: 3.4 }
  if (parameter === 'baseThicknessMm' && params.templateId === 'magnet')
    return { ...PARAMETER_RANGES.baseThicknessMm, min: 4.4, max: 5 }

  if (parameter === 'nameplateEmbedMm') {
    const range = PARAMETER_RANGES.nameplateEmbedMm
    return { ...range, max: Math.max(range.min, roundedDown(Math.min(range.max, params.baseThicknessMm - 0.3), range.step)) }
  }

  if (parameter === 'cornerRadiusMm') {
    const range = PARAMETER_RANGES.cornerRadiusMm
    if (params.templateId === 'plant-label') {
      const foundationHeight = Math.max(5, Math.min(8, params.textSizeMm * 0.26))
      return { ...range, max: Math.max(range.min, roundedDown(foundationHeight / 2 - 0.5, range.step)) }
    }
    if (params.templateId === 'nameplate') {
      const textDepth = params.nameplateEmbedMm + params.reliefDepthMm
      const tiltMargin = Math.abs(Math.sin((params.nameplateTiltDeg * Math.PI) / 180)) * textDepth
      const height = Math.max(18, params.textSizeMm + params.paddingMm * 2 + tiltMargin * 2)
      return { ...range, max: Math.max(range.min, roundedDown(Math.min(range.max, height / 2 - params.paddingMm - 0.25), range.step)) }
    }
  }

  return PARAMETER_RANGES[parameter]
}
