import { createHash } from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'
import { getStorage } from '../storage/storage.js'
import { parseImageFilename, validateImageContent } from './productImageValidator.js'

const FORMAT_DETAILS = {
  jpeg: { extension: '.jpg', mimeType: 'image/jpeg' },
  png: { extension: '.png', mimeType: 'image/png' },
  webp: { extension: '.webp', mimeType: 'image/webp' },
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Determines an image's real format from its magic bytes. Used both to verify
 * conversion output and to serve legacy files with the MIME type that matches
 * the bytes actually stored on disk.
 */
function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null

  if (buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return 'png'
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }
  return null
}

async function loadSharp() {
  return (await import('sharp')).default
}

/**
 * Converts an image to WebP (max 1200px wide, quality 82). Returns null when
 * sharp is unavailable, decoding fails, or the output is not a valid WebP so
 * the caller can safely store the validated original instead.
 */
async function toWebP(buffer, sharpLoader = loadSharp) {
  try {
    const sharp = await sharpLoader()
    const output = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    return Buffer.isBuffer(output) && output.length > 0 && detectImageFormat(output) === 'webp'
      ? output
      : null
  } catch {
    return null
  }
}

/**
 * Validates and stores a product image into the persistent storage driver.
 * Converts JPEG/PNG to WebP (max 1200px wide, quality 82) before saving. When
 * sharp is missing or conversion fails, the validated original bytes are kept.
 * The filename extension and returned metadata always describe the bytes that
 * were actually stored. Returns public metadata including the served API URL.
 */
export async function storeProductImage(rawFilename, buffer, { sharpLoader } = {}) {
  const { filename, format } = parseImageFilename(rawFilename)
  validateImageContent(format, buffer)

  let outputBuffer = buffer
  let outputFormat = format

  if (format !== 'webp') {
    const converted = await toWebP(buffer, sharpLoader)
    if (converted) {
      outputBuffer = converted
      outputFormat = 'webp'
    }
  }

  const { extension: outputExt } = FORMAT_DETAILS[outputFormat]

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
    format: outputFormat,
    sizeBytes: outputBuffer.length,
  }
}

/**
 * Reads a stored product image and determines its MIME type for streaming.
 * The MIME type is derived from the stored bytes so legacy files saved with a
 * mismatched extension are still served correctly.
 */
export async function readProductImage(storageFilename) {
  if (
    typeof storageFilename !== 'string' ||
    !/^[A-Za-z0-9._-]+$/.test(storageFilename) ||
    storageFilename.includes('..')
  ) {
    throw new HttpError(400, 'Invalid image filename.')
  }

  if (!/\.(jpe?g|png|webp)$/i.test(storageFilename)) {
    throw new HttpError(400, 'Invalid image extension.')
  }

  const key = `product-images/${storageFilename}`

  let buffer
  try {
    buffer = await getStorage().get(key)
  } catch {
    throw new HttpError(404, 'Image not found.')
  }

  const actualFormat = detectImageFormat(buffer)
  const mimeType = actualFormat ? FORMAT_DETAILS[actualFormat].mimeType : 'application/octet-stream'
  return { buffer, mimeType }
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
