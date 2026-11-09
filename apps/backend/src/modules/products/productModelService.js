import { createHash } from 'node:crypto'
import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getStorage } from '../storage/storage.js'
import { parseModelFilename, validateModelContent } from './productModelValidator.js'

const MODEL_FIELDS = { modelKey: null, modelFilename: null, modelFormat: null, modelSizeBytes: null }

async function findProduct(id) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new HttpError(404, 'Product not found.')
  return product
}

/** Validates and stores the model, records its key on the product, removes any replaced file. */
export async function storeProductModel(productId, rawFilename, buffer) {
  const product = await findProduct(productId)
  const { filename, format } = parseModelFilename(rawFilename)
  validateModelContent(format, buffer)

  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 24)
  const key = `product-models/${productId}/${hash}.${format}`
  const storage = getStorage()
  await storage.put(key, buffer, { immutable: true })

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { modelKey: key, modelFilename: filename, modelFormat: format, modelSizeBytes: buffer.length },
    include: { category: true },
  })
  if (product.modelKey && product.modelKey !== key) await storage.delete(product.modelKey).catch(() => {})
  return updated
}

export async function removeProductModel(productId) {
  const product = await findProduct(productId)
  const updated = await prisma.product.update({ where: { id: productId }, data: MODEL_FIELDS, include: { category: true } })
  if (product.modelKey) await getStorage().delete(product.modelKey).catch(() => {})
  return updated
}

/** Best-effort cleanup used when a product is deleted. */
export async function deleteModelFile(modelKey) {
  if (modelKey) await getStorage().delete(modelKey).catch(() => {})
}

export async function readProductModel(product) {
  if (!product.modelKey) throw new HttpError(404, 'This product has no 3D model.')
  try {
    return await getStorage().get(product.modelKey)
  } catch {
    throw new HttpError(404, 'The 3D model file is not available.')
  }
}

/**
 * Public shape of a product: the storage key is never exposed. `model` holds
 * what the viewer needs (format, size, a URL served by the API, never a raw
 * storage path); the original filename is only included for admins.
 */
export function serializeProduct(product, { admin = false } = {}) {
  if (!product) return product
  const { modelKey, modelFilename, modelFormat, modelSizeBytes, ...rest } = product
  const version = modelKey ? modelKey.split('/').pop().split('.')[0] : null
  return {
    ...rest,
    model: modelKey
      ? {
          format: modelFormat,
          sizeBytes: modelSizeBytes,
          url: `/products/${encodeURIComponent(product.slug)}/model?v=${version}`,
          ...(admin ? { filename: modelFilename } : {}),
        }
      : null,
  }
}
