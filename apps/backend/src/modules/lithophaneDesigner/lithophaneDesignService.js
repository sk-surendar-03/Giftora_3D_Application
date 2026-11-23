import sharp from 'sharp'
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
  LITHOPHANE_SCHEMA_VERSION,
  priceForLithophane,
} from './lithophaneDesignOptions.js'
import { validateLithophaneDesignInput } from './lithophaneDesignValidator.js'

export function toPublicLithophaneDesign(design, { admin = false } = {}) {
  if (!design) return null
  const result = {
    id: design.id,
    title: design.title,
    templateId: design.templateId,
    status: design.status,
    photoKeys: design.photoKeys,
    designConfig: design.designConfig,
    unitPriceCents: design.unitPriceCents,
    solidVolumeCm3: design.solidVolumeCm3,
    hasPreview: Boolean(design.previewKey),
    hasStl: design.status === 'READY' && Boolean(design.stlKey),
    hasBaseStl: Boolean(design.baseStlKey),
    createdAt: design.createdAt,
  }
  if (admin) {
    result.schemaVersion = design.schemaVersion
    result.stl = design.stlKey
      ? {
          sizeBytes: design.stlSizeBytes,
          sha256: design.stlSha256,
          triangleCount: design.triangleCount,
          bboxMm: design.bboxMm,
        }
      : null
    result.baseStl = design.baseStlKey
      ? {
          sizeBytes: design.baseStlSizeBytes,
          sha256: design.baseStlSha256,
          triangleCount: design.baseTriangleCount,
          bboxMm: design.baseBboxMm,
        }
      : null
  }
  return result
}

export { toPublicLithophaneDesign as toPublicDesign }

export async function findOwnedLithophaneDesign(userId, designId) {
  const design = await prisma.lithophaneDesign.findUnique({ where: { id: designId } })
  if (!design || design.userId !== userId) {
    throw new HttpError(404, 'Lithophane Photo Lamp design not found.')
  }
  return design
}

export const getOwnedLithophaneDesign = findOwnedLithophaneDesign

/**
 * Sanitizes an uploaded customer photo:
 * - Checks buffer length and decodes format
 * - Strips all EXIF, GPS, and device metadata
 * - Auto-orients based on original orientation tag
 * - Re-encodes as progressive JPEG with mozjpeg compression
 * - Stores in private storage under photo-lamp-photos/${userId}/${photoHash}.jpg
 */
export async function storePhoto(userId, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new HttpError(400, 'An image buffer is required.')
  }
  if (buffer.length > 15 * 1024 * 1024) {
    throw new HttpError(400, 'Image file size exceeds maximum limit of 15MB.')
  }

  let metadata
  try {
    metadata = await sharp(buffer).metadata()
  } catch {
    throw new HttpError(400, 'Failed to decode image. Please upload a valid JPEG, PNG, or WebP photo.')
  }

  const format = (metadata.format || '').toLowerCase()
  if (!['jpeg', 'jpg', 'png', 'webp', 'avif'].includes(format)) {
    throw new HttpError(400, `Unsupported image format "${format}". Please upload JPEG, PNG, or WebP.`)
  }

  const { width, height } = metadata
  if (!width || !height || width < 100 || height < 100) {
    throw new HttpError(400, 'Image resolution is too low. Minimum dimensions: 100x100 pixels.')
  }
  if (width > 8000 || height > 8000) {
    throw new HttpError(400, 'Image resolution exceeds maximum allowed dimensions (8000x8000 pixels).')
  }

  // Strip EXIF, GPS, device info and save progressive JPEG
  const sanitizedBuffer = await sharp(buffer)
    .rotate()
    .jpeg({ quality: 90, progressive: true, mozjpeg: true })
    .toBuffer()

  const finalMeta = await sharp(sanitizedBuffer).metadata()
  const sha256 = sha256Hex(sanitizedBuffer)
  const key = `photo-lamp-photos/${userId}/${sha256}.jpg`

  await getStorage().put(key, sanitizedBuffer, { immutable: true, contentType: 'image/jpeg' })

  return {
    photoKey: key,
    sha256,
    width: finalMeta.width,
    height: finalMeta.height,
    sizeBytes: sanitizedBuffer.length,
    format: 'jpeg',
  }
}

