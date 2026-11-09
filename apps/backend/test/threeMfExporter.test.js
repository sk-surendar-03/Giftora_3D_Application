import test from 'node:test'
import assert from 'node:assert/strict'
import { unzipSync } from 'fflate'
import { exportThreeMfFromStl, parseStlToMesh } from '../src/modules/customizer/threeMfExporter.js'

function createSampleBoxStl() {
  const buffer = Buffer.alloc(84 + 2 * 50)
  buffer.writeUInt32LE(2, 80) // 2 triangles

  // triangle 1
  buffer.writeFloatLE(0, 84 + 12) // v0 x
  buffer.writeFloatLE(0, 84 + 16) // v0 y
  buffer.writeFloatLE(0, 84 + 20) // v0 z
  buffer.writeFloatLE(10, 84 + 24) // v1 x
  buffer.writeFloatLE(0, 84 + 28) // v1 y
  buffer.writeFloatLE(0, 84 + 32) // v1 z
  buffer.writeFloatLE(0, 84 + 36) // v2 x
  buffer.writeFloatLE(10, 84 + 40) // v2 y
  buffer.writeFloatLE(0, 84 + 44) // v2 z

  // triangle 2 (shares vertices)
  const t2 = 84 + 50
  buffer.writeFloatLE(10, t2 + 12) // v1
  buffer.writeFloatLE(0, t2 + 16)
  buffer.writeFloatLE(0, t2 + 20)
  buffer.writeFloatLE(10, t2 + 24) // v3
  buffer.writeFloatLE(10, t2 + 28)
  buffer.writeFloatLE(0, t2 + 32)
  buffer.writeFloatLE(0, t2 + 36) // v2
  buffer.writeFloatLE(10, t2 + 40)
  buffer.writeFloatLE(0, t2 + 44)

  return buffer
}

test('threeMfExporter: parses binary STL mesh correctly', () => {
  const stl = createSampleBoxStl()
  const mesh = parseStlToMesh(stl)

  assert.equal(mesh.positions.length / 3, 4, 'deduplicates 6 triangle vertices down to 4 unique vertices')
  assert.equal(mesh.indices.length, 6, '2 triangles have 6 indices')
})

test('threeMfExporter: generates valid 3MF ZIP archive with XML model and colors', () => {
  const stl = createSampleBoxStl()
  const title = 'Alex Keychain'
  const colorHex = '#D4AF37'

  const threeMfBuffer = exportThreeMfFromStl(stl, title, colorHex)
  assert.ok(Buffer.isBuffer(threeMfBuffer), 'returns a Buffer')
  assert.ok(threeMfBuffer.length > 100, 'has reasonable file size')

  // Unzip and inspect files
  const files = unzipSync(new Uint8Array(threeMfBuffer))
  assert.ok(files['[Content_Types].xml'], 'contains [Content_Types].xml')
  assert.ok(files['_rels/.rels'], 'contains _rels/.rels')
  assert.ok(files['3D/3dmodel.model'], 'contains 3D/3dmodel.model')

  const modelXml = Buffer.from(files['3D/3dmodel.model']).toString('utf8')
  assert.ok(modelXml.includes('<metadata name="Title">Alex Keychain</metadata>'), 'includes title metadata')
  assert.ok(modelXml.includes('displaycolor="#D4AF37"'), 'includes correct display color')
  assert.ok(modelXml.includes('<vertex x="10.000000"'), 'includes model vertex')
  assert.ok(modelXml.includes('<triangle v1='), 'includes model triangles')
})
