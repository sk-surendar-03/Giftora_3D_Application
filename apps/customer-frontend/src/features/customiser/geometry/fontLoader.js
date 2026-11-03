import { parse as parseFont } from 'opentype.js/dist/opentype.mjs'
import { GeometryError } from './errors.js'

const cache = new Map()

/** Fetches and parses a bundled .ttf font file, caching by URL. */
export function loadFont(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new GeometryError(`Could not load font: ${url}`, 'font-load-failed')
          return response.arrayBuffer()
        })
        .then((buffer) => parseFont(buffer))
        .catch((error) => {
          cache.delete(url)
          throw error instanceof GeometryError
            ? error
            : new GeometryError(`Could not parse font: ${url}`, 'font-parse-failed')
        }),
    )
  }
  return cache.get(url)
}
