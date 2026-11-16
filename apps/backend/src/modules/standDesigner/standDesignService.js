import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getStorage } from '../storage/storage.js'
import { sha256Hex, validateBinaryStl, validatePng } from '../customizer/stlValidator.js'
import { STAND_SCHEMA_VERSION, priceForStand } from './standDesignOptions.js'
import { validateStandDesignInput } from './standDesignValidator.js'

function toPublicStandDesign(design, { admin = false } = {}) {
  if (!design) return null
  const result = {
    id: design.id,
    title: design.title,
    category: design.category,
    status: design.status,
    designConfig: design.designConfig,
    unitPriceCents: design.unitPriceCents,
    hasPreview: Boolean(design.previewKey),
    hasStl: design.status === 'READY' && Boolean(design.stlKey),
    createdAt: design.createdAt,
  }
  if (admin) {
    result.schemaVersion = design.schemaVersion
    result.stl = design.stlKey
      ? { sizeBytes: design.stlSizeBytes, sha256: design.stlSha256, triangleCount: design.triangleCount, bboxMm: design.bboxMm }
      : null
  }
  return result
}

export { toPublicStandDesign, toPublicStandDesign as toPublicDesign }

async function findOwnedStandDesign(userId, designId) {
  const design = await prisma.standDesign.findUnique({ where: { id: designId } })
  if (!design || design.userId !== userId) throw new HttpError(404, 'Stand design not found.')
  return design
}

export const getOwnedStandDesign = findOwnedStandDesign

export async function createStandDesign(userId, input) {
  const { canonical, paramsHash, title } = validateStandDesignInput(input)

  const existing = await prisma.standDesign.findUnique({ where: { userId_paramsHash: { userId, paramsHash } } })
  if (existing) return { design: existing, created: false }

  // Volume is only known after STL upload; use a placeholder estimate now.
  // The real price gets recomputed and stored when the STL arrives (storeStl).
  const { solidVolumeCm3 = 50 } = input
  const unitPriceCents = priceForStand(canonical.category, solidVolumeCm3)

  try {
    const design = await prisma.standDesign.create({
      data: {
        userId,
        schemaVersion: STAND_SCHEMA_VERSION,
        title,
        category: canonical.category,
        designConfig: canonical,
        paramsHash,
        unitPriceCents,
      },
    })
    return { design, created: true }
  } catch (err) {
    if (err.code === 'P2002') {
      const raced = await prisma.standDesign.findUnique({ where: { userId_paramsHash: { userId, paramsHash } } })
      if (raced) return { design: raced, created: false }
    }
    throw err
  }
}

export async function storeStl(userId, designId, buffer, claimedSha256, actualVolumeCm3) {
  const design = await findOwnedStandDesign(userId, designId)

  if (design.status === 'READY') {
    if (Buffer.isBuffer(buffer) && sha256Hex(buffer) === design.stlSha256) return design
    throw new HttpError(409, 'This stand design already has its STL.')
  }

  const meta = validateBinaryStl(buffer)
  const sha256 = sha256Hex(buffer)
  if (claimedSha256 && claimedSha256.toLowerCase() !== sha256) {
    throw new HttpError(400, 'The uploaded file does not match its checksum.')
  }

  const key = `stand-designs/${userId}/${designId}/${sha256}.stl`
  await getStorage().put(key, buffer, { immutable: true })

  // Recompute price now that we know the real volume
  const volume = typeof actualVolumeCm3 === 'number' && actualVolumeCm3 > 0 ? actualVolumeCm3 : 50
  const unitPriceCents = priceForStand(design.category, volume)

  const updated = await prisma.standDesign.updateMany({
    where: { id: designId, status: 'PENDING' },
    data: {
      status: 'READY',
      stlKey: key,
      stlSha256: sha256,
      stlSizeBytes: buffer.length,
      triangleCount: meta.triangleCount,
      bboxMm: meta.bboxMm,
      unitPriceCents,
    },
  })
  const fresh = await prisma.standDesign.findUnique({ where: { id: designId } })
  if (updated.count === 0 && fresh.stlSha256 !== sha256) {
    throw new HttpError(409, 'This stand design already has its STL.')
  }
  return fresh
}

export async function storePreview(userId, designId, buffer) {
  const design = await findOwnedStandDesign(userId, designId)
  if ((await prisma.orderItem.count({ where: { standDesignId: designId } })) > 0) {
    throw new HttpError(409, 'This design has already been ordered.')
  }
  validatePng(buffer)
  const key = `stand-designs/${userId}/${designId}/preview.png`
  await getStorage().put(key, buffer)
  return prisma.standDesign.update({ where: { id: designId }, data: { previewKey: key, previewSizeBytes: buffer.length } })
}

export async function readPreview(design) {
  if (!design?.previewKey) throw new HttpError(404, 'No preview for this stand design.')
  try {
    return await getStorage().get(design.previewKey)
  } catch {
    throw new HttpError(404, 'No preview for this stand design.')
  }
}

export async function stlIsAvailable(design) {
  if (!design || design.status !== 'READY' || !design.stlKey) return false
  return getStorage().exists(design.stlKey)
}

function safeSlug(text) {
  const slug = String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30)
  return slug || 'stand'
}

// The stored STL for one line of one order. As with custom designs, the line
// must belong to that order and be a stand design, and the file's SHA-256 is
// re-checked against the value recorded when it was uploaded.
export async function getStlForStandOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'STAND_DESIGN' },
    include: { standDesign: true, order: { select: { orderNumber: true } } },
  })
  const design = item?.standDesign
  if (!item || !design || design.status !== 'READY' || !design.stlKey) {
    throw new HttpError(404, 'STL not found for this order item.')
  }

  let buffer
  try {
    buffer = await getStorage().get(design.stlKey)
  } catch {
    console.error(`STL file missing from storage for stand design ${design.id} (key ${design.stlKey})`)
    throw new HttpError(404, 'The STL file is missing from storage.')
  }
  if (design.stlSha256 && sha256Hex(buffer) !== design.stlSha256) {
    console.error(`STL integrity check failed for stand design ${design.id}`)
    throw new HttpError(500, 'Internal server error')
  }
  return { buffer, filename: `${item.order.orderNumber}_${safeSlug(design.title)}_${item.id.slice(-6)}.stl`, design }
}

export async function getPreviewForStandOrderItem(orderId, itemId) {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId, itemType: 'STAND_DESIGN' },
    include: { standDesign: true },
  })
  return readPreview(item?.standDesign)
}