import { createHash } from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'
import { CATEGORIES, FINISHES, FONTS, MOTIFS, THEMES } from './standDesignOptions.js'

const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/

function bad(msg) {
  return new HttpError(400, msg)
}

function numberInRange(val, min, max, field) {
  if (typeof val !== 'number' || !Number.isFinite(val)) throw bad(`${field} must be a number.`)
  if (val < min || val > max) throw bad(`${field} must be between ${min} and ${max}.`)
  return val
}

function oneOf(val, allowed, field) {
  if (!allowed.includes(val)) throw bad(`${field} is not supported.`)
  return val
}

function cleanText(val, field, maxLen) {
  if (val === undefined || val === null) val = ''
  if (typeof val !== 'string') throw bad(`${field} must be a string.`)
  const text = val.normalize('NFC').trim()
  if (CONTROL_CHARS.test(text)) throw bad(`${field} contains invalid characters.`)
  if ([...text].length > maxLen) throw bad(`${field} exceeds ${maxLen} characters.`)
  return text
}

/**
 * Validates the incoming DesignConfig JSON. Returns the canonicalised config
 * and a paramsHash (sha256 of the JSON) for deduplication.
 */
export function validateStandDesignInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw bad('A design config object is required.')

  const category = input.category
  if (!CATEGORIES[category]) throw bad('category is not supported.')

  const phone = input.phone ?? {}
  const pen = input.pen ?? {}
  const combined = input.combined ?? {}
  const personalization = input.personalization ?? {}
  const appearance = input.appearance ?? {}
  const print = input.print ?? {}

  // Validate phone params only if the category uses them
  if (category !== 'pen-holder') {
    numberInRange(phone.baseWidth, 40, 200, 'phone.baseWidth')
    numberInRange(phone.baseDepth, 40, 200, 'phone.baseDepth')
    numberInRange(phone.baseThickness, 2, 20, 'phone.baseThickness')
    numberInRange(phone.backHeight, 30, 200, 'phone.backHeight')
    numberInRange(phone.restingAngle, 30, 88, 'phone.restingAngle')
    numberInRange(phone.lipHeight, 2, 40, 'phone.lipHeight')
    numberInRange(phone.phoneThickness, 4, 25, 'phone.phoneThickness')
    numberInRange(phone.caseClearance, 0, 6, 'phone.caseClearance')
    numberInRange(phone.cornerRadius, 0, 25, 'phone.cornerRadius')
    numberInRange(phone.cableSlotWidth, 4, 40, 'phone.cableSlotWidth')
    oneOf(phone.orientation, ['portrait', 'landscape'], 'phone.orientation')
    if (typeof phone.cableRoutingHole !== 'boolean') throw bad('phone.cableRoutingHole must be boolean.')
    if (typeof phone.nonSlipRecesses !== 'boolean') throw bad('phone.nonSlipRecesses must be boolean.')
    if (typeof phone.sidePenLoop !== 'boolean') throw bad('phone.sidePenLoop must be boolean.')
  }

  if (category !== 'phone-stand') {
    numberInRange(pen.cupHeight, 30, 200, 'pen.cupHeight')
    numberInRange(pen.exteriorDiameter, 30, 150, 'pen.exteriorDiameter')
    numberInRange(pen.wallThickness, 1, 12, 'pen.wallThickness')
    numberInRange(pen.bottomThickness, 1, 15, 'pen.bottomThickness')
    numberInRange(pen.slotCount, 1, 20, 'pen.slotCount')
    numberInRange(pen.slotDiameter, 4, 25, 'pen.slotDiameter')
    numberInRange(pen.ribCount, 4, 40, 'pen.ribCount')
    numberInRange(pen.ribDepth, 0, 5, 'pen.ribDepth')
    numberInRange(pen.cupCount, 1, 4, 'pen.cupCount')
    if (typeof pen.shallowTray !== 'boolean') throw bad('pen.shallowTray must be boolean.')
    if (typeof pen.integratedBase !== 'boolean') throw bad('pen.integratedBase must be boolean.')
  }

  if (category === 'combined' || category === 'desk-organizer' || category === 'personalized-gift') {
    numberInRange(combined.moduleSpacing, 1, 40, 'combined.moduleSpacing')
    numberInRange(combined.trayWidth, 20, 120, 'combined.trayWidth')
    numberInRange(combined.trayDepth, 20, 120, 'combined.trayDepth')
    numberInRange(combined.trayWallHeight, 4, 40, 'combined.trayWallHeight')
    if (typeof combined.includeTray !== 'boolean') throw bad('combined.includeTray must be boolean.')
    if (typeof combined.mergeSingleSolid !== 'boolean') throw bad('combined.mergeSingleSolid must be boolean.')
  }

  // Personalisation
  if (personalization.enabled) {
    cleanText(personalization.text, 'personalization.text', 22)
    oneOf(personalization.fontStyle, FONTS, 'personalization.fontStyle')
    oneOf(personalization.motif, MOTIFS, 'personalization.motif')
    numberInRange(personalization.fontSize, 3, 30, 'personalization.fontSize')
    numberInRange(personalization.depth, 0.2, 5, 'personalization.depth')
    numberInRange(personalization.letterSpacing, 0.5, 3, 'personalization.letterSpacing')
    numberInRange(personalization.motifSize, 3, 30, 'personalization.motifSize')
  }

  // Appearance
  oneOf(appearance.themeId, THEMES, 'appearance.themeId')
  oneOf(appearance.finish, FINISHES, 'appearance.finish')
  const colors = appearance.colors ?? {}
  for (const zone of ['base', 'back', 'cup', 'text', 'accent']) {
    if (typeof colors[zone] !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(colors[zone])) {
      throw bad(`appearance.colors.${zone} must be a 6-digit hex color.`)
    }
  }

  // Canonical config — only the fields the engine needs
  const canonical = {
    category,
    phone,
    pen,
    combined,
    personalization: {
      enabled: !!personalization.enabled,
      text: personalization.enabled ? cleanText(personalization.text, 'personalization.text', 22) : '',
      fontStyle: personalization.fontStyle ?? 'modern-sans',
      fontSize: personalization.fontSize ?? 8,
      alignment: personalization.alignment ?? 'center',
      letterSpacing: personalization.letterSpacing ?? 1,
      depth: personalization.depth ?? 1.5,
      mode: personalization.mode ?? 'raised',
      curved: !!personalization.curved,
      placement: personalization.placement ?? 'front',
      motif: personalization.motif ?? 'none',
      motifSize: personalization.motifSize ?? 10,
      svgLogoData: personalization.svgLogoData ?? null,
      svgLogoName: personalization.svgLogoName ?? null,
      svgLogoScale: personalization.svgLogoScale ?? 1,
      svgLogoMode: personalization.svgLogoMode ?? 'raised',
    },
    appearance: {
      themeId: appearance.themeId,
      finish: appearance.finish,
      colors: {
        base: colors.base,
        back: colors.back,
        cup: colors.cup,
        text: colors.text,
        accent: colors.accent,
      },
    },
    print: {
      filament: print.filament ?? 'PLA',
      layerHeight: print.layerHeight ?? 0.2,
      infillPercent: print.infillPercent ?? 20,
      minWallThickness: print.minWallThickness ?? 2.4,
      bedPreset: print.bedPreset ?? '220x220',
      customBedX: print.customBedX ?? 220,
      customBedY: print.customBedY ?? 220,
      customBedZ: print.customBedZ ?? 250,
      filamentCostPerKg: print.filamentCostPerKg ?? 22,
      markupPercent: print.markupPercent ?? 180,
    },
  }

  const paramsHash = createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
  const title = `${CATEGORIES[category].name}${canonical.personalization.enabled && canonical.personalization.text ? ` "${canonical.personalization.text}"` : ''}`

  return { canonical, paramsHash, title }
}