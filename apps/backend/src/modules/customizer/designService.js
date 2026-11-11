import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getStorage } from '../storage/storage.js'
import { getPricingConfig } from '../settings/settingsService.js'
import { calculateTotalCustomizationPriceCents } from '../settings/pricingCalculator.js'
import { DESIGN_SCHEMA_VERSION } from './designOptions.js'
import { validateDesignInput } from './designValidator.js'
import { sha256Hex, validateBinaryStl, validatePng } from './stlValidator.js'
import { exportThreeMfFromStl } from './threeMfExporter.js'

/** The price of one unit of a design at the given per-character rate. */
export function priceForDesign(params, perCharacterPriceCents) {
  return calculateTotalCustomizationPriceCents(params.text, params.subtitle, perCharacterPriceCents)
}

/**
 * The shape sent to clients. Storage keys are never exposed. Customers see
 * their own design's summary; admins additionally see the file metadata and
 * the exact engine parameters.
 */
export function toPublicDesign(design, { admin = false } = {}) {
  if (!design) return null
  const result = {
    id: design.id,
    title: design.title,
    status: design.status,
    params: design.params,
    unitPriceCents: design.unitPriceCents,
    hasPreview: Boolean(design.previewKey),
    hasStl: design.status === 'READY' && Boolean(design.stlKey),
    createdAt: design.createdAt,
  }
  if (admin) {
    result.schemaVersion = design.schemaVersion
    result.engineParams = design.engineParams
    result.stl = design.stlKey
      ? { sizeBytes: design.stlSizeBytes, sha256: design.stlSha256, triangleCount: design.triangleCount, bboxMm: design.bboxMm }
      : null
  }
  return result
}

async function findOwnedDesign(userId, designId) {
  const design = await prisma.customDesign.findUnique({ where: { id: designId } })
  // Same 404 whether it doesn't exist or belongs to someone else.
  if (!design || design.userId !== userId) throw new HttpError(404, 'Design not found.')
  return design
}

export const getOwnedDesign = findOwnedDesign

/**
 * Validates the customer's design and records it (status PENDING until its STL
 * is uploaded). The same customer submitting the same design again gets the
 * existing record back, so retries never create duplicates.
 */
export async function createDesign(userId, input) {
  const { params, engineParams, title, paramsHash } = validateDesignInput(input)

  const existing = await prisma.customDesign.findUnique({ where: { userId_paramsHash: { userId, paramsHash } } })
  if (existing) return { design: existing, created: false }

  const { perCharacterPriceCents } = await getPricingConfig()
  try {
    const design = await prisma.customDesign.create({
      data: {
        userId,
        schemaVersion: DESIGN_SCHEMA_VERSION,
        title,
        params,
        engineParams,
        paramsHash,
        unitPriceCents: priceForDesign(params, perCharacterPriceCents),
      },
    })
    return { design, created: true }
  } catch (err) {
    if (err.code === 'P2002') {
      // Lost a race with an identical concurrent request.
      const raced = await prisma.customDesign.findUnique({ where: { userId_paramsHash: { userId, paramsHash } } })
      if (raced) return { design: raced, created: false }
    }
    throw err
  }
}

/**
 * Validates and persistently stores the STL for a design. Content-addressed
 * (the key includes the SHA-256), immutable once READY, and idempotent: the
 * same file uploaded again simply returns the existing record.
 */
export async function storeStl(userId, designId, buffer, claimedSha256) {
  const design = await findOwnedDesign(userId, designId)

  if (design.status === 'READY') {
    if (Buffer.isBuffer(buffer) && sha256Hex(buffer) === design.stlSha256) return design
    throw new HttpError(409, 'This design already has its STL. Create a new design to change it.')
  }

  const meta = validateBinaryStl(buffer)
  const sha256 = sha256Hex(buffer)
  if (claimedSha256 && claimedSha256.toLowerCase() !== sha256) {
    throw new HttpError(400, 'The uploaded file does not match its checksum; please retry.')
  }

  const key = `designs/${userId}/${designId}/${sha256}.stl`
  await getStorage().put(key, buffer, { immutable: true })

  const updated = await prisma.customDesign.updateMany({
    where: { id: designId, status: 'PENDING' },
    data: {
      status: 'READY',
      stlKey: key,
      stlSha256: sha256,
      stlSizeBytes: buffer.length,
      triangleCount: meta.triangleCount,
      bboxMm: meta.bboxMm,
    },
  })
  const fresh = await prisma.customDesign.findUnique({ where: { id: designId } })
  if (updated.count === 0 && fresh.stlSha256 !== sha256) {
    throw new HttpError(409, 'This design already has its STL. Create a new design to change it.')
  }
  return fresh
}

/**
 * Stores the relief (text layer) STL for a design. Optional — uploaded after
 * the base STL. Idempotent: the same file uploaded again is a no-op.
 */
export async function storeReliefStl(userId, designId, buffer, claimedSha256) {
  const design = await findOwnedDesign(userId, designId)
  validateBinaryStl(buffer)
  const sha256 = sha256Hex(buffer)
  if (claimedSha256 && claimedSha256.toLowerCase() !== sha256) {
    throw new HttpError(400, 'The uploaded file does not match its checksum; please retry.')
  }
  if (design.reliefStlSha256 === sha256) return design
  const key = `designs/${userId}/${designId}/relief_${sha256}.stl`
  await getStorage().put(key, buffer, { immutable: true })
  await prisma.customDesign.update({
    where: { id: designId },
    data: { reliefStlKey: key, reliefStlSha256: sha256, reliefStlBytes: buffer.length },
  })
  return prisma.customDesign.findUnique({ where: { id: designId } })
}

