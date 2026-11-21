// Unified, robust design draft storage manager for Giftora 3D Customizers.
// Supports:
// 1. Name Keychain (isolated under 'giftora_draft_keychain_v1' + fallback to legacy 'giftora_custom_design_draft')
// 2. Nameplate (isolated under 'giftora_draft_nameplate_v1')
// Note: Stand is explicitly excluded and untouched per client instructions.

const STORAGE_KEYS = {
  keychain: 'giftora_draft_keychain_v1',
  legacy_keychain: 'giftora_custom_design_draft',
  nameplate: 'giftora_draft_nameplate_v1',
}

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days draft persistence
const VERSION = 1

/**
 * Persists a draft payload for a specific product.
 */
export function saveProductDraft(productType, data) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  const key = STORAGE_KEYS[productType]
  if (!key) return false

  try {
    const envelope = {
      v: VERSION,
      productType,
      savedAt: Date.now(),
      data,
    }
    window.localStorage.setItem(key, JSON.stringify(envelope))

    // For keychain, also write to legacy key for backward compatibility with older code
    if (productType === 'keychain') {
      try {
        window.localStorage.setItem(
          STORAGE_KEYS.legacy_keychain,
          JSON.stringify({ v: VERSION, savedAt: Date.now(), choices: data })
        )
      } catch {
        // ignore legacy key quota
      }
    }
    return true
  } catch {
    return false
  }
}

/**
 * Loads the draft envelope for a specific product.
 * Returns { data, savedAt } or null if absent/expired/invalid.
 */
export function loadProductDraft(productType) {
  if (typeof window === 'undefined' || !window.localStorage) return null
  const key = STORAGE_KEYS[productType]
  if (!key) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.v === VERSION &&
        typeof parsed.savedAt === 'number' &&
        Date.now() - parsed.savedAt <= MAX_AGE_MS &&
        parsed.data &&
        typeof parsed.data === 'object'
      ) {
        return { data: parsed.data, savedAt: parsed.savedAt }
      }
    }

    // Fallback for keychain to legacy key
    if (productType === 'keychain') {
      const legacyRaw = window.localStorage.getItem(STORAGE_KEYS.legacy_keychain)
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw)
        if (
          legacyParsed &&
          typeof legacyParsed === 'object' &&
          typeof legacyParsed.savedAt === 'number' &&
          Date.now() - legacyParsed.savedAt <= MAX_AGE_MS &&
          legacyParsed.choices &&
          typeof legacyParsed.choices === 'object'
        ) {
          return { data: legacyParsed.choices, savedAt: legacyParsed.savedAt }
        }
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Deletes a draft for a specific product.
 */
export function deleteProductDraft(productType) {
  if (typeof window === 'undefined' || !window.localStorage) return
  const key = STORAGE_KEYS[productType]
  if (key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
  if (productType === 'keychain') {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.legacy_keychain)
    } catch {
      // ignore
    }
  }
}

/**
 * Validates and safely sanitizes a Keychain draft against available options.
 */
export function sanitizeKeychainDraft(draftData, options) {
  if (!draftData || !options) return null
  const template = options.templates?.find((t) => t.id === draftData.templateId) || options.templates?.[0]
  if (!template) return null

  const isString = (v) => typeof v === 'string'
  const restored = {
    templateId: template.id,
  }

  if (template.styles?.includes(draftData.styleId)) {
    restored.styleId = draftData.styleId
  } else if (template.styles?.[0]) {
    restored.styleId = template.styles[0]
  }

  if (template.materials?.includes(draftData.material)) {
    restored.material = draftData.material
  }
  if (template.sizes?.includes(draftData.size)) {
    restored.size = draftData.size
  }
  if (template.supportsKeyring && options.keyringPositions?.includes(draftData.keyringPosition)) {
    restored.keyringPosition = draftData.keyringPosition
  }

  const maxLength = options.maxTextLength || 20
  if (isString(draftData.text) && [...draftData.text].length <= maxLength) {
    restored.text = draftData.text
  }
  if (isString(draftData.subtitle) && [...draftData.subtitle].length <= maxLength) {
    restored.subtitle = draftData.subtitle
  }
  if (options.fonts?.some((f) => f.id === draftData.fontId)) {
    restored.fontId = draftData.fontId
  }
  if (options.thicknesses?.some((t) => t.id === draftData.thickness)) {
    restored.thickness = draftData.thickness
  }
  if (Number.isInteger(draftData.quantity) && draftData.quantity >= 1 && draftData.quantity <= 10) {
    restored.quantity = draftData.quantity
  }
  if (typeof draftData.allowDisconnected === 'boolean') {
    restored.allowDisconnected = draftData.allowDisconnected
  }
  if (draftData.color && isString(draftData.color.hex)) {
    restored.color = { hex: draftData.color.hex }
  }
  if (draftData.textColor && isString(draftData.textColor.hex)) {
    restored.textColor = { hex: draftData.textColor.hex }
  }

  return restored
}

