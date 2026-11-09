import { HttpError } from '../../utils/httpError.js'

export const MAX_IMAGE_BYTES = Number(process.env.MAX_PRODUCT_IMAGE_BYTES) || 15 * 1024 * 1024 // 15 MB
const MAX_FILENAME_LENGTH = 150

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/octet-stream',
]

function bad(message) {
  return new HttpError(400, message)
}

/**
 * Validates and extracts a sanitized filename and format from a raw filename string.
 * Supports: .jpg, .jpeg, .png, .webp (case-insensitive)
 */
export function parseImageFilename(raw) {
  if (typeof raw !== 'string') throw bad('A filename is required (?filename=photo.jpg).')
  const base = raw.split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (!base || base.length > MAX_FILENAME_LENGTH) throw bad('The filename is empty or too long.')

  const match = /\.(jpe?g|png|webp)$/i.exec(base)
  if (!match) throw bad('Only JPG, JPEG, PNG, and WEBP image files are supported.')

  const ext = match[0].toLowerCase()
  const rawExt = match[1].toLowerCase()
  const format = rawExt === 'jpg' ? 'jpeg' : rawExt

  return { filename: base, format, ext }
}

/**
 * Validates the image buffer's size and file signature (magic bytes).
 * Throws HttpError(400) or HttpError(413) if invalid.
 */
export function validateImageContent(format, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw bad('The uploaded image file is empty.')
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new HttpError(413, `Image files are limited to ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.`)
  }

  if (format === 'png') {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length < 8 ||
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47 ||
      buffer[4] !== 0x0d ||
      buffer[5] !== 0x0a ||
      buffer[6] !== 0x1a ||
      buffer[7] !== 0x0a
    ) {
      throw bad('This file is not a valid PNG image.')
    }
    return
  }

  if (format === 'jpeg') {
    // JPEG signature: SOI marker FF D8 FF
    if (
      buffer.length < 4 ||
      buffer[0] !== 0xff ||
      buffer[1] !== 0xd8 ||
      buffer[2] !== 0xff
    ) {
      throw bad('This file is not a valid JPEG/JPG image.')
    }
    return
  }

  if (format === 'webp') {
    // WebP signature: RIFF container with WEBP chunk
    // Bytes 0-3: 'RIFF', Bytes 8-11: 'WEBP'
    if (
      buffer.length < 12 ||
      buffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
      buffer.subarray(8, 12).toString('ascii') !== 'WEBP'
    ) {
      throw bad('This file is not a valid WEBP image.')
    }
    return
  }

  throw bad(`Unsupported image format: ${format}`)
}
