import { createHash } from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'
import { getStorage } from '../storage/storage.js'
import { parseImageFilename, validateImageContent } from './productImageValidator.js'

const MIME_MAP = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/**
 * Validates and stores a product image into the persistent storage driver.
 * Returns public metadata including the served API URL.
 */
export async function storeProductImage(rawFilename, buffer) {
  const { filename, format, ext } = parseImageFilename(rawFilename)
  validateImageContent(format, buffer)

  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 24)
  const cleanBase = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .slice(0, 50)
  const storageFilename = `${hash}-${cleanBase}${ext}`
  const key = `product-images/${storageFilename}`

  const storage = getStorage()
  await storage.put(key, buffer, { immutable: true })

  return {
    key,
    url: `/api/v1/products/images/${storageFilename}`,
    filename,
    format,
    sizeBytes: buffer.length,
  }
}

/**
 * Reads a stored product image and determines its MIME type for streaming.
 */
export async function readProductImage(storageFilename) {
  if (
    typeof storageFilename !== 'string' ||
    !/^[A-Za-z0-9._-]+$/.test(storageFilename) ||
    storageFilename.includes('..')
  ) {
    throw new HttpError(400, 'Invalid image filename.')
  }

  const match = /\.(jpe?g|png|webp)$/i.exec(storageFilename)
  if (!match) throw new HttpError(400, 'Invalid image extension.')

  const rawExt = match[1].toLowerCase()
  const mimeType = MIME_MAP[rawExt] || 'application/octet-stream'
  const key = `product-images/${storageFilename}`

  try {
    const buffer = await getStorage().get(key)
    return { buffer, mimeType }
  } catch {
    throw new HttpError(404, 'Image not found.')
  }
}

/**
 * Best-effort deletion of a stored product image.
 */
export async function deleteProductImage(storageFilename) {
  if (
    typeof storageFilename !== 'string' ||
    !/^[A-Za-z0-9._-]+$/.test(storageFilename) ||
    storageFilename.includes('..')
  ) {
    return
  }
  const key = `product-images/${storageFilename}`
  await getStorage().delete(key).catch(() => {})
}
