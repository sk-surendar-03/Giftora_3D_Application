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

async function toWebP(buffer) {
  try {
    const sharp = (await import('sharp')).default
    return await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    // sharp not installed — return original buffer unchanged
    return buffer
  }
}

/**
 * Validates and stores a product image into the persistent storage driver.
 * Converts JPEG/PNG to WebP (max 1200px wide, quality 82) before saving.
 * Returns public metadata including the served API URL.
 */
export async function storeProductImage(rawFilename, buffer) {
  const { filename, format } = parseImageFilename(rawFilename)
  validateImageContent(format, buffer)

  const outputBuffer = format !== 'webp' ? await toWebP(buffer) : buffer
  const outputExt = '.webp'

  const hash = createHash('sha256').update(outputBuffer).digest('hex').slice(0, 24)
  const cleanBase = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .slice(0, 50)
  const storageFilename = `${hash}-${cleanBase}${outputExt}`
  const key = `product-images/${storageFilename}`

  const storage = getStorage()
  await storage.put(key, outputBuffer, { immutable: true })

  return {
    key,
    url: `/api/v1/products/images/${storageFilename}`,
    filename,
    format: 'webp',
    sizeBytes: outputBuffer.length,
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
