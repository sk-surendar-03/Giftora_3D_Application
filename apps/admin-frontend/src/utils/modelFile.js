// Client-side checks for product 3D model uploads. The backend re-validates
// everything (extension, MIME, size and the file's actual contents).

export const MAX_MODEL_BYTES = 50 * 1024 * 1024 // keep in sync with MAX_PRODUCT_MODEL_BYTES on the backend

// Browsers often leave file.type empty for .stl/.3mf, so an empty type is fine.
const ALLOWED_MIME_TYPES = [
  'application/octet-stream',
  'model/stl',
  'model/3mf',
  'model/x.stl-binary',
  'model/x.stl-ascii',
  'application/sla',
  'application/vnd.ms-pki.stl',
  'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
]

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** Returns an error message, or null when the file looks acceptable. */
export function validateModelFile(file) {
  if (!file) return 'Choose a file first.'
  if (!/\.(stl|3mf)$/i.test(file.name)) return 'Only .stl and .3mf files are supported.'
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) return `Unsupported file type (${file.type}). Upload an STL or 3MF model.`
  if (file.size === 0) return 'This file is empty.'
  if (file.size > MAX_MODEL_BYTES) return `This file is ${formatBytes(file.size)}. Models are limited to ${formatBytes(MAX_MODEL_BYTES)}.`
  return null
}
