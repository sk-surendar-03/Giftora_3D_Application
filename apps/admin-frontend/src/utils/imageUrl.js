/**
 * Resolves an image URL or path for display in an <img> tag.
 * Handles full URLs (http/https), blob/data URLs, and relative backend URLs (/api/v1/products/images/...).
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (/^(?:https?:)?\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'
  const host = apiBase.replace(/\/api\/v1\/?$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return `${host}${path}`
}

/**
 * Extracts a friendly display filename from an image URL or path.
 */
export function extractImageFilename(url) {
  if (!url || typeof url !== 'string') return 'image'
  try {
    const raw = url.split('?')[0].split('#')[0].split('/').pop() || 'image'
    // Decode percent-encoding and strip unique hash prefixes (e.g. "a1b2c3d4-filename.jpg" -> "filename.jpg")
    const decoded = decodeURIComponent(raw)
    return decoded.replace(/^[a-f0-9]{16,32}-/, '')
  } catch {
    return 'image'
  }
}