/** Stores the preview image. Not allowed once the design has been ordered. */
export async function storePreview(userId, designId, buffer) {
  const design = await findOwnedDesign(userId, designId)
  if ((await prisma.orderItem.count({ where: { customDesignId: designId } })) > 0) {
    throw new HttpError(409, 'This design has already been ordered and can no longer be changed.')
  }
  validatePng(buffer)
  const key = `designs/${userId}/${designId}/preview.png`
  await getStorage().put(key, buffer)
  return prisma.customDesign.update({ where: { id: designId }, data: { previewKey: key, previewSizeBytes: buffer.length } })
}

export async function readPreview(design) {
  if (!design?.previewKey) throw new HttpError(404, 'No preview for this design.')
  try {
    return await getStorage().get(design.previewKey)
  } catch {
    throw new HttpError(404, 'No preview for this design.')
  }
}

function safeSlug(text) {
  const slug = String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30)
  return slug || 'design'
}

/**
 * The exact stored STL for one line of one order. The line must belong to
 * that order and be a custom design, and the file's SHA-256 is re-checked
 * against the value recorded when it was uploaded.
 */
export async function getStlForOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'CUSTOM_DESIGN' },
    include: { customDesign: true, order: { select: { orderNumber: true } } },
  })
  const design = item?.customDesign
  if (!item || !design || design.status !== 'READY' || !design.stlKey) throw new HttpError(404, 'STL not found for this order item.')

  let buffer
  try {
    buffer = await getStorage().get(design.stlKey)
  } catch {
    console.error(`STL file missing from storage for design ${design.id} (key ${design.stlKey})`)
    throw new HttpError(404, 'The STL file is missing from storage.')
  }
  if (sha256Hex(buffer) !== design.stlSha256) {
    console.error(`STL integrity check failed for design ${design.id}`)
    throw new HttpError(500, 'Internal server error')
  }
  return { buffer, filename: `${item.order.orderNumber}_${safeSlug(design.params?.text)}_${item.id.slice(-6)}.stl`, design }
}

export async function getThreeMfForOrderItem(orderId, itemId) {
  const { buffer: stlBuffer, filename: stlFilename, design } = await getStlForOrderItem(orderId, itemId)

  let reliefBuffer = null
  if (design.reliefStlKey) {
    try {
      reliefBuffer = await getStorage().get(design.reliefStlKey)
    } catch {
      reliefBuffer = null
    }
  }

  const threeMfBuffer = exportThreeMfFromStl(
    stlBuffer,
    design.title,
    design.params?.color?.hex,
    reliefBuffer,
    design.params?.textColor?.hex,
    design.params?.textColor?.label ?? 'Text'
  )
  const filename = stlFilename.replace(/\.stl$/i, '.3mf')
  return { buffer: threeMfBuffer, filename, design }
}

export async function getPreviewForOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({ where: { id: itemId, orderId, itemType: 'CUSTOM_DESIGN' }, include: { customDesign: true } })
  return readPreview(item?.customDesign)
}

/** Whether the stored STL for a design is actually present in storage. */
export async function stlIsAvailable(design) {
  if (!design || design.status !== 'READY' || !design.stlKey) return false
  return getStorage().exists(design.stlKey)
}

/**
 * Cleans up abandoned custom designs and their orphaned storage files.
 * An abandoned design is one that:
 * 1. Has no associated OrderItems (was never ordered)
 * 2. Has no associated CartItems (was removed from cart or abandoned)
 * 3. Was created before olderThanDate (default: 7 days ago)
 *
 * @param {object} options
 * @param {Date} [options.olderThanDate] - Threshold date (default: 7 days ago)
 * @param {number} [options.limit] - Batch limit (default: 100)
 * @returns {Promise<{ deletedCount: number, deletedFilesCount: number }>}
 */
export async function cleanupAbandonedDesigns({ olderThanDate, limit = 100 } = {}) {
  const threshold = olderThanDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Find candidate designs that are older than threshold and neither ordered nor in active carts
  const abandonedCandidates = await prisma.customDesign.findMany({
    where: {
      createdAt: { lt: threshold },
      orderItems: { none: {} },
      cartItems: { none: {} },
    },
    select: {
      id: true,
      stlKey: true,
      previewKey: true,
    },
    take: limit,
  })

  if (abandonedCandidates.length === 0) {
    return { deletedCount: 0, deletedFilesCount: 0 }
  }

  const storage = getStorage()
  let deletedFilesCount = 0

  for (const candidate of abandonedCandidates) {
    if (candidate.stlKey) {
      try {
        await storage.delete(candidate.stlKey)
        deletedFilesCount++
      } catch (err) {
        console.warn(`Failed to delete abandoned STL ${candidate.stlKey}:`, err.message)
      }
    }
    if (candidate.previewKey) {
      try {
        await storage.delete(candidate.previewKey)
        deletedFilesCount++
      } catch (err) {
        console.warn(`Failed to delete abandoned preview ${candidate.previewKey}:`, err.message)
      }
    }
  }

  const ids = abandonedCandidates.map((c) => c.id)
  const deleteResult = await prisma.customDesign.deleteMany({
    where: { id: { in: ids } },
  })

  return {
    deletedCount: deleteResult.count,
    deletedFilesCount,
  }
}
