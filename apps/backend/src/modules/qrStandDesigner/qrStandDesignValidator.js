import crypto from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'
import {
  VALID_ERROR_CORRECTION,
  VALID_PRINT_MODES,
  VALID_QR_TYPES,
  VALID_TEMPLATE_IDS,
} from './qrStandDesignOptions.js'

function sortObject(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObject(obj[key])
      return acc
    }, {})
}

export function validateQrStandDesignInput(input) {
  if (!input || typeof input !== 'object') {
    throw new HttpError(400, 'Invalid request body.')
  }

  // Template validation
  const templateId = String(input.templateId || 'classic_upright').trim()
  if (!VALID_TEMPLATE_IDS.has(templateId)) {
    throw new HttpError(400, `Invalid QR Stand template ID: ${templateId}`)
  }

  // Print mode validation
  const printMode = String(input.printMode || 'raised').toLowerCase().trim()
  if (!VALID_PRINT_MODES.has(printMode)) {
    throw new HttpError(400, `Invalid print mode: ${printMode}`)
  }

  // QR Type validation
  const qrType = String(input.qrType || 'url').toLowerCase().trim()
  if (!VALID_QR_TYPES.has(qrType)) {
    throw new HttpError(400, `Invalid QR type: ${qrType}`)
  }

  // Error correction validation
  const errorCorrection = String(input.errorCorrection || 'M').toUpperCase().trim()
  if (!VALID_ERROR_CORRECTION.has(errorCorrection)) {
    throw new HttpError(400, `Invalid error correction level: ${errorCorrection}`)
  }

  // QR Payload validation
  const rawPayload = typeof input.qrPayload === 'string' ? input.qrPayload.trim() : ''
  if (!rawPayload) {
    throw new HttpError(400, 'QR payload cannot be empty.')
  }

  const payloadBytes = new TextEncoder().encode(rawPayload).length
  if (payloadBytes > 380) {
    throw new HttpError(
      400,
      `QR payload length (${payloadBytes} bytes) exceeds maximum supported Version 14 capacity.`
    )
  }

  // Type-specific payload format checks
  if (qrType === 'upi') {
    if (!rawPayload.startsWith('upi://pay?') || !rawPayload.includes('pa=')) {
      throw new HttpError(400, 'Invalid UPI payload format. Must be a valid upi://pay URI.')
    }
    const params = new URLSearchParams(rawPayload.slice(rawPayload.indexOf('?') + 1))
    const vpa = params.get('pa') || ''
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
      throw new HttpError(400, `Invalid UPI VPA address: ${vpa}`)
    }
  } else if (qrType === 'url') {
    if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(rawPayload)) {
      throw new HttpError(400, 'Invalid URL payload. Must be a valid http:// or https:// URL.')
    }
  }

  // Version validation (strictly 1 to 14)
  const qrVersion = input.qrVersion !== undefined ? Number(input.qrVersion) : 1
  if (!Number.isInteger(qrVersion) || qrVersion < 1 || qrVersion > 14) {
    throw new HttpError(400, `Invalid QR version ${qrVersion}. Must be between 1 and 14.`)
  }

  const cfg = input.designConfig && typeof input.designConfig === 'object' ? input.designConfig : {}

  // Logo safety validation
  const logoCfg = cfg.logo && typeof cfg.logo === 'object' ? cfg.logo : {}
  const logoEnabled = Boolean(logoCfg.enabled)
  let validatedLogo = { enabled: false }

  if (logoEnabled) {
    if (errorCorrection !== 'H') {
      throw new HttpError(
        400,
        'Center logo requires Error Correction Level H to guarantee scannability.'
      )
    }
    if (qrVersion < 3) {
      throw new HttpError(
        400,
        'Center logo requires at least QR Version 3 (29x29) to ensure sufficient data area.'
      )
    }
    const areaRatioPercent = Number(logoCfg.areaRatioPercent) || 0
    if (areaRatioPercent > 10.5) {
      throw new HttpError(
        400,
        `Logo area ratio (${areaRatioPercent.toFixed(1)}%) exceeds conservative 10% safety ceiling.`
      )
    }
    validatedLogo = {
      enabled: true,
      sizeMm: Math.max(8, Math.min(30, Number(logoCfg.sizeMm) || 16)),
      shape: ['square', 'circle', 'shield'].includes(logoCfg.shape) ? logoCfg.shape : 'circle',
      areaRatioPercent: Math.max(0, Math.min(10, areaRatioPercent)),
    }
  }

  // Dimensions validation
  const dim = cfg.dimensions && typeof cfg.dimensions === 'object' ? cfg.dimensions : {}
  const dimensions = {
    widthMm: Math.max(40, Math.min(250, Number(dim.widthMm) || 96)),
    heightMm: Math.max(40, Math.min(300, Number(dim.heightMm) || 126)),
    depthMm: Math.max(20, Math.min(120, Number(dim.depthMm) || 46)),
    baseThicknessMm: Math.max(3, Math.min(20, Number(dim.baseThicknessMm) || 8)),
    plateThicknessMm: Math.max(2, Math.min(12, Number(dim.plateThicknessMm) || 4.5)),
    cornerRadiusMm: Math.max(0, Math.min(30, Number(dim.cornerRadiusMm) || 8)),
    inclinationDeg: Math.max(0, Math.min(45, Number(dim.inclinationDeg) || 10)),
    qrReliefDepthMm: Math.max(0.6, Math.min(4.0, Number(dim.qrReliefDepthMm) || 1.2)),
    inlayClearanceMm: Math.max(0.05, Math.min(0.5, Number(dim.inlayClearanceMm) || 0.15)),
    frontAndRearLayout: Boolean(dim.frontAndRearLayout),
    wallMountHoles: Boolean(dim.wallMountHoles),
  }

  // Colors validation
  const colors = cfg.colors && typeof cfg.colors === 'object' ? cfg.colors : {}
  const safeHex = (val, fallback) =>
    typeof val === 'string' && /^#[0-9A-Fa-f]{6}$/.test(val) ? val.toUpperCase() : fallback

  const appearance = {
    baseColor: safeHex(colors.baseColor, '#1E293B'),
    plateColor: safeHex(colors.plateColor, '#FFFFFF'),
    qrDarkColor: safeHex(colors.qrDarkColor, '#0F172A'),
    qrLightColor: safeHex(colors.qrLightColor, '#FFFFFF'),
    accentColor: safeHex(colors.accentColor, '#F59E0B'),
    textColor: safeHex(colors.textColor, '#0F172A'),
  }

  // Text lines validation
  const texts = cfg.texts && typeof cfg.texts === 'object' ? cfg.texts : {}
  const textConfig = {
    headline: String(texts.headline || '').trim().slice(0, 50),
    subline: String(texts.subline || '').trim().slice(0, 50),
    fontId: String(texts.fontId || 'inter').toLowerCase().trim().slice(0, 30),
    fontSize: Math.max(8, Math.min(36, Number(texts.fontSize) || 14)),
  }

  const title = String(input.title || `${templateId.replace(/_/g, ' ')} Display`).trim().slice(0, 100)

  // Construct canonical object
  const canonical = {
    templateId,
    printMode,
    qrType,
    qrPayload: rawPayload,
    qrVersion,
    errorCorrection,
    dimensions,
    appearance,
    texts: textConfig,
    logo: validatedLogo,
  }

  const sorted = sortObject(canonical)
  const paramsHash = crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex')

  return {
    canonical,
    paramsHash,
    title,
    templateId,
    printMode,
    qrType,
    qrPayload: rawPayload,
    qrVersion,
    errorCorrection,
  }
}