/**
 * Validates and safely sanitizes a Nameplate draft against valid bounds and schema.
 */
export function sanitizeNameplateDraft(draftData, defaultFallback) {
  if (!draftData || typeof draftData !== 'object') return null
  const fallback = defaultFallback || {}

  const isString = (v) => typeof v === 'string' && v.trim().length > 0
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

  const sanitized = {
    id: isString(draftData.id) ? draftData.id : fallback.id || `nameplate-${Date.now()}`,
    name: isString(draftData.name) ? draftData.name : (fallback.name || 'Custom Nameplate'),
    type: isString(draftData.type) ? draftData.type : (fallback.type || 'desk'),
    shape: isString(draftData.shape) ? draftData.shape : (fallback.shape || 'rounded-rectangle'),
    mountingStyle: isString(draftData.mountingStyle) ? draftData.mountingStyle : (fallback.mountingStyle || 'freestanding-desk'),
    letteringMode: isString(draftData.letteringMode) ? draftData.letteringMode : (fallback.letteringMode || 'raised'),
    materialFinish: isString(draftData.materialFinish) ? draftData.materialFinish : (fallback.materialFinish || 'metallic-pla'),
    decoration: isString(draftData.decoration) ? draftData.decoration : (fallback.decoration || 'none'),
    theme: isString(draftData.theme) ? draftData.theme : (fallback.theme || 'Minimalist'),

    // Numeric dimensions with sanity bounds
    widthMm: isNum(draftData.widthMm) ? Math.min(300, Math.max(60, draftData.widthMm)) : (fallback.widthMm || 180),
    heightMm: isNum(draftData.heightMm) ? Math.min(200, Math.max(30, draftData.heightMm)) : (fallback.heightMm || 50),
    baseThicknessMm: isNum(draftData.baseThicknessMm) ? Math.min(20, Math.max(1, draftData.baseThicknessMm)) : (fallback.baseThicknessMm || 4),
    cornerRadiusMm: isNum(draftData.cornerRadiusMm) ? Math.min(30, Math.max(0, draftData.cornerRadiusMm)) : (fallback.cornerRadiusMm || 8),
    textExtrusionMm: isNum(draftData.textExtrusionMm) ? Math.min(15, Math.max(0.5, draftData.textExtrusionMm)) : (fallback.textExtrusionMm || 2.5),
    engravingDepthMm: isNum(draftData.engravingDepthMm) ? Math.min(10, Math.max(0.2, draftData.engravingDepthMm)) : (fallback.engravingDepthMm || 1.2),
    borderEnabled: typeof draftData.borderEnabled === 'boolean' ? draftData.borderEnabled : (fallback.borderEnabled ?? true),
    borderThicknessMm: isNum(draftData.borderThicknessMm) ? Math.min(15, Math.max(1, draftData.borderThicknessMm)) : (fallback.borderThicknessMm || 3),
    borderWidthMm: isNum(draftData.borderWidthMm) ? Math.min(20, Math.max(1, draftData.borderWidthMm)) : (fallback.borderWidthMm || 3),
    borderHeightMm: isNum(draftData.borderHeightMm) ? Math.min(15, Math.max(0.5, draftData.borderHeightMm)) : (fallback.borderHeightMm || 2),
    textClearanceMm: isNum(draftData.textClearanceMm) ? Math.min(20, Math.max(0, draftData.textClearanceMm)) : (fallback.textClearanceMm || 4),
    layerChangeHeightMm: isNum(draftData.layerChangeHeightMm) ? draftData.layerChangeHeightMm : (fallback.layerChangeHeightMm || 3.2),

    // Mounting engineering
    mountingHolesEnabled: typeof draftData.mountingHolesEnabled === 'boolean' ? draftData.mountingHolesEnabled : (fallback.mountingHolesEnabled ?? false),
    mountingHoleDiameterMm: isNum(draftData.mountingHoleDiameterMm) ? draftData.mountingHoleDiameterMm : (fallback.mountingHoleDiameterMm || 4.5),
    mountingHoleInsetMm: isNum(draftData.mountingHoleInsetMm) ? draftData.mountingHoleInsetMm : (fallback.mountingHoleInsetMm || 10),
    keyholeSlotEnabled: typeof draftData.keyholeSlotEnabled === 'boolean' ? draftData.keyholeSlotEnabled : (fallback.keyholeSlotEnabled ?? false),
    deskStandAngleDeg: isNum(draftData.deskStandAngleDeg) ? Math.min(60, Math.max(5, draftData.deskStandAngleDeg)) : (fallback.deskStandAngleDeg || 18),
    deskStandSupportRibs: typeof draftData.deskStandSupportRibs === 'boolean' ? draftData.deskStandSupportRibs : (fallback.deskStandSupportRibs ?? true),

    // Colors
    baseColor: isString(draftData.baseColor) ? draftData.baseColor : (fallback.baseColor || '#0D0D0D'),
    secondaryBaseColor: isString(draftData.secondaryBaseColor) ? draftData.secondaryBaseColor : (fallback.secondaryBaseColor || '#1A1A1A'),
    borderColor: isString(draftData.borderColor) ? draftData.borderColor : (fallback.borderColor || '#D9AE4E'),
    ledAccentColor: isString(draftData.ledAccentColor) ? draftData.ledAccentColor : (fallback.ledAccentColor || '#00E5FF'),
    ledGlowEnabled: typeof draftData.ledGlowEnabled === 'boolean' ? draftData.ledGlowEnabled : (fallback.ledGlowEnabled ?? false),
    gradientPreviewEnabled: typeof draftData.gradientPreviewEnabled === 'boolean' ? draftData.gradientPreviewEnabled : (fallback.gradientPreviewEnabled ?? false),

    // Text lines
    lines: Array.isArray(draftData.lines) && draftData.lines.length > 0
      ? draftData.lines.map((l, idx) => ({
          id: isString(l.id) ? l.id : `line-${idx + 1}`,
          text: typeof l.text === 'string' ? l.text.slice(0, 40) : (fallback.lines?.[idx]?.text || 'NAME'),
          fontId: isString(l.fontId) ? l.fontId : (fallback.lines?.[idx]?.fontId || 'outfit'),
          fontSize: isNum(l.fontSize) ? Math.min(50, Math.max(6, l.fontSize)) : (fallback.lines?.[idx]?.fontSize || 16),
          letterSpacing: isNum(l.letterSpacing) ? Math.min(10, Math.max(-2, l.letterSpacing)) : (fallback.lines?.[idx]?.letterSpacing || 0.5),
          align: ['center', 'left', 'right'].includes(l.align) ? l.align : (fallback.lines?.[idx]?.align || 'center'),
          bold: typeof l.bold === 'boolean' ? l.bold : Boolean(fallback.lines?.[idx]?.bold),
          italic: typeof l.italic === 'boolean' ? l.italic : Boolean(fallback.lines?.[idx]?.italic),
          textTransform: isString(l.textTransform) ? l.textTransform : (fallback.lines?.[idx]?.textTransform || 'uppercase'),
          color: isString(l.color) ? l.color : (fallback.lines?.[idx]?.color || '#D9AE4E'),
          yOffset: isNum(l.yOffset) ? Math.min(50, Math.max(-50, l.yOffset)) : (fallback.lines?.[idx]?.yOffset || 0),
        }))
      : (fallback.lines || []),
  }

  return sanitized
}
