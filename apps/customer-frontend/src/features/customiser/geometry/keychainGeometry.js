import { getManifoldWasm } from './manifoldRuntime.js'
import { flattenText, hasRequiredGlyphs } from './textOutline.js'
import { manifoldToBufferGeometry, MANIFOLD_SCALE } from './meshToBufferGeometry.js'
import { GeometryError } from './errors.js'

// Scene-unit dimensions (matches the scale of Giftora's earlier procedural
// placeholder, so the viewer/camera framing didn't need to change).
const TAG_WIDTH = 2.2
const TAG_HEIGHT = 0.9
const TAG_DEPTH = 0.16
const TAG_RADIUS = 0.12
const RING_MAJOR_RADIUS = 0.22
const RING_MINOR_RADIUS = 0.05
const RING_GAP = 0.03

const TEXT_HEIGHT = 0.34
const TEXT_DEPTH = 0.055
const TEXT_LETTER_SPACING = 0.015
const TEXT_MAX_WIDTH = TAG_WIDTH * 0.84

const S = MANIFOLD_SCALE

/** A rounded-rectangle 2D cross-section, built as a union of primitives (the standard CSG technique for rounded rects). */
function roundedRectCrossSection(wasm, width, height, radius, segments = 24) {
  const r = Math.min(radius, width / 2, height / 2)
  const pieces = [
    wasm.CrossSection.square([width - 2 * r, height], true),
    wasm.CrossSection.square([width, height - 2 * r], true),
  ]
  const corners = [
    [width / 2 - r, height / 2 - r],
    [-(width / 2 - r), height / 2 - r],
    [width / 2 - r, -(height / 2 - r)],
    [-(width / 2 - r), -(height / 2 - r)],
  ]
  for (const [x, y] of corners) {
    pieces.push(wasm.CrossSection.circle(r, segments).translate(x, y))
  }
  const result = wasm.CrossSection.union(pieces)
  for (const piece of pieces) piece.delete()
  return result
}

/** Builds the keyring loop as a torus (a circle revolved around an offset axis), standing with its hole vertical. */
function buildRing(wasm) {
  const circle = wasm.CrossSection.circle(RING_MINOR_RADIUS * S, 20).translate(RING_MAJOR_RADIUS * S, 0)
  const torus = circle.revolve(28).rotate(-90, 0, 0)
  const positioned = torus.translate(0, (TAG_HEIGHT / 2 + RING_MINOR_RADIUS + RING_GAP) * S, 0)
  circle.delete()
  torus.delete()
  return positioned
}

/** Fits the given text to TEXT_MAX_WIDTH by re-flattening at a smaller target height if it would otherwise overflow the tag. */
function fitTextOutline(font, text) {
  let outline = flattenText(font, text, TEXT_HEIGHT, TEXT_LETTER_SPACING)
  if (outline.width > TEXT_MAX_WIDTH && outline.width > 0) {
    const fitScale = TEXT_MAX_WIDTH / outline.width
    outline = flattenText(font, text, TEXT_HEIGHT * fitScale, TEXT_LETTER_SPACING * fitScale)
  }
  return outline
}

/**
 * Generates a single, real, merged solid (tag + keyring + raised engraved
 * text) as a THREE.BufferGeometry, using manifold-3d for actual boolean CSG
 * union — not three separate unmerged meshes. Geometry construction follows
 * the same font-outline → CrossSection → extrude → union pipeline Open
 * Keychain uses (MIT); see THIRD-PARTY-NOTICES.md.
 *
 * @param {object} params
 * @param {import('opentype.js').Font} params.font - a parsed, loaded font
 * @param {string} params.text - the engraved text (validated by the caller)
 * @param {number} [params.sizeScale] - uniform scale factor (from the selected product size)
 * @returns {Promise<{ geometry: import('three').BufferGeometry, triangleCount: number }>}
 */
export async function generateKeychainGeometry({ font, text, sizeScale = 1 }) {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new GeometryError('Enter at least one character to generate the keychain.', 'empty-text')
  }
  const unsupported = hasRequiredGlyphs(font, trimmed)
  if (unsupported) {
    throw new GeometryError(`The selected font doesn't support "${unsupported}".`, 'unsupported-glyph')
  }

  const wasm = await getManifoldWasm()
  const disposables = []
  const own = (value) => {
    disposables.push(value)
    return value
  }

  try {
    const tagSection = own(roundedRectCrossSection(wasm, TAG_WIDTH * S, TAG_HEIGHT * S, TAG_RADIUS * S))
    const tagSolid = own(tagSection.extrude(TAG_DEPTH * S, 0, 0, undefined, true))

    const ring = own(buildRing(wasm))

    const outline = fitTextOutline(font, trimmed)
    if (!outline.polygons.length) {
      throw new GeometryError('Could not generate 3D text from that input.', 'empty-outline')
    }
    const scaledPolygons = outline.polygons.map((polygon) => polygon.map(([x, y]) => [x * S, y * S]))
    const textSection = own(new wasm.CrossSection(scaledPolygons, 'NonZero'))
    const textSolidRaw = own(textSection.extrude(TEXT_DEPTH * S))
    const textSolid = own(textSolidRaw.translate(0, 0, (TAG_DEPTH / 2) * S))

    const combined = own(wasm.Manifold.union([tagSolid, ring, textSolid]))
    const final = sizeScale !== 1 ? own(combined.scale(sizeScale)) : combined

    if (final.numTri() === 0) {
      throw new GeometryError('The generated keychain has no visible geometry.', 'empty-solid')
    }

    const geometry = manifoldToBufferGeometry(final)
    return { geometry, triangleCount: final.numTri() }
  } finally {
    for (const item of disposables) {
      try {
        item.delete()
      } catch {
        // Already deleted as part of a union/extrude consuming its inputs — safe to ignore.
      }
    }
  }
}