export async function createLithophaneDesign(userId, input) {
  const {
    title,
    templateId,
    photoKeys,
    designConfig,
    paramsHash,
  } = validateLithophaneDesignInput(input)

  const existing = await prisma.lithophaneDesign.findUnique({
    where: { userId_paramsHash: { userId, paramsHash } },
  })
  if (existing) return { design: existing, created: false }

  const unitPriceCents = 0 // Evaluated authoritatively on server after STL upload

  try {
    const design = await prisma.lithophaneDesign.create({
      data: {
        userId,
        schemaVersion: LITHOPHANE_SCHEMA_VERSION,
        title,
        templateId,
        photoKeys,
        designConfig,
        paramsHash,
        unitPriceCents,
      },
    })
    return { design, created: true }
  } catch (err) {
    if (err.code === 'P2002') {
      const raced = await prisma.lithophaneDesign.findUnique({
        where: { userId_paramsHash: { userId, paramsHash } },
      })
      if (raced) return { design: raced, created: false }
    }
    throw err
  }
}

export async function storeStl(userId, designId, buffer, claimedSha256) {
  const design = await findOwnedLithophaneDesign(userId, designId)

  if (design.status === 'READY') {
    if (Buffer.isBuffer(buffer) && sha256Hex(buffer) === design.stlSha256) {
      return design
    }
    throw new HttpError(409, 'This Lithophane Photo Lamp design already has its printable STL file.')
  }

  const meta = validateBinaryStl(buffer)
  const sha256 = sha256Hex(buffer)
  if (claimedSha256 && claimedSha256.toLowerCase() !== sha256) {
    throw new HttpError(400, 'The uploaded STL does not match its checksum.')
  }

  const key = `photo-lamp-designs/${userId}/${designId}/${sha256}.stl`
  await getStorage().put(key, buffer, { immutable: true })

  const solidVolumeCm3 = computeSignedVolumeCm3(buffer)
  if (!(solidVolumeCm3 >= 1) || solidVolumeCm3 > 5000) {
    throw new HttpError(
      400,
      'The model volume could not be measured reliably. Please regenerate the lithophane and try again.'
    )
  }

  // Authoritative price calculation using admin settings if present
  let pricingConfig = null
  try {
    const { getPhotoLampPricingConfig } = await import('../settings/settingsService.js')
    if (typeof getPhotoLampPricingConfig === 'function') {
      pricingConfig = await getPhotoLampPricingConfig()
    }
  } catch {
    pricingConfig = null
  }

  const unitPriceCents = priceForLithophane(
    design.templateId,
    solidVolumeCm3,
    design.designConfig,
    pricingConfig
  )

  return prisma.lithophaneDesign.update({
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

export async function storeBaseStl(userId, designId, buffer, claimedSha256) {
  const design = await findOwnedLithophaneDesign(userId, designId)

  const meta = validateBinaryStl(buffer)
  const sha256 = sha256Hex(buffer)
  if (claimedSha256 && claimedSha256.toLowerCase() !== sha256) {
    throw new HttpError(400, 'The uploaded Lamp Base STL does not match its checksum.')
  }

  const key = `photo-lamp-designs/${userId}/${designId}/base_${sha256}.stl`
  await getStorage().put(key, buffer, { immutable: true })

  return prisma.lithophaneDesign.update({
    where: { id: designId },
    data: {
      baseStlKey: key,
      baseStlSha256: sha256,
      baseStlSizeBytes: buffer.length,
      baseTriangleCount: meta.triangleCount,
      baseBboxMm: meta.bboxMm,
    },
  })
}

export async function storePreview(userId, designId, buffer) {
  const design = await findOwnedLithophaneDesign(userId, designId)
  validatePng(buffer)
  const key = `photo-lamp-designs/${userId}/${designId}/preview.png`
  await getStorage().put(key, buffer, { contentType: 'image/png' })
  return prisma.lithophaneDesign.update({
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
    throw new HttpError(404, 'No preview image available for this design.')
  }
  try {
    return await getStorage().get(design.previewKey)
  } catch {
    throw new HttpError(404, 'No preview image available for this design.')
  }
}

export async function readPhoto(design, photoIndex = 0) {
  const photos = Array.isArray(design?.photoKeys) ? design.photoKeys : []
  const photo = photos.find((p) => p.slotIndex === photoIndex) || photos[0]
  if (!photo || !photo.photoKey) {
    throw new HttpError(404, 'Photo not found for this design.')
  }
  try {
    return await getStorage().get(photo.photoKey)
  } catch {
    throw new HttpError(404, 'Photo file missing in storage.')
  }
}

// ─── ADMIN ORDER ATTACHMENT RETRIEVAL ───────────────────────────────────

export async function getStlForLithophaneOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'LITHOPHANE_DESIGN' },
    include: { lithophaneDesign: true, order: true },
  })
  if (!item || !item.lithophaneDesign) {
    throw new HttpError(404, 'Lithophane Photo Lamp design not found for this order item.')
  }
  if (!item.lithophaneDesign.stlKey) {
    throw new HttpError(409, 'This design has no stored panel STL file.')
  }

  const buffer = await getStorage().get(item.lithophaneDesign.stlKey)
  const safeTitle = (item.lithophaneDesign.title || 'lithophane-lamp')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .toLowerCase()
  return { buffer, filename: `${item.order.orderNumber}-${safeTitle}-panel.stl` }
}

export async function getBaseStlForLithophaneOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'LITHOPHANE_DESIGN' },
    include: { lithophaneDesign: true, order: true },
  })
  if (!item || !item.lithophaneDesign) {
    throw new HttpError(404, 'Lithophane Photo Lamp design not found for this order item.')
  }
  if (!item.lithophaneDesign.baseStlKey) {
    throw new HttpError(409, 'This design has no stored base STL file.')
  }

  const buffer = await getStorage().get(item.lithophaneDesign.baseStlKey)
  const safeTitle = (item.lithophaneDesign.title || 'lithophane-lamp')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .toLowerCase()
  return { buffer, filename: `${item.order.orderNumber}-${safeTitle}-base.stl` }
}

export async function getPreviewForLithophaneOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'LITHOPHANE_DESIGN' },
    include: { lithophaneDesign: true },
  })
  if (!item || !item.lithophaneDesign) {
    throw new HttpError(404, 'Lithophane Photo Lamp design not found for this order item.')
  }
  if (!item.lithophaneDesign.previewKey) {
    throw new HttpError(404, 'This design has no stored preview image.')
  }
  return getStorage().get(item.lithophaneDesign.previewKey)
}

export async function getPhotoForLithophaneOrderItem(orderId, itemId, photoIndex = 0) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'LITHOPHANE_DESIGN' },
    include: { lithophaneDesign: true },
  })
  if (!item || !item.lithophaneDesign) {
    throw new HttpError(404, 'Lithophane Photo Lamp design not found for this order item.')
  }
  return await readPhoto(item.lithophaneDesign, photoIndex)
}

export async function getThreeMfForLithophaneOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'LITHOPHANE_DESIGN' },
    include: { lithophaneDesign: true, order: true },
  })
  if (!item || !item.lithophaneDesign) {
    throw new HttpError(404, 'Lithophane Photo Lamp design not found for this order item.')
  }
  if (!item.lithophaneDesign.stlKey) {
    throw new HttpError(409, 'This design has no stored STL file.')
  }

  const panelBuffer = await getStorage().get(item.lithophaneDesign.stlKey)
  let baseBuffer = null
  if (item.lithophaneDesign.baseStlKey) {
    try {
      baseBuffer = await getStorage().get(item.lithophaneDesign.baseStlKey)
    } catch {
      baseBuffer = null
    }
  }

  const safeTitle = (item.lithophaneDesign.title || 'lithophane-lamp')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .toLowerCase()

  const title = item.lithophaneDesign.title || 'Lithophane Photo Lamp'
  const panelColor = '#FDFDFD' // Translucent white for lithophane
  const baseColor = '#1E293B' // Dark charcoal for base

  const threeMfBuffer = exportThreeMfFromStl(
    panelBuffer,
    title,
    panelColor,
    baseBuffer,
    baseColor,
    'Lamp Base'
  )

  const filename = `${item.order.orderNumber}-${safeTitle}.3mf`
  return { buffer: threeMfBuffer, filename, design: item.lithophaneDesign }
}
