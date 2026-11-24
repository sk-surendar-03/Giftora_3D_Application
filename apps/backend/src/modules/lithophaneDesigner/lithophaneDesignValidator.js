import { createHash } from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'
import {
  LITHOPHANE_TEMPLATES,
  VALID_BASE_TYPES,
  VALID_PUCK_TYPES,
  VALID_TEMPLATE_IDS,
} from './lithophaneDesignOptions.js'

function bad(msg) {
  return new HttpError(400, msg)
}

function sha256Hex(str) {
  return createHash('sha256').update(str).digest('hex')
}

const TEMPLATE_MAP = new Map(LITHOPHANE_TEMPLATES.map((t) => [t.id, t]))

export function validateLithophaneDesignInput(input) {
  if (!input || typeof input !== 'object') {
    throw bad('Input body must be an object.')
  }

  // 1. Title validation
  const rawTitle = typeof input.title === 'string' ? input.title.trim() : ''
  const title = (rawTitle || 'Lithophane Photo Lamp').slice(0, 100)

  // 2. Template archetype validation
  const templateId = String(input.templateId || '').trim().toLowerCase()
  if (!VALID_TEMPLATE_IDS.has(templateId)) {
    throw bad(`Invalid templateId "${templateId}". Supported: ${Array.from(VALID_TEMPLATE_IDS).join(', ')}`)
  }
  const templateMeta = TEMPLATE_MAP.get(templateId)

  // 3. Photo keys validation
  const rawPhotos = Array.isArray(input.photoKeys)
    ? input.photoKeys
    : Array.isArray(input.photos)
    ? input.photos
    : []
  if (rawPhotos.length === 0) {
    throw bad('At least one uploaded photo is required for the Lithophane Photo Lamp.')
  }
  if (rawPhotos.length > templateMeta.photoCount) {
    throw bad(`Template "${templateId}" supports at most ${templateMeta.photoCount} photo(s).`)
  }

  const cleanPhotoKeys = rawPhotos.map((p, idx) => {
    if (!p || typeof p !== 'object') throw bad(`Invalid photo at index ${idx}.`)
    const photoKey = String(p.photoKey || '').trim()
    if (!photoKey || !photoKey.startsWith('photo-lamp-photos/')) {
      throw bad(`Invalid or missing storage photoKey for photo slot ${idx}.`)
    }
    const sha256 = typeof p.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(p.sha256) ? p.sha256.toLowerCase() : null
    return {
      slotIndex: Number.isInteger(p.slotIndex) && p.slotIndex >= 0 ? p.slotIndex : idx,
      photoKey,
      sha256,
      width: Number.isInteger(p.width) && p.width > 0 ? p.width : undefined,
      height: Number.isInteger(p.height) && p.height > 0 ? p.height : undefined,
      crop: p.crop && typeof p.crop === 'object' ? {
        x: Math.round(Number(p.crop.x) || 0),
        y: Math.round(Number(p.crop.y) || 0),
        width: Math.round(Number(p.crop.width) || 0),
        height: Math.round(Number(p.crop.height) || 0),
      } : undefined,
      adjustments: p.adjustments && typeof p.adjustments === 'object' ? {
        brightness: Math.max(-100, Math.min(100, Math.round(Number(p.adjustments.brightness) || 0))),
        contrast: Math.max(-100, Math.min(100, Math.round(Number(p.adjustments.contrast) || 0))),
        gamma: Math.max(0.2, Math.min(3.0, Number(p.adjustments.gamma) || 1.0)),
        sharpness: Math.max(0, Math.min(100, Math.round(Number(p.adjustments.sharpness) || 0))),
        invert: Boolean(p.adjustments.invert),
      } : undefined,
    }
  })

  // 4. Design Configuration validation
  const cfg = input.designConfig && typeof input.designConfig === 'object' ? input.designConfig : {}
  const dims = cfg.dimensions && typeof cfg.dimensions === 'object' ? cfg.dimensions : {}

  const heightMm = Math.max(50, Math.min(300, Number(dims.heightMm) || templateMeta.defaultDimensions.heightMm || 120))
  const diameterMm = dims.diameterMm ? Math.max(40, Math.min(250, Number(dims.diameterMm))) : undefined
  const widthMm = dims.widthMm ? Math.max(40, Math.min(250, Number(dims.widthMm))) : undefined
  const depthMm = dims.depthMm ? Math.max(2, Math.min(100, Number(dims.depthMm))) : undefined
  const minThicknessMm = Math.max(0.6, Math.min(2.0, Number(dims.minThicknessMm) || 0.8))
  const maxThicknessMm = Math.max(minThicknessMm + 0.4, Math.min(5.0, Number(dims.maxThicknessMm) || 3.2))

  const cleanDimensions = {
    heightMm,
    minThicknessMm,
    maxThicknessMm,
    ...(diameterMm !== undefined ? { diameterMm } : {}),
    ...(widthMm !== undefined ? { widthMm } : {}),
    ...(depthMm !== undefined ? { depthMm } : {}),
    ...(dims.arcAngleDeg ? { arcAngleDeg: Math.max(30, Math.min(360, Number(dims.arcAngleDeg))) } : {}),
  }

  // Base options
  const baseCfg = cfg.base && typeof cfg.base === 'object' ? cfg.base : {}
  const baseType = VALID_BASE_TYPES.has(baseCfg.type) ? baseCfg.type : 'printed'
  const fitToleranceMm = Math.max(0.2, Math.min(1.2, Number(baseCfg.fitToleranceMm) || 0.4))
  const cleanBase = {
    type: baseType,
    fitToleranceMm,
    profile: typeof baseCfg.profile === 'string' ? baseCfg.profile.slice(0, 30) : 'default',
  }

  // Lighting options
  const lightingCfg = cfg.lighting && typeof cfg.lighting === 'object' ? cfg.lighting : {}
  const puckType = VALID_PUCK_TYPES.has(lightingCfg.puckType) ? lightingCfg.puckType : 'warm_white'
  const cleanLighting = { puckType }

  // Personalization options
  const persCfg = cfg.personalization && typeof cfg.personalization === 'object' ? cfg.personalization : {}
  const engravedText = typeof persCfg.engravedText === 'string' ? persCfg.engravedText.trim().slice(0, 100) : ''
  const font = typeof persCfg.font === 'string' ? persCfg.font.trim().slice(0, 50) : 'Cinzel'
  const cleanPersonalization = engravedText ? { engravedText, font } : {}

  // Packaging options
  const pkgCfg = cfg.packaging && typeof cfg.packaging === 'object' ? cfg.packaging : {}
  const cleanPackaging = {
    premiumGiftBox: Boolean(pkgCfg.premiumGiftBox),
  }

  const canonicalConfig = {
    dimensions: cleanDimensions,
    base: cleanBase,
    lighting: cleanLighting,
    ...(Object.keys(cleanPersonalization).length > 0 ? { personalization: cleanPersonalization } : {}),
    packaging: cleanPackaging,
  }

  // 5. Deterministic paramsHash
  const canonicalPayload = JSON.stringify({
    templateId,
    photos: cleanPhotoKeys.map((p) => ({ slot: p.slotIndex, key: p.photoKey, sha: p.sha256, crop: p.crop, adj: p.adjustments })),
    config: canonicalConfig,
  })
  const paramsHash = sha256Hex(canonicalPayload)

  return {
    title,
    templateId,
    photoKeys: cleanPhotoKeys,
    designConfig: canonicalConfig,
    paramsHash,
  }
}
