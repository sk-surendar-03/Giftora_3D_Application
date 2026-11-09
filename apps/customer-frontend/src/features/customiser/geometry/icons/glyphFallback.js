// Per-character fallback from the customer's selected font to the bundled
// monochrome symbol font. Used only for characters that (a) the selected font
// does not contain and (b) belong to the curated printable-icon catalog.
// Everything else resolves exactly as before (`font.charToGlyph`), so plain
// text never touches the symbol font.

import { isPrintableIcon } from './iconCatalog.js'

/** Bundled symbol font (Noto Emoji, SIL OFL 1.1), loaded through the normal `loadFont`. */
export const SYMBOL_FONT_DEFINITION = {
  id: 'noto-emoji',
  name: 'Noto Emoji',
  file: '/fonts/noto-emoji.ttf',
}

// Breathing room on each side of an icon, as a fraction of the cap height, so
// an icon does not fuse with the neighbouring letter.
const ICON_SIDE_GAP_RATIO = 0.06
const FALLBACK_CAP_HEIGHT_RATIO = 0.7

const iconGlyphCache = new WeakMap()

/** True when `character` must come from the symbol font for this primary font. */
export function isSymbolFallbackCharacter(font, symbolFont, character) {
  return Boolean(
    symbolFont &&
      isPrintableIcon(character) &&
      font.charToGlyphIndex(character) === 0 &&
      symbolFont.charToGlyphIndex(character) !== 0,
  )
}

/** True when any character of `text` needs the symbol font (so the caller can load it lazily). */
export function textNeedsSymbolFont(font, text) {
  for (const character of text ?? '') {
    if (character === ' ') continue
    if (isPrintableIcon(character) && font.charToGlyphIndex(character) === 0) return true
  }
  return false
}

function capHeightUnits(font) {
  const declared = font.tables?.os2?.sCapHeight
  if (Number.isFinite(declared) && declared > 0) return declared
  const box = font.charToGlyph('H').getBoundingBox()
  if (box && box.y2 - box.y1 > 0) return box.y2 - box.y1
  return font.unitsPerEm * FALLBACK_CAP_HEIGHT_RATIO
}

function mapCommand(command, mapX, mapY) {
  const mapped = { type: command.type }
  if ('x' in command) mapped.x = mapX(command.x)
  if ('y' in command) mapped.y = mapY(command.y)
  if ('x1' in command) mapped.x1 = mapX(command.x1)
  if ('y1' in command) mapped.y1 = mapY(command.y1)
  if ('x2' in command) mapped.x2 = mapX(command.x2)
  if ('y2' in command) mapped.y2 = mapY(command.y2)
  return mapped
}

/**
 * Wraps a symbol-font glyph so it looks like a glyph of the primary font:
 * its height is normalised to the primary font's cap height, it sits on the
 * baseline, and `advanceWidth`/`getPath` use the primary font's units. The
 * rest of the text pipeline therefore needs no icon-specific logic.
 */
function buildIconGlyph(font, symbolFont, character) {
  const symbolGlyph = symbolFont.charToGlyph(character)
  const rawPath = symbolGlyph.getPath(0, 0, symbolFont.unitsPerEm)
  const box = rawPath.getBoundingBox()
  const iconWidth = box.x2 - box.x1
  const iconHeight = box.y2 - box.y1
  if (!(iconWidth > 0) || !(iconHeight > 0)) return undefined
  const cap = capHeightUnits(font)
  const unitScale = cap / iconHeight
  const gap = cap * ICON_SIDE_GAP_RATIO
  return {
    isFallbackIcon: true,
    character,
    advanceWidth: iconWidth * unitScale + gap * 2,
    /** Same contract as opentype's `Glyph#getPath(x, y, fontSize)`; only `.commands` is consumed. */
    getPath(x = 0, y = 0, fontSize = 72) {
      const scale = (fontSize / font.unitsPerEm) * unitScale
      const toPrimary = fontSize / font.unitsPerEm
      return {
        commands: rawPath.commands.map((command) =>
          mapCommand(
            command,
            (px) => x + ((px - box.x1) * unitScale + gap) * toPrimary,
            // opentype paths are y-down; put the icon's lowest point on the baseline (y).
            (py) => y + (py - box.y2) * scale,
          ),
        ),
      }
    },
  }
}

/**
 * Resolves the glyph for one character. Selected font first; the symbol font
 * only for curated icons the selected font lacks; otherwise the selected
 * font's own glyph (including its existing `.notdef` behaviour).
 */
export function resolveGlyphWithFallback(font, symbolFont, character) {
  if (!isSymbolFallbackCharacter(font, symbolFont, character)) return font.charToGlyph(character)
  let perFont = iconGlyphCache.get(font)
  if (!perFont) {
    perFont = new Map()
    iconGlyphCache.set(font, perFont)
  }
  const cacheKey = `${character}`
  if (!perFont.has(cacheKey)) perFont.set(cacheKey, buildIconGlyph(font, symbolFont, character))
  return perFont.get(cacheKey) ?? font.charToGlyph(character)
}
