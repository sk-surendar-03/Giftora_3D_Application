// Unified, robust design draft storage manager for Giftora 3D Customizers.
// Supports:
// 1. Name Keychain (isolated under 'giftora_draft_keychain_v1' + fallback to legacy 'giftora_custom_design_draft')
// 2. Nameplate (isolated under 'giftora_draft_nameplate_v1')
// Note: Stand is explicitly excluded and untouched per client instructions.

const STORAGE_KEYS = {
  keychain: 'giftora_draft_keychain_v1',
  legacy_keychain: 'giftora_custom_design_draft',
  nameplate: 'giftora_draft_nameplate_v1',
  qrstand: 'giftora_draft_qrstand_v1',
  photolamp: 'giftora_draft_photolamp_v1',
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

const VALID_TEMPLATES = [
  'classic_upright',
  'angled_desk',
  'rounded_rect',
  'arch_shaped',
  'circular_display',
  'square_block',
  'double_sided',
  'triple_display',
  'restaurant_tent',
  'social_media',
  'business_plaque',
  'mini_keychain',
]

const VALID_QR_TYPES = [
  'url',
  'upi',
  'google_review',
  'instagram',
  'whatsapp',
  'facebook',
  'youtube',
  'wifi',
  'vcard',
  'menu',
  'email',
  'phone',
  'text',
]

/**
 * Validates and safely sanitizes a QR Stand draft against valid bounds and schema.
 */
export function sanitizeQrStandDraft(draftData, defaultFallback) {
  if (!draftData || typeof draftData !== 'object') return null
  const fallback = defaultFallback || {}

  const isString = (v) => typeof v === 'string' && v.trim().length > 0
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

  const templateId = VALID_TEMPLATES.includes(draftData.templateId)
    ? draftData.templateId
    : fallback.templateId || 'classic_upright'

  const printingMode = ['raised', 'recessed', 'inlay'].includes(draftData.printingMode)
    ? draftData.printingMode
    : fallback.printingMode || 'raised'

  const dims = draftData.dimensions && typeof draftData.dimensions === 'object' ? draftData.dimensions : {}
  const fbDims = fallback.dimensions || {}

  const dimensions = {
    widthMm: isNum(dims.widthMm) ? Math.min(250, Math.max(50, dims.widthMm)) : fbDims.widthMm || 100,
    heightMm: isNum(dims.heightMm) ? Math.min(250, Math.max(50, dims.heightMm)) : fbDims.heightMm || 140,
    depthMm: isNum(dims.depthMm) ? Math.min(100, Math.max(10, dims.depthMm)) : fbDims.depthMm || 60,
    baseThicknessMm: isNum(dims.baseThicknessMm) ? Math.min(30, Math.max(2, dims.baseThicknessMm)) : fbDims.baseThicknessMm || 8,
    plateThicknessMm: isNum(dims.plateThicknessMm) ? Math.min(20, Math.max(2, dims.plateThicknessMm)) : fbDims.plateThicknessMm || 4,
    cornerRadiusMm: isNum(dims.cornerRadiusMm) ? Math.min(40, Math.max(0, dims.cornerRadiusMm)) : fbDims.cornerRadiusMm || 10,
    inclinationDeg: isNum(dims.inclinationDeg) ? Math.min(45, Math.max(0, dims.inclinationDeg)) : fbDims.inclinationDeg || 15,
    baseWidthMm: isNum(dims.baseWidthMm) ? Math.min(300, Math.max(50, dims.baseWidthMm)) : fbDims.baseWidthMm || 110,
    baseDepthMm: isNum(dims.baseDepthMm) ? Math.min(150, Math.max(30, dims.baseDepthMm)) : fbDims.baseDepthMm || 65,
    borderThicknessMm: isNum(dims.borderThicknessMm) ? Math.min(20, Math.max(0, dims.borderThicknessMm)) : fbDims.borderThicknessMm || 3,
    frameDepthMm: isNum(dims.frameDepthMm) ? Math.min(15, Math.max(0, dims.frameDepthMm)) : fbDims.frameDepthMm || 2,
    roundedEdges: typeof dims.roundedEdges === 'boolean' ? dims.roundedEdges : fbDims.roundedEdges ?? true,
    frontAndRearLayout: typeof dims.frontAndRearLayout === 'boolean' ? dims.frontAndRearLayout : fbDims.frontAndRearLayout ?? false,
    wallMountHoles: typeof dims.wallMountHoles === 'boolean' ? dims.wallMountHoles : fbDims.wallMountHoles ?? false,
    qrReliefDepthMm: isNum(dims.qrReliefDepthMm) ? Math.min(5, Math.max(0.4, dims.qrReliefDepthMm)) : fbDims.qrReliefDepthMm || 1.6,
    inlayClearanceMm: isNum(dims.inlayClearanceMm) ? Math.min(1, Math.max(0.05, dims.inlayClearanceMm)) : fbDims.inlayClearanceMm || 0.2,
  }

  const qrCodes = Array.isArray(draftData.qrCodes) && draftData.qrCodes.length > 0
    ? draftData.qrCodes.map((qr, idx) => {
        const fbQr = fallback.qrCodes?.[idx] || fallback.qrCodes?.[0] || {}
        return {
          id: isString(qr.id) ? qr.id : fbQr.id || `qr-${idx + 1}`,
          label: typeof qr.label === 'string' ? qr.label.slice(0, 50) : fbQr.label || 'Primary QR',
          type: VALID_QR_TYPES.includes(qr.type) ? qr.type : fbQr.type || 'url',
          fields: qr.fields && typeof qr.fields === 'object' ? { ...qr.fields } : fbQr.fields || { url: 'https://giftora.in' },
          sizeMm: isNum(qr.sizeMm) ? Math.min(200, Math.max(25, qr.sizeMm)) : fbQr.sizeMm || 65,
          errorCorrection: ['L', 'M', 'Q', 'H'].includes(qr.errorCorrection) ? qr.errorCorrection : fbQr.errorCorrection || 'H',
          quietZone: isNum(qr.quietZone) ? Math.min(8, Math.max(1, qr.quietZone)) : fbQr.quietZone || 4,
          fgColor: isString(qr.fgColor) ? qr.fgColor : fbQr.fgColor || '#111827',
          bgColor: isString(qr.bgColor) ? qr.bgColor : fbQr.bgColor || '#FFFFFF',
          positionX: isNum(qr.positionX) ? qr.positionX : fbQr.positionX || 0,
          positionY: isNum(qr.positionY) ? qr.positionY : fbQr.positionY || 10,
          face: ['front', 'back', 'left', 'right'].includes(qr.face) ? qr.face : fbQr.face || 'front',
          visible: typeof qr.visible === 'boolean' ? qr.visible : fbQr.visible ?? true,
        }
      })
    : fallback.qrCodes || []

  const texts = Array.isArray(draftData.texts)
    ? draftData.texts.map((t, idx) => {
        const fbT = fallback.texts?.[idx] || {}
        return {
          id: isString(t.id) ? t.id : fbT.id || `text-${idx + 1}`,
          content: typeof t.content === 'string' ? t.content.slice(0, 60) : fbT.content || '',
          presetRole: t.presetRole || fbT.presetRole || 'business_name',
          category: t.category || fbT.category || 'Modern',
          fontSizeMm: isNum(t.fontSizeMm) ? Math.min(30, Math.max(3, t.fontSizeMm)) : fbT.fontSizeMm || 8,
          letterSpacing: isNum(t.letterSpacing) ? Math.min(5, Math.max(-1, t.letterSpacing)) : fbT.letterSpacing || 0.5,
          align: ['left', 'center', 'right'].includes(t.align) ? t.align : fbT.align || 'center',
          xMm: isNum(t.xMm) ? t.xMm : fbT.xMm || 0,
          yMm: isNum(t.yMm) ? t.yMm : fbT.yMm || -40,
          rotationDeg: isNum(t.rotationDeg) ? t.rotationDeg : fbT.rotationDeg || 0,
          color: isString(t.color) ? t.color : fbT.color || '#D9AE4E',
          mode: ['raised', 'engraved'].includes(t.mode) ? t.mode : fbT.mode || 'raised',
          depthMm: isNum(t.depthMm) ? Math.min(5, Math.max(0.4, t.depthMm)) : fbT.depthMm || 1.2,
          face: ['front', 'back'].includes(t.face) ? t.face : fbT.face || 'front',
          visible: typeof t.visible === 'boolean' ? t.visible : fbT.visible ?? true,
        }
      })
    : fallback.texts || []

  const logoData = draftData.logo && typeof draftData.logo === 'object' ? draftData.logo : {}
  const fbLogo = fallback.logo || {}
  const logo = {
    enabled: typeof logoData.enabled === 'boolean' ? logoData.enabled : fbLogo.enabled ?? false,
    dataUrl: typeof logoData.dataUrl === 'string' && logoData.dataUrl.startsWith('data:') ? logoData.dataUrl : null,
    fileName: typeof logoData.fileName === 'string' ? logoData.fileName.slice(0, 100) : null,
    isSvg: typeof logoData.isSvg === 'boolean' ? logoData.isSvg : false,
    svgText: typeof logoData.svgText === 'string' ? logoData.svgText.slice(0, 50000) : null,
    placement: ['center', 'above', 'below', 'custom'].includes(logoData.placement) ? logoData.placement : fbLogo.placement || 'center',
    sizeMm: isNum(logoData.sizeMm) ? Math.min(30, Math.max(5, logoData.sizeMm)) : fbLogo.sizeMm || 14,
    xMm: isNum(logoData.xMm) ? logoData.xMm : fbLogo.xMm || 0,
    yMm: isNum(logoData.yMm) ? logoData.yMm : fbLogo.yMm || 0,
    frameStyle: ['none', 'circle', 'rounded', 'badge'].includes(logoData.frameStyle) ? logoData.frameStyle : fbLogo.frameStyle || 'rounded',
    frameColor: isString(logoData.frameColor) ? logoData.frameColor : fbLogo.frameColor || '#D9AE4E',
    backingColor: isString(logoData.backingColor) ? logoData.backingColor : fbLogo.backingColor || '#FFFFFF',
    mode: ['raised', 'engraved', 'preview'].includes(logoData.mode) ? logoData.mode : fbLogo.mode || 'raised',
    depthMm: isNum(logoData.depthMm) ? Math.min(5, Math.max(0.4, logoData.depthMm)) : fbLogo.depthMm || 1.2,
  }

  const clrs = draftData.colors && typeof draftData.colors === 'object' ? draftData.colors : {}
  const fbClrs = fallback.colors || {}
  const colors = {
    presetId: isString(clrs.presetId) ? clrs.presetId : fbClrs.presetId || 'default',
    standColor: isString(clrs.standColor) ? clrs.standColor : fbClrs.standColor || '#0F172A',
    baseColor: isString(clrs.baseColor) ? clrs.baseColor : fbClrs.baseColor || '#1E293B',
    frameColor: isString(clrs.frameColor) ? clrs.frameColor : fbClrs.frameColor || '#D9AE4E',
    qrColor: isString(clrs.qrColor) ? clrs.qrColor : fbClrs.qrColor || '#FFFFFF',
    textColor: isString(clrs.textColor) ? clrs.textColor : fbClrs.textColor || '#D9AE4E',
    accentColor: isString(clrs.accentColor) ? clrs.accentColor : fbClrs.accentColor || '#38BDF8',
    materialType: ['pla', 'petg', 'matte', 'metallic', 'silk'].includes(clrs.materialType) ? clrs.materialType : fbClrs.materialType || 'pla',
    rainbowPreview: typeof clrs.rainbowPreview === 'boolean' ? clrs.rainbowPreview : fbClrs.rainbowPreview ?? false,
  }

  const vis = draftData.visibility && typeof draftData.visibility === 'object' ? draftData.visibility : {}
  const fbVis = fallback.visibility || {}
  const visibility = {
    base: typeof vis.base === 'boolean' ? vis.base : fbVis.base ?? true,
    body: typeof vis.body === 'boolean' ? vis.body : fbVis.body ?? true,
    frame: typeof vis.frame === 'boolean' ? vis.frame : fbVis.frame ?? true,
    qr: typeof vis.qr === 'boolean' ? vis.qr : fbVis.qr ?? true,
    text: typeof vis.text === 'boolean' ? vis.text : fbVis.text ?? true,
    logo: typeof vis.logo === 'boolean' ? vis.logo : fbVis.logo ?? true,
    decorations: typeof vis.decorations === 'boolean' ? vis.decorations : fbVis.decorations ?? true,
  }

  return {
    id: isString(draftData.id) ? draftData.id : fallback.id || `qr-stand-${Date.now()}`,
    name: isString(draftData.name) ? draftData.name : fallback.name || 'Custom QR Stand',
    templateId,
    presetId: draftData.presetId || fallback.presetId,
    dimensions,
    printingMode,
    qrCodes,
    texts,
    logo,
    decorations: Array.isArray(draftData.decorations) ? draftData.decorations : (fallback.decorations || []),
    colors,
    visibility,
    updatedAt: isNum(draftData.updatedAt) ? draftData.updatedAt : Date.now(),
  }
}

const VALID_LAMP_SHAPES = [
  'cylinder',
  'rectangle',
  'four_sided',
  'prism_4',
  'heart',
  'curved',
  'moon',
  'hexagonal',
  'lantern_6',
  'circular',
  'medallion',
  'rotating',
  'carousel_3',
]

/**
 * Validates and safely sanitizes a Photo Lamp draft.
 * Strips oversized base64 images to prevent quota exhaustion.
 */
export function sanitizePhotoLampDraft(draftData, defaultFallback) {
  if (!draftData || typeof draftData !== 'object') return null
  const fallback = defaultFallback || {}
  const isString = (v) => typeof v === 'string' && v.trim().length > 0
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

  const shape = VALID_LAMP_SHAPES.includes(draftData.shape)
    ? draftData.shape
    : fallback.shape || 'cylinder'

  const ps = draftData.printSettings && typeof draftData.printSettings === 'object' ? draftData.printSettings : {}
  const fbPs = fallback.printSettings || {}
  const printSettings = {
    modelHeightMm: isNum(ps.modelHeightMm) ? Math.min(220, Math.max(60, ps.modelHeightMm)) : fbPs.modelHeightMm || 120,
    modelWidthMm: isNum(ps.modelWidthMm) ? Math.min(200, Math.max(50, ps.modelWidthMm)) : fbPs.modelWidthMm || 90,
    modelDiameterMm: isNum(ps.modelDiameterMm) ? Math.min(200, Math.max(50, ps.modelDiameterMm)) : fbPs.modelDiameterMm || 90,
    minThicknessMm: isNum(ps.minThicknessMm) ? Math.min(2.0, Math.max(0.6, ps.minThicknessMm)) : fbPs.minThicknessMm || 0.8,
    maxThicknessMm: isNum(ps.maxThicknessMm) ? Math.min(5.0, Math.max(2.0, ps.maxThicknessMm)) : fbPs.maxThicknessMm || 3.2,
    borderWidthMm: isNum(ps.borderWidthMm) ? Math.min(10, Math.max(1, ps.borderWidthMm)) : fbPs.borderWidthMm || 3.0,
    frameThicknessMm: isNum(ps.frameThicknessMm) ? Math.min(10, Math.max(1, ps.frameThicknessMm)) : fbPs.frameThicknessMm || 4.0,
    curveAngleDeg: isNum(ps.curveAngleDeg) ? Math.min(180, Math.max(45, ps.curveAngleDeg)) : fbPs.curveAngleDeg || 110,
    samplingResolution: ['low', 'medium', 'high', 'ultra'].includes(ps.samplingResolution) ? ps.samplingResolution : fbPs.samplingResolution || 'medium',
    seamPosition: ['auto', 'back', 'corner'].includes(ps.seamPosition) ? ps.seamPosition : fbPs.seamPosition || 'auto',
    smoothingRadius: isNum(ps.smoothingRadius) ? Math.min(5, Math.max(0, ps.smoothingRadius)) : fbPs.smoothingRadius || 1,
  }

  const bs = draftData.baseSettings && typeof draftData.baseSettings === 'object' ? draftData.baseSettings : {}
  const fbBs = fallback.baseSettings || {}
  const baseSettings = {
    enabled: typeof bs.enabled === 'boolean' ? bs.enabled : fbBs.enabled ?? true,
    shape: isString(bs.shape) ? bs.shape : fbBs.shape || 'circular',
    diameterMm: isNum(bs.diameterMm) ? Math.min(250, Math.max(60, bs.diameterMm)) : fbBs.diameterMm || 96,
    heightMm: isNum(bs.heightMm) ? Math.min(60, Math.max(10, bs.heightMm)) : fbBs.heightMm || 24,
    cavityDiameterMm: isNum(bs.cavityDiameterMm) ? Math.min(80, Math.max(30, bs.cavityDiameterMm)) : fbBs.cavityDiameterMm || 45,
    cavityDepthMm: isNum(bs.cavityDepthMm) ? Math.min(40, Math.max(5, bs.cavityDepthMm)) : fbBs.cavityDepthMm || 16,
    cableSlotWidthMm: isNum(bs.cableSlotWidthMm) ? Math.min(15, Math.max(2, bs.cableSlotWidthMm)) : fbBs.cableSlotWidthMm || 5.0,
    slotToleranceMm: isNum(bs.slotToleranceMm) ? Math.min(2, Math.max(0.1, bs.slotToleranceMm)) : fbBs.slotToleranceMm || 0.4,
    engravedText: typeof bs.engravedText === 'string' ? bs.engravedText.slice(0, 60) : fbBs.engravedText || '',
    engraveDepthMm: isNum(bs.engraveDepthMm) ? Math.min(3, Math.max(0.2, bs.engraveDepthMm)) : fbBs.engraveDepthMm || 0.8,
    separateLid: typeof bs.separateLid === 'boolean' ? bs.separateLid : fbBs.separateLid ?? true,
    surfacePattern: isString(bs.surfacePattern) ? bs.surfacePattern : fbBs.surfacePattern || 'smooth',
  }

  const lgt = draftData.lighting && typeof draftData.lighting === 'object' ? draftData.lighting : {}
  const fbLgt = fallback.lighting || {}
  const lighting = {
    isOn: typeof lgt.isOn === 'boolean' ? lgt.isOn : fbLgt.isOn ?? true,
    colorPreset: ['warm', 'cool', 'amber', 'rgb'].includes(lgt.colorPreset) ? lgt.colorPreset : fbLgt.colorPreset || 'warm',
    customColor: isString(lgt.customColor) ? lgt.customColor : fbLgt.customColor || '#ffbb66',
    brightness: isNum(lgt.brightness) ? Math.min(100, Math.max(10, lgt.brightness)) : fbLgt.brightness || 85,
    rgbCycle: typeof lgt.rgbCycle === 'boolean' ? lgt.rgbCycle : fbLgt.rgbCycle ?? false,
    ambientDarkness: isNum(lgt.ambientDarkness) ? Math.min(100, Math.max(0, lgt.ambientDarkness)) : fbLgt.ambientDarkness || 70,
  }

  const pers = draftData.personalization && typeof draftData.personalization === 'object' ? draftData.personalization : {}
  const fbPers = fallback.personalization || {}
  const personalization = {
    theme: isString(pers.theme) ? pers.theme : fbPers.theme || 'romantic',
    titleText: typeof pers.titleText === 'string' ? pers.titleText.slice(0, 60) : fbPers.titleText || '',
    subtitleText: typeof pers.subtitleText === 'string' ? pers.subtitleText.slice(0, 60) : fbPers.subtitleText || '',
    dateText: typeof pers.dateText === 'string' ? pers.dateText.slice(0, 30) : fbPers.dateText || '',
    fontFamily: isString(pers.fontFamily) ? pers.fontFamily : fbPers.fontFamily || 'serif',
    textStyle: isString(pers.textStyle) ? pers.textStyle : fbPers.textStyle || 'engraved',
    placement: isString(pers.placement) ? pers.placement : fbPers.placement || 'base',
    decorativeIcon: isString(pers.decorativeIcon) ? pers.decorativeIcon : fbPers.decorativeIcon || 'heart',
  }

  return {
    id: isString(draftData.id) ? draftData.id : fallback.id || `giftora-lamp-${Date.now()}`,
    name: isString(draftData.name) ? draftData.name : fallback.name || 'Custom 3D Photo Lamp',
    shape,
    printSettings,
    baseSettings,
    lighting,
    personalization,
    photos: fallback.photos || [],
    activePhotoIndex: isNum(draftData.activePhotoIndex) ? draftData.activePhotoIndex : 0,
    updatedAt: isNum(draftData.updatedAt) ? draftData.updatedAt : Date.now(),
  }
}
