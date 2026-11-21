import { createHash } from 'node:crypto'
import { HttpError } from '../../utils/httpError.js'

// Bounds are deliberately generous sanity limits (the largest product is a
// ~35 cm door nameplate or desk organizer), not a manufacturing spec.
const MAX_TRIANGLES = 1_000_000
const MIN_TRIANGLES = 4
const MAX_COORDINATE_MM = 2000
const MAX_SIZE_XY_MM = 600
const MAX_SIZE_Z_MM = 400
const MIN_SIZE_MM = 0.4

function bad(message) {
  return new HttpError(400, message)
}

export function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Validates a binary STL (what the geometry engine's exporter writes):
 * 80-byte header, uint32 triangle count, 50 bytes per triangle, exactly.
 * Rejects ASCII STL, truncated/padded files, non-finite numbers and
 * implausible geometry, and returns basic metadata about the mesh.
 */
export function validateBinaryStl(buffer) {
  if (!Buffer.isBuffer(buffer)) throw bad('Send the STL as a binary (application/octet-stream) body.')
  if (buffer.length < 84 + 50 * MIN_TRIANGLES) throw bad('This file is too small to be a valid STL.')

  const triangleCount = buffer.readUInt32LE(80)
  if (buffer.length !== 84 + 50 * triangleCount) {
    if (buffer.subarray(0, 5).toString('latin1').toLowerCase() === 'solid') throw bad('ASCII STL files are not supported; send a binary STL.')
    throw bad('The STL is corrupted: its size does not match its triangle count.')
  }
  if (triangleCount < MIN_TRIANGLES || triangleCount > MAX_TRIANGLES) throw bad('The STL has an unsupported number of triangles.')

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = 84 + triangle * 50
    for (let value = 0; value < 3; value += 1) {
      if (!Number.isFinite(buffer.readFloatLE(offset + value * 4))) throw bad('The STL contains invalid numbers.')
    }
    for (let vertex = 0; vertex < 3; vertex += 1) {
      for (let axis = 0; axis < 3; axis += 1) {
        const coordinate = buffer.readFloatLE(offset + 12 + vertex * 12 + axis * 4)
        if (!Number.isFinite(coordinate) || Math.abs(coordinate) > MAX_COORDINATE_MM) throw bad('The STL contains coordinates outside the printable range.')
        if (coordinate < min[axis]) min[axis] = coordinate
        if (coordinate > max[axis]) max[axis] = coordinate
      }
    }
  }

  const size = max.map((value, axis) => value - min[axis])
  if (size.some((value) => value < MIN_SIZE_MM)) throw bad('The STL model is too thin or flat to print.')
  if (size[0] > MAX_SIZE_XY_MM || size[1] > MAX_SIZE_XY_MM || size[2] > MAX_SIZE_Z_MM) throw bad('The STL model is larger than the maximum printable size.')

  const round = (values) => values.map((value) => Math.round(value * 1000) / 1000)
  return { triangleCount, bboxMm: { min: round(min), max: round(max), size: round(size) } }
}

/**
 * Computes the signed volume of a binary STL and returns it in cm┬│.
 *
 * Uses the divergence theorem: the signed volume of a closed triangle mesh is
 * the sum over triangles of  v0 ┬╖ (v1 ├ù v2) / 6. This is the same formula as
 * three-bvh-csg's `computeMeshVolume`, which the stand studio uses in the
 * browser, so server and client agree to within float rounding.
 *
 * The result is the absolute value, so triangle winding does not flip the sign.
 * Callers must treat 0 (or a wildly implausible value) as a failed measurement,
 * not a free model: signed volume only equals real volume for a closed mesh.
 */
export function computeSignedVolumeCm3(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 84) return 0
  const triangleCount = buffer.readUInt32LE(80)
  if (buffer.length !== 84 + 50 * triangleCount) return 0

  let sixTimesVolumeMm3 = 0
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = 84 + triangle * 50 + 12 // skip the 12-byte normal
    const ax = buffer.readFloatLE(offset)
    const ay = buffer.readFloatLE(offset + 4)
    const az = buffer.readFloatLE(offset + 8)
    const bx = buffer.readFloatLE(offset + 12)
    const by = buffer.readFloatLE(offset + 16)
    const bz = buffer.readFloatLE(offset + 20)
    const cx = buffer.readFloatLE(offset + 24)
    const cy = buffer.readFloatLE(offset + 28)
    const cz = buffer.readFloatLE(offset + 32)

    // a ┬╖ (b ├ù c)
    sixTimesVolumeMm3 +=
      ax * (by * cz - bz * cy) +
      ay * (bz * cx - bx * cz) +
      az * (bx * cy - by * cx)
  }

  return Math.abs(sixTimesVolumeMm3) / 6 / 1000 // mm┬│ ΓåÆ cm┬│
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Checks a PNG's signature and reads its dimensions from the IHDR chunk. */
export function validatePng(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw bad('The preview must be a PNG image.')
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') throw bad('The preview PNG is malformed.')
  const width = buffer.readUInt32BE(16)
  const height = buffer.readUInt32BE(20)
  if (width < 32 || height < 32 || width > 4096 || height > 4096) throw bad('The preview image dimensions are not supported.')
  return { width, height }
}
