import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getStorage } from '../storage/storage.js'
import { sha256Hex, validateBinaryStl, validatePng, computeSignedVolumeCm3 } from '../customizer/stlValidator.js'
import { NAMEPLATE_SCHEMA_VERSION, priceForNameplate } from './nameplateDesignOptions.js'
import { validateNameplateDesignInput } from './nameplateDesignValidator.js'

export function toPublicNameplateDesign(design, { admin = false } = {}) {
  if (!design) return null
  const result = {
    id: design.id,
    title: design.title,
    nameplateType: design.nameplateType,
    shape: design.shape,
    mountingStyle: design.mountingStyle,
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
      ? { sizeBytes: design.stlSizeBytes, sha256: design.stlSha256, triangleCount: design.triangleCount, bboxMm: design.bboxMm }
      : null
  }
  return result
}

export { toPublicNameplateDesign as toPublicDesign }

export async function findOwnedNameplateDesign(userId, designId) {
  const design = await prisma.nameplateDesign.findUnique({ where: { id: designId } })
  if (!design || design.userId !== userId) throw new HttpError(404, 'Nameplate design not found.')
  return design
}

export const getOwnedNameplateDesign = findOwnedNameplateDesign

export async function createNameplateDesign(userId, input) {
  const { canonical, paramsHash, title, nameplateType, shape, mountingStyle } = validateNameplateDesignInput(input)

  const existing = await prisma.nameplateDesign.findUnique({ where: { userId_paramsHash: { userId, paramsHash } } })
  if (existing) return { design: existing, created: false }

  const unitPriceCents = 0 // Evaluated on server after STL upload

  try {
    const design = await prisma.nameplateDesign.create({
      data: {
        userId,
        schemaVersion: NAMEPLATE_SCHEMA_VERSION,
        title,
        nameplateType,
        shape,
        mountingStyle,
        designConfig: canonical,
        paramsHash,
        unitPriceCents,
      },
    })
    return { design, created: true }
  } catch (err) {
    if (err.code === 'P2002') {
      const raced = await prisma.nameplateDesign.findUnique({ where: { userId_paramsHash: { userId, paramsHash } } })
      if (raced) return { design: raced, created: false }
    }
    throw err
  }
}

export async function storeStl(userId, designId, buffer, claimedSha256) {
  const design = await findOwnedNameplateDesign(userId, designId)

  if (design.status === 'READY') {
    if (Buffer.isBuffer(buffer) && sha256Hex(buffer) === design.stlSha256) return design
    throw new HttpError(409, 'This nameplate design already has its STL.')
  }

  const meta = validateBinaryStl(buffer)
  const sha256 = sha256Hex(buffer)
  if (claimedSha256 && claimedSha256.toLowerCase() !== sha256) {
    throw new HttpError(400, 'The uploaded file does not match its checksum.')
  }

  const key = `nameplate-designs/${userId}/${designId}/${sha256}.stl`
  await getStorage().put(key, buffer, { immutable: true })

  const solidVolumeCm3 = computeSignedVolumeCm3(buffer)
  if (!(solidVolumeCm3 >= 1) || solidVolumeCm3 > 5000) {
    throw new HttpError(400, 'The model volume could not be measured reliably. Please regenerate the nameplate and try again.')
  }

  const { getNameplatePricingConfig } = await import('../settings/settingsService.js')
  const pricingConfig = await getNameplatePricingConfig()
  const unitPriceCents = priceForNameplate(design.nameplateType, solidVolumeCm3, design.designConfig, pricingConfig)

  return prisma.nameplateDesign.update({
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
  const design = await findOwnedNameplateDesign(userId, designId)
  validatePng(buffer)
  const key = `nameplate-designs/${userId}/${designId}/preview.png`
  await getStorage().put(key, buffer, { contentType: 'image/png' })
  return prisma.nameplateDesign.update({
    where: { id: designId },
    data: { previewKey: key, previewSizeBytes: buffer.length },
  })
}

export async function stlIsAvailable(design) {
  if (!design?.stlKey) return false
  return getStorage().exists(design.stlKey)
}

export async function readPreview(design) {
  if (!design?.previewKey) throw new HttpError(404, 'No preview for this nameplate design.')
  try {
    return await getStorage().get(design.previewKey)
  } catch {
    throw new HttpError(404, 'No preview for this nameplate design.')
  }
}

export async function getStlForNameplateOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'NAMEPLATE_DESIGN' },
    include: { nameplateDesign: true, order: true },
  })
  if (!item || !item.nameplateDesign) throw new HttpError(404, 'Nameplate design not found for this order line.')
  if (!item.nameplateDesign.stlKey) throw new HttpError(409, 'This nameplate design has no stored STL file.')

  const buffer = await getStorage().get(item.nameplateDesign.stlKey)
  const safeTitle = (item.nameplateDesign.title || 'nameplate').replace(/[^a-zA-Z0-9_-]+/g, '_').toLowerCase()
  return { buffer, filename: `${item.order.orderNumber}-${safeTitle}.stl` }
}

export async function getPreviewForNameplateOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'NAMEPLATE_DESIGN' },
    include: { nameplateDesign: true },
  })
  if (!item || !item.nameplateDesign) throw new HttpError(404, 'Nameplate design not found for this order line.')
  if (!item.nameplateDesign.previewKey) throw new HttpError(404, 'This nameplate design has no stored preview.')
  return getStorage().get(item.nameplateDesign.previewKey)
}
