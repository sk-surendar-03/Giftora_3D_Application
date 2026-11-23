import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getStorage } from '../storage/storage.js'
import {
  sha256Hex,
  validateBinaryStl,
  validatePng,
  computeSignedVolumeCm3,
} from '../customizer/stlValidator.js'
import { exportThreeMfFromStl } from '../customizer/threeMfExporter.js'
import {
  QR_STAND_SCHEMA_VERSION,
  priceForQrStand,
} from './qrStandDesignOptions.js'
import { validateQrStandDesignInput } from './qrStandDesignValidator.js'

export function toPublicQrStandDesign(design, { admin = false } = {}) {
  if (!design) return null
  const result = {
    id: design.id,
    title: design.title,
    templateId: design.templateId,
    printMode: design.printMode,
    qrType: design.qrType,
    qrPayload: design.qrPayload,
    qrVersion: design.qrVersion,
    errorCorrection: design.errorCorrection,
    status: design.status,
    designConfig: design.designConfig,
    unitPriceCents: design.unitPriceCents,
    hasPreview: Boolean(design.previewKey),
    hasStl: design.status === 'READY' && Boolean(design.stlKey),
    createdAt: design.createdAt,
  }
  if (admin) {
    result.schemaVersion = design.schemaVersion
    result.solidVolumeCm3 = design.solidVolumeCm3
    result.stl = design.stlKey
      ? {
          sizeBytes: design.stlSizeBytes,
          sha256: design.stlSha256,
          triangleCount: design.triangleCount,
          bboxMm: design.bboxMm,
        }
      : null
  }
  return result
}

export { toPublicQrStandDesign as toPublicDesign }

export async function findOwnedQrStandDesign(userId, designId) {
  const design = await prisma.qrStandDesign.findUnique({ where: { id: designId } })
  if (!design || design.userId !== userId) {
    throw new HttpError(404, 'QR Stand design not found.')
  }
  return design
}

export const getOwnedQrStandDesign = findOwnedQrStandDesign

export async function createQrStandDesign(userId, input) {
  const {
    canonical,
    paramsHash,
    title,
    templateId,
    printMode,
    qrType,
    qrPayload,
    qrVersion,
    errorCorrection,
  } = validateQrStandDesignInput(input)

  const existing = await prisma.qrStandDesign.findUnique({
    where: { userId_paramsHash: { userId, paramsHash } },
  })
  if (existing) return { design: existing, created: false }

  const unitPriceCents = 0 // Evaluated authoritatively on server after STL volumetric validation

  try {
    const design = await prisma.qrStandDesign.create({
      data: {
        userId,
        schemaVersion: QR_STAND_SCHEMA_VERSION,
        title,
        templateId,
        printMode,
        qrType,
        qrPayload,
        qrVersion,
        errorCorrection,
        designConfig: canonical,
        paramsHash,
        unitPriceCents,
      },
    })
    return { design, created: true }
  } catch (err) {
    if (err.code === 'P2002') {
      const raced = await prisma.qrStandDesign.findUnique({
        where: { userId_paramsHash: { userId, paramsHash } },
      })
      if (raced) return { design: raced, created: false }
    }
    throw err
  }
}

export async function storeStl(userId, designId, buffer, claimedSha256) {
  const design = await findOwnedQrStandDesign(userId, designId)

  if (design.status === 'READY') {
    if (Buffer.isBuffer(buffer) && sha256Hex(buffer) === design.stlSha256) {
      return design
    }
    throw new HttpError(409, 'This QR Stand design already has its printable STL file.')
  }

  const meta = validateBinaryStl(buffer)
  const sha256 = sha256Hex(buffer)
  if (claimedSha256 && claimedSha256.toLowerCase() !== sha256) {
    throw new HttpError(400, 'The uploaded file does not match its checksum.')
  }

  const key = `qr-stand-designs/${userId}/${designId}/${sha256}.stl`
  await getStorage().put(key, buffer, { immutable: true })

  const solidVolumeCm3 = computeSignedVolumeCm3(buffer)
  if (!(solidVolumeCm3 >= 1) || solidVolumeCm3 > 5000) {
    throw new HttpError(
      400,
      'The model volume could not be measured reliably. Please regenerate the QR Stand and try again.'
    )
  }

  // Load pricing config from settings or defaults
  let pricingConfig = null
  try {
    const { getQrStandPricingConfig } = await import('../settings/settingsService.js')
    if (typeof getQrStandPricingConfig === 'function') {
      pricingConfig = await getQrStandPricingConfig()
    }
  } catch {
    pricingConfig = null
  }

  const unitPriceCents = priceForQrStand(
    design.templateId,
    solidVolumeCm3,
    design.designConfig,
    pricingConfig
  )

  return prisma.qrStandDesign.update({
    where: { id: designId },
    data: {
      status: 'READY',
      stlKey: key,
      stlSha256: sha256,
      stlSizeBytes: buffer.length,
      triangleCount: meta.triangleCount,
      bboxMm: meta.bboxMm,
      solidVolumeCm3,
      unitPriceCents,
    },
  })
}

