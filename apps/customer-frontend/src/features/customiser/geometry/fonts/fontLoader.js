// Ported from Open Keychain (MIT) — the font-loading portion of
// src/domain/keychain/build/keychain-builder.ts (parseFont/loadFont/fontCache).
// Logic unchanged; TS type annotations replaced with JSDoc.
// See THIRD-PARTY-NOTICES.md.
//
// Distinct from the existing, simpler `geometry/fontLoader.js` (used by the
// live Phase 5 customizer) — this one matches upstream's cache-key scheme
// (content hash + revision) and `FontDefinition` shape, for the newly-ported
// keychain-builder engine.

import { parse as opentypeParse } from 'opentype.js/dist/opentype.mjs'

function parseFont(buffer) {
  if (!opentypeParse) throw new Error('OpenType parser is unavailable.')
  return opentypeParse(buffer)
}

const fontCache = new Map()

/**
 * @param {import('./catalog').FontDefinition} definition
 * @returns {Promise<import('opentype.js').Font>}
 */
export async function loadFont(definition) {
  const contentIdentity = definition.data
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', definition.data)), (byte) => byte.toString(16).padStart(2, '0')).join('')
    : ''
  const localSignature = `\u0000${definition.dataRevision ?? ''}\u0000${contentIdentity}`
  const cacheKey = `${definition.id}\u0000${definition.file}${localSignature}`
  const cached = fontCache.get(cacheKey)
  if (cached) return cached
  const request = (
    definition.data
      ? Promise.resolve(definition.data.slice(0))
      : fetch(definition.file).then((response) => {
          if (!response.ok) throw new Error(`Could not load the ${definition.name} font.`)
          return response.arrayBuffer()
        })
  )
    .then(parseFont)
    .catch((error) => {
      fontCache.delete(cacheKey)
      throw error
    })
  fontCache.set(cacheKey, request)
  if (fontCache.size > 16) fontCache.delete(fontCache.keys().next().value)
  return request
}
