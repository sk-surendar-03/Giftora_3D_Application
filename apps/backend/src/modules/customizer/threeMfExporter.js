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

function buildMeshXml(mesh, vertexOffset, colorGroupId, colorIndex) {
  let vertices = ''
  for (let i = 0; i < mesh.positions.length; i += 3) {
    vertices += `<vertex x="${mesh.positions[i].toFixed(6)}" y="${mesh.positions[i + 1].toFixed(6)}" z="${mesh.positions[i + 2].toFixed(6)}"/>`
  }
  let triangles = ''
  const props = colorIndex > 0 ? ` pid="${colorGroupId}" p1="${colorIndex}" p2="${colorIndex}" p3="${colorIndex}"` : ''
  for (let i = 0; i < mesh.indices.length; i += 3) {
    triangles += `<triangle v1="${mesh.indices[i] + vertexOffset}" v2="${mesh.indices[i + 1] + vertexOffset}" v3="${mesh.indices[i + 2] + vertexOffset}"${props}/>`
  }
  return { vertices, triangles, vertexCount: mesh.positions.length / 3, triangleCount: mesh.indices.length / 3 }
}

/**
 * Builds a valid 3MF archive Buffer from one or two STL binary buffers.
 * When reliefStlBuffer is provided, the result is a two-color 3MF:
 *   - baseMesh (index 0) uses baseColorHex
 *   - reliefMesh (index 1) uses reliefColorHex (text color)
 * Compatible with Bambu Studio, PrusaSlicer, and Cura.
 *
 * @param {Buffer} stlBuffer - Base/body STL
 * @param {string} [title]
 * @param {string} [baseColorHex]
 * @param {Buffer|null} [reliefStlBuffer] - Text/relief STL (optional)
 * @param {string} [reliefColorHex]
 * @param {string} [reliefName]
 * @returns {Buffer}
 */
export function exportThreeMfFromStl(stlBuffer, title = 'Custom Design', baseColorHex = '#C5A572', reliefStlBuffer = null, reliefColorHex = '#F5F3EE', reliefName = 'Text') {
  const baseMesh = parseStlToMesh(stlBuffer)
  const baseColor = normalizeColor(baseColorHex)
  const partName = escapeXml(title || 'Custom Design')

  const hasDualColor = reliefStlBuffer && Buffer.isBuffer(reliefStlBuffer) && reliefStlBuffer.length >= 84

  let allVertices = ''
  let allTriangles = ''
  let prusaVolumes = ''

  if (hasDualColor) {
    const reliefMesh = parseStlToMesh(reliefStlBuffer)
    const reliefColor = normalizeColor(reliefColorHex)

    const base = buildMeshXml(baseMesh, 0, COLOR_GROUP_ID, 0)
    const relief = buildMeshXml(reliefMesh, base.vertexCount, COLOR_GROUP_ID, 1)

    allVertices = base.vertices + relief.vertices
    allTriangles = base.triangles + relief.triangles

    // PrusaSlicer named volumes for color split
    prusaVolumes =
      `<volume firstid="0" lastid="${base.triangleCount - 1}">` +
      `<metadata type="volume" key="name" value="${escapeXml(partName)} (${baseColor})"/>` +
      `<metadata type="volume" key="volume_type" value="ModelPart"/></volume>` +
      `<volume firstid="${base.triangleCount}" lastid="${base.triangleCount + relief.triangleCount - 1}">` +
      `<metadata type="volume" key="name" value="${escapeXml(reliefName)} (${reliefColor})"/>` +
      `<metadata type="volume" key="volume_type" value="ModelPart"/></volume>`

    const colorGroupXml = `<m:colorgroup id="${COLOR_GROUP_ID}"><m:color color="${baseColor}"/><m:color color="${reliefColor}"/></m:colorgroup>`
    const baseMaterialsXml = `<basematerials id="11"><base name="${escapeXml(partName)}" displaycolor="${baseColor}"/><base name="${escapeXml(reliefName)}" displaycolor="${reliefColor}"/></basematerials>`

    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${partName}</metadata>
  <metadata name="Description">Giftora 3D Custom Design — Base: ${baseColor}, Text: ${reliefColor}</metadata>
  <resources>
    ${baseMaterialsXml}
    ${colorGroupXml}
    <object id="1" type="model" name="${partName}" pid="${COLOR_GROUP_ID}" pindex="0">
      <mesh>
        <vertices>${allVertices}</vertices>
        <triangles>${allTriangles}</triangles>
      </mesh>
    </object>
  </resources>
  <build><item objectid="1"/></build>
</model>`

    const prusaConfig = `<?xml version="1.0" encoding="UTF-8"?><config><object id="1" instances_count="1"><metadata type="object" key="name" value="${escapeXml(partName)}"/>${prusaVolumes}</object></config>`

    const files = {
      '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="config" ContentType="application/octet-stream"/>
  <Override PartName="/3D/3dmodel.model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`),
      '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`),
      '3D/3dmodel.model': strToU8(modelXml),
      'Metadata/Slic3r_PE_model.config': strToU8(prusaConfig),
    }
    const zipped = zipSync(files)
    return Buffer.from(zipped.buffer, zipped.byteOffset, zipped.byteLength)
  }

  // Single-color fallback (no relief STL stored)
  for (let i = 0; i < baseMesh.positions.length; i += 3) {
    allVertices += `<vertex x="${baseMesh.positions[i].toFixed(6)}" y="${baseMesh.positions[i + 1].toFixed(6)}" z="${baseMesh.positions[i + 2].toFixed(6)}"/>`
  }
  for (let i = 0; i < baseMesh.indices.length; i += 3) {
    allTriangles += `<triangle v1="${baseMesh.indices[i]}" v2="${baseMesh.indices[i + 1]}" v3="${baseMesh.indices[i + 2]}"/>`
  }

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">
  <metadata name="Title">${partName}</metadata>
  <metadata name="Description">Giftora 3D Custom Design Model</metadata>
  <resources>
    <basematerials id="${COLOR_GROUP_ID}">
      <base name="${partName}" displaycolor="${baseColor}"/>
    </basematerials>
    <object id="1" type="model" name="${partName}" pid="${COLOR_GROUP_ID}" pindex="0">
      <mesh>
        <vertices>${allVertices}</vertices>
        <triangles>${allTriangles}</triangles>
      </mesh>
    </object>
  </resources>
  <build><item objectid="1"/></build>
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
