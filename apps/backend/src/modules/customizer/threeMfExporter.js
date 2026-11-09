import { zipSync, strToU8 } from 'fflate'

const COLOR_GROUP_ID = 10

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] ?? character)
}

function normalizeColor(color) {
  const normalized = String(color ?? '#C5A572').trim().toUpperCase()
  if (/^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/.test(normalized)) return normalized
  return '#C5A572'
}

/**
 * Parses an STL binary buffer into a deduplicated vertex/index mesh.
 * @param {Buffer} buffer
 * @returns {{ positions: Float32Array, indices: Uint32Array }}
 */
export function parseStlToMesh(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 84) {
    throw new Error('Invalid binary STL buffer: too short')
  }

  const triangleCount = buffer.readUInt32LE(80)
  if (buffer.length < 84 + triangleCount * 50) {
    throw new Error('Invalid binary STL buffer: length does not match triangle count')
  }

  const vertexMap = new Map()
  const positions = []
  const indices = new Uint32Array(triangleCount * 3)

  let nextIndex = 0
  for (let i = 0; i < triangleCount; i++) {
    const offset = 84 + i * 50
    for (let v = 0; v < 3; v++) {
      const vOffset = offset + 12 + v * 12
      const x = buffer.readFloatLE(vOffset)
      const y = buffer.readFloatLE(vOffset + 4)
      const z = buffer.readFloatLE(vOffset + 8)

      // Quantize to 4 decimal places (0.1 micron) to cleanly merge coincident vertices
      const key = `${Math.round(x * 10000) / 10000},${Math.round(y * 10000) / 10000},${Math.round(z * 10000) / 10000}`
      let idx = vertexMap.get(key)
      if (idx === undefined) {
        idx = nextIndex++
        vertexMap.set(key, idx)
        positions.push(x, y, z)
      }
      indices[i * 3 + v] = idx
    }
  }

  return {
    positions: new Float32Array(positions),
    indices,
  }
}

/**
 * Builds a valid 3MF archive Buffer from an STL binary buffer and metadata.
 * @param {Buffer} stlBuffer - The stored binary STL
 * @param {string} [title] - Name or title of the custom design
 * @param {string} [colorHex] - Hex color code (e.g. #D4AF37)
 * @returns {Buffer} The 3MF ZIP archive
 */
export function exportThreeMfFromStl(stlBuffer, title = 'Custom Design', colorHex = '#C5A572') {
  const mesh = parseStlToMesh(stlBuffer)
  const color = normalizeColor(colorHex)
  const partName = escapeXml(title || 'Custom Design')

  let vertices = ''
  for (let index = 0; index < mesh.positions.length; index += 3) {
    vertices += `<vertex x="${mesh.positions[index].toFixed(6)}" y="${mesh.positions[index + 1].toFixed(6)}" z="${mesh.positions[index + 2].toFixed(6)}"/>`
  }

  let triangles = ''
  for (let index = 0; index < mesh.indices.length; index += 3) {
    triangles += `<triangle v1="${mesh.indices[index]}" v2="${mesh.indices[index + 1]}" v3="${mesh.indices[index + 2]}"/>`
  }

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${partName}</metadata>
  <metadata name="Description">Giftora 3D Custom Design Model</metadata>
  <resources>
    <basematerials id="${COLOR_GROUP_ID}">
      <base name="${partName}" displaycolor="${color}"/>
    </basematerials>
    <object id="1" type="model" name="${partName}" pid="${COLOR_GROUP_ID}" pindex="0">
      <mesh>
        <vertices>${vertices}</vertices>
        <triangles>${triangles}</triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>`

  const files = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
  <Override PartName="/3D/3dmodel.model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`),
    '3D/3dmodel.model': strToU8(modelXml),
  }

  const zipped = zipSync(files)
  return Buffer.from(zipped.buffer, zipped.byteOffset, zipped.byteLength)
}
