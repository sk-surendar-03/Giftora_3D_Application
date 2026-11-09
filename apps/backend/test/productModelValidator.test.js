import test from 'node:test'
import assert from 'node:assert/strict'
import { zipSync, strToU8 } from 'fflate'
import { makeBoxStl } from './helpers.js'
import { exportThreeMfFromStl } from '../src/modules/customizer/threeMfExporter.js'
import { parseModelFilename, validateModelContent, MAX_MODEL_BYTES } from '../src/modules/products/productModelValidator.js'
import { serializeProduct } from '../src/modules/products/productModelService.js'

const asciiStl = Buffer.from('solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid t\n')
const rejects = (fn, status = 400) => assert.throws(fn, (e) => e.status === status)

test('filenames: .stl/.3mf accepted case-insensitively, path stripped; others rejected', () => {
  assert.deepEqual(parseModelFilename('Key.STL'), { filename: 'Key.STL', format: 'stl' })
  assert.deepEqual(parseModelFilename(String.raw`C:\x\..\a b.3MF`), { filename: 'a b.3MF', format: '3mf' })
  for (const bad of ['a.png', 'a.stl.exe', 'a', '', undefined, '.stl'.repeat(60) + '.obj']) rejects(() => parseModelFilename(bad))
})

test('binary and ASCII STL accepted', () => {
  validateModelContent('stl', makeBoxStl())
  validateModelContent('stl', asciiStl)
})

test('invalid STL rejected (truncated, random, empty, NaN)', () => {
  const stl = makeBoxStl()
  rejects(() => validateModelContent('stl', stl.subarray(0, stl.length - 10)))
  rejects(() => validateModelContent('stl', Buffer.alloc(500, 7)))
  rejects(() => validateModelContent('stl', Buffer.alloc(0)))
  rejects(() => validateModelContent('stl', Buffer.from('solid x\nnothing')))
  const nan = Buffer.from(stl); nan.writeFloatLE(NaN, 84 + 12)
  rejects(() => validateModelContent('stl', nan))
})

test('real 3MF (from the existing exporter) accepted; wrong content rejected', () => {
  const threeMf = Buffer.from(exportThreeMfFromStl(makeBoxStl(), 'Sample'))
  validateModelContent('3mf', threeMf)
  rejects(() => validateModelContent('3mf', makeBoxStl()))
  rejects(() => validateModelContent('3mf', Buffer.from(zipSync({ 'readme.txt': strToU8('hi') }))))
  rejects(() => validateModelContent('3mf', Buffer.from(zipSync({ '3D/3dmodel.model': strToU8('not xml') }))))
  rejects(() => validateModelContent('3mf', threeMf.subarray(0, 60)))
})

test('format/extension mismatch: an STL named .3mf (and vice versa) is rejected', () => {
  rejects(() => validateModelContent('3mf', makeBoxStl()))
  rejects(() => validateModelContent('stl', Buffer.from(exportThreeMfFromStl(makeBoxStl(), 'S'))))
})

test('size limit enforced with 413', () => {
  rejects(() => validateModelContent('stl', Buffer.alloc(MAX_MODEL_BYTES + 1)), 413)
})

test('serializeProduct hides the storage key and exposes a viewer URL', () => {
  const base = { id: 'p1', slug: 'my-key', name: 'K', modelKey: 'product-models/p1/abc123.stl', modelFilename: 'Key.stl', modelFormat: 'stl', modelSizeBytes: 5000 }
  const pub = serializeProduct(base)
  assert.equal(pub.modelKey, undefined); assert.equal(pub.modelFilename, undefined)
  assert.deepEqual(pub.model, { format: 'stl', sizeBytes: 5000, url: '/products/my-key/model?v=abc123' })
  assert.equal(serializeProduct(base, { admin: true }).model.filename, 'Key.stl')
  assert.equal(serializeProduct({ id: 'p2', slug: 's', modelKey: null }).model, null)
})