export async function storePreview(userId, designId, buffer) {
  const design = await findOwnedQrStandDesign(userId, designId)
  validatePng(buffer)
  const key = `qr-stand-designs/${userId}/${designId}/preview.png`
  await getStorage().put(key, buffer, { contentType: 'image/png' })
  return prisma.qrStandDesign.update({
    where: { id: designId },
    data: { previewKey: key, previewSizeBytes: buffer.length },
  })
}

export async function stlIsAvailable(design) {
  if (!design?.stlKey) return false
  return getStorage().exists(design.stlKey)
}

export async function readPreview(design) {
  if (!design?.previewKey) {
    throw new HttpError(404, 'No preview image available for this QR Stand design.')
  }
  try {
    return await getStorage().get(design.previewKey)
  } catch {
    throw new HttpError(404, 'No preview image available for this QR Stand design.')
  }
}

export async function getStlForQrStandOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'QR_STAND_DESIGN' },
    include: { qrStandDesign: true, order: true },
  })
  if (!item || !item.qrStandDesign) {
    throw new HttpError(404, 'QR Stand design not found for this order item.')
  }
  if (!item.qrStandDesign.stlKey) {
    throw new HttpError(409, 'This QR Stand design has no stored STL file.')
  }

  const buffer = await getStorage().get(item.qrStandDesign.stlKey)
  const safeTitle = (item.qrStandDesign.title || 'qr-stand')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .toLowerCase()
  return { buffer, filename: `${item.order.orderNumber}-${safeTitle}.stl` }
}

export async function getPreviewForQrStandOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'QR_STAND_DESIGN' },
    include: { qrStandDesign: true },
  })
  if (!item || !item.qrStandDesign) {
    throw new HttpError(404, 'QR Stand design not found for this order item.')
  }
  if (!item.qrStandDesign.previewKey) {
    throw new HttpError(404, 'This QR Stand design has no stored preview image.')
  }
  return getStorage().get(item.qrStandDesign.previewKey)
}

export async function getThreeMfForQrStandOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'QR_STAND_DESIGN' },
    include: { qrStandDesign: true, order: true },
  })
  if (!item || !item.qrStandDesign) {
    throw new HttpError(404, 'QR Stand design not found for this order item.')
  }
  if (!item.qrStandDesign.stlKey) {
    throw new HttpError(409, 'This QR Stand design has no stored STL file.')
  }

  const buffer = await getStorage().get(item.qrStandDesign.stlKey)
  const safeTitle = (item.qrStandDesign.title || 'qr-stand')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .toLowerCase()

  const cfg = item.qrStandDesign.designConfig || {}
  const appearance = cfg.appearance || {}
  const baseColor = appearance.baseColor || '#1E293B'
  const qrColor = appearance.qrDarkColor || '#0F172A'
  const textColor = appearance.textColor || '#0F172A'
  const title = item.qrStandDesign.title || 'QR Stand Design'

  const threeMfBuffer = exportThreeMfFromStl(
    buffer,
    title,
    baseColor,
    qrColor,
    textColor,
    'QR Stand Body'
  )
  const filename = `${item.order.orderNumber}-${safeTitle}.3mf`
  return { buffer: threeMfBuffer, filename, design: item.qrStandDesign }
}
