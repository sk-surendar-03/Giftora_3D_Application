import test from 'node:test'
import assert from 'node:assert/strict'
import { sha256Hex, validateBinaryStl, validatePng } from '../src/modules/customizer/stlValidator.js'
import { makeBoxStl, makePng } from './helpers.js'

const rejects = (buffer, pattern, fn = validateBinaryStl) =>
  assert.throws(() => fn(buffer), (err) => err.status === 400 && pattern.test(err.message), `expected 400 ${pattern}`)

test('a valid binary STL yields triangle count and bounding box', () => {
  const meta = validateBinaryStl(makeBoxStl({ x: 40, y: 12, z: 3 }))
  assert.equal(meta.triangleCount, 12)
  assert.deepEqual(meta.bboxMm.size, [40, 12, 3])
  assert.deepEqual(meta.bboxMm.min, [0, 0, 0])
})

test('rejects non-binary input, tiny files, truncated and padded files', () => {
  rejects('not a buffer', /binary/)
  rejects(Buffer.alloc(10), /too small/)
  const good = makeBoxStl()
  rejects(good.subarray(0, good.length - 7), /corrupted/)
  rejects(Buffer.concat([good, Buffer.alloc(3)]), /corrupted/)
})

test('rejects ASCII STL', () => {
  const ascii = Buffer.from('solid test\n' + ' facet normal 0 0 1\n  outer loop\n   vertex 0 0 0\n   vertex 1 0 0\n   vertex 0 1 0\n  endloop\n endfacet\n'.repeat(8) + 'endsolid test\n')
  rejects(ascii, /ASCII STL/)
})

test('rejects non-finite numbers, out-of-range coordinates, flat or oversized models', () => {
  const nan = makeBoxStl()
  nan.writeFloatLE(NaN, 84 + 12)
  rejects(nan, /invalid numbers|outside the printable range/)
  rejects(makeBoxStl({ offset: 5000 }), /outside the printable range/)
  rejects(makeBoxStl({ z: 0.05 }), /too thin or flat/)
  rejects(makeBoxStl({ x: 700 }), /larger than the maximum/)
  rejects(makeBoxStl({ z: 150 }), /larger than the maximum/)
})

test('a tampered triangle count is detected', () => {
  const tampered = makeBoxStl()
  tampered.writeUInt32LE(13, 80)
  rejects(tampered, /corrupted/)
})

test('sha256 is stable and content-sensitive', () => {
  const a = makeBoxStl()
  assert.equal(sha256Hex(a), sha256Hex(Buffer.from(a)))
  assert.match(sha256Hex(a), /^[0-9a-f]{64}$/)
  assert.notEqual(sha256Hex(a), sha256Hex(makeBoxStl({ x: 41 })))
})

test('PNG validation: signature, IHDR and dimensions', () => {
  assert.deepEqual(validatePng(makePng(640, 480)), { width: 640, height: 480 })
  rejects(Buffer.from('GIF89a' + 'x'.repeat(40)), /must be a PNG/, validatePng)
  rejects(makePng(10, 10), /dimensions/, validatePng)
  rejects(makePng(9000, 480), /dimensions/, validatePng)
  const noIhdr = makePng()
  noIhdr.write('JUNK', 12, 'ascii')
  rejects(noIhdr, /malformed/, validatePng)
  rejects('nope', /must be a PNG/, validatePng)
})
