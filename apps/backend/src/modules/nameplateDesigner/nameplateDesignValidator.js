import crypto from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'
import { DEFAULT_NAMEPLATE_TYPES, DEFAULT_NAMEPLATE_SHAPES, DEFAULT_NAMEPLATE_FINISHES } from './nameplateDesignOptions.js'

const VALID_TYPES = new Set(DEFAULT_NAMEPLATE_TYPES.map((t) => t.id))
const VALID_SHAPES = new Set(DEFAULT_NAMEPLATE_SHAPES)
const VALID_FINISHES = new Set(DEFAULT_NAMEPLATE_FINISHES)
const VALID_MOUNTING = new Set(['flat-wall', 'freestanding-desk', 'text-only-3d', 'layered-background'])
const VALID_LETTERING = new Set(['raised', 'engraved', 'cut-out'])

function sortObject(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObject(obj[key])
      return acc
    }, {})
}

export function validateNameplateDesignInput(input) {
  if (!input || typeof input !== 'object') {
    throw new HttpError(400, 'Invalid request body.')
  }

  const nameplateType = String(input.nameplateType || 'desk').toLowerCase().trim()
  if (!VALID_TYPES.has(nameplateType)) {
    throw new HttpError(400, `Invalid nameplate type: ${nameplateType}`)
  }

  const shape = String(input.shape || 'rounded-rectangle').toLowerCase().trim()
  if (!VALID_SHAPES.has(shape)) {
    throw new HttpError(400, `Invalid shape: ${shape}`)
  }

  const mountingStyle = String(input.mountingStyle || 'freestanding-desk').toLowerCase().trim()
  if (!VALID_MOUNTING.has(mountingStyle)) {
    throw new HttpError(400, `Invalid mounting style: ${mountingStyle}`)
  }

  const cfg = input.designConfig && typeof input.designConfig === 'object' ? input.designConfig : {}

  const widthMm = Math.max(60, Math.min(350, Number(cfg.widthMm) || 180))
  const heightMm = Math.max(30, Math.min(220, Number(cfg.heightMm) || 50))
  const baseThicknessMm = Math.max(1.5, Math.min(12, Number(cfg.baseThicknessMm) || 4))
  const cornerRadiusMm = Math.max(0, Math.min(25, Number(cfg.cornerRadiusMm) || 8))
  const textExtrusionMm = Math.max(0.5, Math.min(8, Number(cfg.textExtrusionMm) || 2.5))
  const engravingDepthMm = Math.max(0.4, Math.min(baseThicknessMm - 0.5, Number(cfg.engravingDepthMm) || 1.2))

  const letteringMode = VALID_LETTERING.has(cfg.letteringMode) ? cfg.letteringMode : 'raised'
  const materialFinish = VALID_FINISHES.has(cfg.materialFinish) ? cfg.materialFinish : 'matte-pla'

  const borderEnabled = Boolean(cfg.borderEnabled)
  const borderWidthMm = Math.max(1, Math.min(10, Number(cfg.borderWidthMm) || 3))
  const borderHeightMm = Math.max(0.5, Math.min(6, Number(cfg.borderHeightMm) || 2))

  const ledGlowEnabled = Boolean(cfg.ledGlowEnabled)
  const baseColor = typeof cfg.baseColor === 'string' && cfg.baseColor.startsWith('#') ? cfg.baseColor : '#0D0D0D'
  const secondaryBaseColor = typeof cfg.secondaryBaseColor === 'string' && cfg.secondaryBaseColor.startsWith('#') ? cfg.secondaryBaseColor : '#1A1A1A'
  const borderColor = typeof cfg.borderColor === 'string' && cfg.borderColor.startsWith('#') ? cfg.borderColor : '#D9AE4E'
  const ledAccentColor = typeof cfg.ledAccentColor === 'string' && cfg.ledAccentColor.startsWith('#') ? cfg.ledAccentColor : '#00E5FF'

  const rawLines = Array.isArray(cfg.lines) ? cfg.lines : []
  const lines = rawLines.slice(0, 4).map((l, idx) => ({
    id: String(l.id || `line-${idx + 1}`),
    text: String(l.text || '').trim().slice(0, 30),
    fontId: String(l.fontId || 'outfit').trim().slice(0, 40),
    fontSize: Math.max(6, Math.min(50, Number(l.fontSize) || 16)),
    letterSpacing: Math.max(-2, Math.min(10, Number(l.letterSpacing) || 0)),
    align: ['left', 'center', 'right'].includes(l.align) ? l.align : 'center',
    bold: Boolean(l.bold),
    italic: Boolean(l.italic),
    textTransform: ['none', 'uppercase', 'lowercase', 'capitalize'].includes(l.textTransform) ? l.textTransform : 'none',
    color: typeof l.color === 'string' && l.color.startsWith('#') ? l.color : '#D9AE4E',
    yOffset: Math.max(-40, Math.min(40, Number(l.yOffset) || 0)),
  }))

  const canonical = {
    nameplateType,
    shape,
    mountingStyle,
    letteringMode,
    materialFinish,
    decoration: String(cfg.decoration || 'none').trim(),
    dimensions: {
      widthMm,
      heightMm,
      baseThicknessMm,
      cornerRadiusMm,
      textExtrusionMm,
      engravingDepthMm,
    },
    border: {
      enabled: borderEnabled,
      widthMm: borderWidthMm,
      heightMm: borderHeightMm,
    },
    appearance: {
      baseColor,
      secondaryBaseColor,
      borderColor,
      ledAccentColor,
      ledGlowEnabled,
    },
    lines,
  }

  const canonicalJson = JSON.stringify(sortObject(canonical))
  const paramsHash = crypto.createHash('sha256').update(canonicalJson).digest('hex')

  const primaryText = lines.find((l) => l.text)?.text || 'Custom'
  const title = `${nameplateType.toUpperCase()} NAMEPLATE: ${primaryText}`

  return { canonical, paramsHash, title, nameplateType, shape, mountingStyle }
}
