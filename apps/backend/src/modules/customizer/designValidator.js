import { createHash } from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'
import {
  DEFAULT_KEYRING_POSITION,
  DEFAULT_STYLE_ID,
  FONTS,
  KEYRING_POSITIONS,
  MATERIALS,
  MAX_TEXT_LENGTH,
  TEMPLATES,
  THICKNESSES,
  textSizeMmForSize,
} from './designOptions.js'

const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/

function bad(message) {
  return new HttpError(400, message)
}

function cleanText(value, field, { required }) {
  if (value === undefined || value === null) value = ''
  if (typeof value !== 'string') throw bad(`${field} must be a string.`)
  const text = value.normalize('NFC').trim()
  if (CONTROL_CHARS.test(text)) throw bad(`${field} contains characters that cannot be printed.`)
  if ([...text].length > MAX_TEXT_LENGTH) throw bad(`${field} can be at most ${MAX_TEXT_LENGTH} characters.`)
  if (required && text.length === 0) throw bad(`${field} is required.`)
  return text
}

function pickPaletteColor(input, palette, field) {
  const hex = typeof input === 'string' ? input : input?.hex
  if (typeof hex !== 'string') throw bad(`${field} is required.`)
  const match = palette.find((color) => color.hex.toLowerCase() === hex.trim().toLowerCase())
  if (!match) throw bad(`${field} is not available for the selected material.`)
  return { label: match.label, hex: match.hex }
}

/**
 * Validates a customer's design against the server's allow-lists and returns
 * the canonical design, the exact geometry-engine parameters, and a title.
 * Nothing the client sends about price, labels or derived values is trusted.
 */
export function validateDesignInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw bad('A design object is required.')

  const template = TEMPLATES[input.templateId]
  if (!template) throw bad('templateId is not a supported template.')

  const text = cleanText(input.text, 'text', { required: true })
  const subtitle = cleanText(input.subtitle, 'subtitle', { required: false })
  if (subtitle && !template.supportsSubtitle) throw bad(`The ${template.name} template does not support a subtitle.`)

  let styleId = null
  if (template.styles.length > 0) {
    if (!template.styles.includes(input.styleId)) throw bad('styleId is not available for this template.')
    styleId = input.styleId
  }

  const font = FONTS[input.fontId]
  if (!font) throw bad('fontId is not a supported font.')
  if (template.requiresArticulatedFont && !font.supportsArticulated) {
    throw bad(`${font.name} cannot be used for an articulated name.`)
  }

  if (!template.materials.includes(input.material)) throw bad('material is not available for this template.')
  const palette = MATERIALS[input.material].colors
  const color = pickPaletteColor(input.color, palette, 'color')
  const textColor = pickPaletteColor(input.textColor, palette, 'textColor')

  if (!template.sizes.includes(input.size)) throw bad('size is not available for this template.')

  const thickness = THICKNESSES[input.thickness]
  if (!thickness) throw bad('thickness is not a supported option.')

  let keyringPosition = null
  if (template.supportsKeyring) {
    const position = input.keyringPosition ?? DEFAULT_KEYRING_POSITION
    if (!KEYRING_POSITIONS.includes(position)) throw bad('keyringPosition is not supported.')
    keyringPosition = position
  } else if (input.keyringPosition !== undefined && input.keyringPosition !== null) {
    throw bad(`The ${template.name} template has no keyring hole.`)
  }

  if (input.allowDisconnected !== undefined && typeof input.allowDisconnected !== 'boolean') {
    throw bad('allowDisconnected must be true or false.')
  }

  // Fixed key order: the same design always serialises (and hashes) the same way.
  const params = {
    templateId: input.templateId,
    styleId,
    text,
    subtitle,
    fontId: input.fontId,
    material: input.material,
    color,
    textColor,
    size: input.size,
    thickness: input.thickness,
    keyringPosition,
    allowDisconnected: input.allowDisconnected === true,
  }

  // What the customiser hands the geometry engine (on top of its defaults).
  const engineParams = {
    text,
    subtitle,
    subtitleFontId: input.fontId,
    fontId: input.fontId,
    templateId: input.templateId,
    styleId: styleId ?? DEFAULT_STYLE_ID,
    textSizeMm: textSizeMmForSize(input.size),
    baseThicknessMm: thickness.baseThicknessMm,
    ...(keyringPosition ? { keyringPosition } : {}),
  }

  return {
    params,
    engineParams,
    title: `${template.name} "${text}"`,
    paramsHash: hashParams(params),
  }
}

export function hashParams(params) {
  return createHash('sha256').update(JSON.stringify(params)).digest('hex')
}
