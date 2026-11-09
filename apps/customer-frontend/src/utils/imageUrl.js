/**
 * Resolves an image URL or path for display in an <img> tag.
 * Handles full URLs (http/https), blob/data URLs, and relative backend URLs (/api/v1/products/images/...).
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (/^(?:https?:)?\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'
  const host = apiBase.replace(/\/api\/v1\/?$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return `${host}${path}`
}
