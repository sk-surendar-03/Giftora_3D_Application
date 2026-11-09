import { unzipSync } from 'fflate'
import { HttpError } from '../../utils/httpError.js'

// Product preview models are display assets, so the checks are about "is this
// really an STL / 3MF and safe to parse", not about printability.

export const MAX_MODEL_BYTES = Number(process.env.MAX_PRODUCT_MODEL_BYTES) || 50 * 1024 * 1024
const MAX_UNZIPPED_MODEL_BYTES = 300 * 1024 * 1024
const MAX_FILENAME_LENGTH = 150

// Content types a browser or client may legitimately send for these files.
export const ALLOWED_MODEL_MIME_TYPES = [
  'application/octet-stream',
  'model/stl',
  'model/3mf',
  'model/x.stl-binary',
  'model/x.stl-ascii',
  'application/sla',
  'application/vnd.ms-pki.stl',
  'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
]

function bad(message) {
  return new HttpError(400, message)
}

/** Returns a safe display filename and the lower-case format ('stl' | '3mf'). */
export function parseModelFilename(raw) {
  if (typeof raw !== 'string') throw bad('A filename is required (?filename=model.stl).')
  const base = raw.split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (!base || base.length > MAX_FILENAME_LENGTH) throw bad('The filename is empty or too long.')
  const match = /\.(stl|3mf)$/i.exec(base)
  if (!match) throw bad('Only .stl and .3mf files are supported.')
  return { filename: base, format: match[1].toLowerCase() }
}

function validateStl(buffer) {
  if (buffer.length < 84) throw bad('This file is too small to be a valid STL.')
  const triangleCount = buffer.readUInt32LE(80)
  if (triangleCount > 0 && buffer.length === 84 + 50 * triangleCount) {
    // Binary STL: spot-check that the numbers are finite.
    const step = Math.max(1, Math.floor(triangleCount / 2000))
    for (let t = 0; t < triangleCount; t += step) {
      const offset = 84 + t * 50
      for (let v = 0; v < 12; v += 1) {
        if (!Number.isFinite(buffer.readFloatLE(offset + v * 4))) throw bad('The STL contains invalid numbers.')
      }
    }
    return
  }
  // ASCII STL: starts with "solid" and has facets, and no binary bytes.
  const head = buffer.subarray(0, 5).toString('latin1').toLowerCase()
  if (head === 'solid') {
    const text = buffer.toString('latin1')
    if (!/facet\s+normal/i.test(text) || !/endsolid/i.test(text)) throw bad('This ASCII STL has no facets or is truncated.')
    if (/[\u0000-\u0008\u000e-\u001f]/.test(text.slice(0, 4096))) throw bad('This file is not a valid STL.')
    return
  }
  throw bad('This file is not a valid STL (size does not match its triangle count).')
}

function validateThreeMf(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
    throw bad('This file is not a valid 3MF (it is not a ZIP package).')
  }
  let entries
  try {
    entries = unzipSync(new Uint8Array(buffer), {
      filter: (file) => {
        if (file.originalSize > MAX_UNZIPPED_MODEL_BYTES) throw new Error('too large')
        return /\.model$/i.test(file.name)
      },
    })
  } catch {
    throw bad('This 3MF package is corrupted or too large to read.')
  }
  const names = Object.keys(entries)
  const modelEntry = names.find((name) => name.toLowerCase() === '3d/3dmodel.model') ?? names[0]
  if (!modelEntry) throw bad('This 3MF has no 3D model part (3D/3dmodel.model).')
  const head = Buffer.from(entries[modelEntry].subarray(0, 4096)).toString('utf8')
  if (!/<model[\s>]/.test(head)) throw bad('This 3MF model part is not valid 3MF XML.')
}

/** Throws HttpError(400) unless `buffer` really is a `format` model. */
export function validateModelContent(format, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw bad('The uploaded file is empty.')
  if (buffer.length > MAX_MODEL_BYTES) throw new HttpError(413, `Model files are limited to ${Math.round(MAX_MODEL_BYTES / 1024 / 1024)} MB.`)
  if (format === 'stl') validateStl(buffer)
  else if (format === '3mf') validateThreeMf(buffer)
  else throw bad('Only .stl and .3mf files are supported.')
}
