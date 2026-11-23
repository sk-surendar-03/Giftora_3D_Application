import * as THREE from 'three';
import JSZip from 'jszip';

export type ExportFormatId = 'stl_binary' | 'stl_ascii' | '3mf' | 'obj' | 'ply' | 'glb';

export interface ExportFormatInfo {
  id: ExportFormatId;
  name: string;
  extension: string;
  mimeType: string;
  badge: string;
  description: string;
  compatibleWith: string;
}

export const EXPORT_FORMATS: ExportFormatInfo[] = [
  {
    id: 'stl_binary',
    name: 'Binary STL',
    extension: 'stl',
    mimeType: 'application/sla',
    badge: 'Standard Slicer',
    description: 'Compact IEEE 754 binary triangle mesh for fast slicing.',
    compatibleWith: 'Cura, PrusaSlicer, Bambu Studio, Anycubic, Simplify3D',
  },
  {
    id: '3mf',
    name: '3MF Manufacturing Package',
    extension: '3mf',
    mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
    badge: 'Modern Multi-Part',
    description: 'Next-gen 3D printing format storing unit scale (mm), metadata & multi-part assemblies.',
    compatibleWith: 'Bambu Studio, OrcaSlicer, PrusaSlicer, UltiMaker Cura',
  },
  {
    id: 'obj',
    name: 'Wavefront OBJ',
    extension: 'obj',
    mimeType: 'text/plain',
    badge: 'Universal CAD / 3D',
    description: 'Industry-wide 3D geometry format with vertex positions, UV coordinates, and normals.',
    compatibleWith: 'Blender, Maya, ZBrush, Rhino, Cinema 4D, Fusion 360',
  },
  {
    id: 'glb',
    name: 'GLB (Binary glTF 2.0)',
    extension: 'glb',
    mimeType: 'model/gltf-binary',
    badge: 'Web / AR / Viewer',
    description: 'Self-contained 3D scene asset with PBR material appearance for 3D viewers & AR.',
    compatibleWith: 'Windows 3D Viewer, macOS QuickLook, Blender, WebXR',
  },
  {
    id: 'ply',
    name: 'Stanford PLY Mesh',
    extension: 'ply',
    mimeType: 'text/plain',
    badge: 'Mesh Inspection',
    description: 'Polygon File Format for mesh analysis, point cloud inspection, and remeshing.',
    compatibleWith: 'MeshLab, CloudCompare, Blender, Gom Inspect',
  },
  {
    id: 'stl_ascii',
    name: 'ASCII STL',
    extension: 'stl',
    mimeType: 'text/plain',
    badge: 'Legacy CAD',
    description: 'Human-readable text STL format for legacy CAD importers and script inspection.',
    compatibleWith: 'AutoCAD, SolidWorks, FreeCAD, OpenSCAD',
  },
];

/**
 * Helper to extract indexed vertices and triangles from any BufferGeometry.
 * Ensures compact vertex list and consistent normals.
 */
function extractIndexedMeshData(geometry: THREE.BufferGeometry) {
  const geo = geometry.clone();
  if (!geo.getAttribute('normal')) {
    geo.computeVertexNormals();
  }
  const posAttr = geo.getAttribute('position');
  const normAttr = geo.getAttribute('normal');
  const uvAttr = geo.getAttribute('uv');
  const indexAttr = geo.getIndex();

  if (!posAttr) {
    throw new Error('Geometry has no position attribute');
  }

  const vertexCount = posAttr.count;
  const triangleIndices: number[] = [];

  if (indexAttr) {
    for (let i = 0; i < indexAttr.count; i++) {
      triangleIndices.push(indexAttr.getX(i));
    }
  } else {
    for (let i = 0; i < vertexCount; i++) {
      triangleIndices.push(i);
    }
  }

  return {
    posAttr,
    normAttr,
    uvAttr,
    vertexCount,
    triangleIndices,
    triangleCount: Math.floor(triangleIndices.length / 3),
    dispose: () => geo.dispose(),
  };
}

/**
 * 1. Binary STL (.stl)
 */
export function exportGeometryToBinarySTL(
  geometry: THREE.BufferGeometry,
  headerTitle: string = 'Stark Print Photo 3D Studio - Binary STL'
): ArrayBuffer {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  nonIndexed.computeVertexNormals();

  const posAttr = nonIndexed.getAttribute('position');
  if (!posAttr) {
    throw new Error('Geometry has no position attribute');
  }

  const triangleCount = Math.floor(posAttr.count / 3);
  const bufferLength = 80 + 4 + triangleCount * 50;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const dataView = new DataView(arrayBuffer);

  const cleanHeader = headerTitle.slice(0, 79).padEnd(80, ' ');
  for (let i = 0; i < 80; i++) {
    dataView.setUint8(i, cleanHeader.charCodeAt(i));
  }

  dataView.setUint32(80, triangleCount, true);

  let offset = 84;
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();

  for (let i = 0; i < triangleCount; i++) {
    const v0 = i * 3;
    const v1 = i * 3 + 1;
    const v2 = i * 3 + 2;

    pA.fromBufferAttribute(posAttr, v0);
    pB.fromBufferAttribute(posAttr, v1);
    pC.fromBufferAttribute(posAttr, v2);

    cb.subVectors(pC, pB);
    ab.subVectors(pA, pB);
    faceNormal.crossVectors(cb, ab).normalize();

    dataView.setFloat32(offset, faceNormal.x, true);
    dataView.setFloat32(offset + 4, faceNormal.y, true);
    dataView.setFloat32(offset + 8, faceNormal.z, true);
    offset += 12;

    dataView.setFloat32(offset, pA.x, true);
    dataView.setFloat32(offset + 4, pA.y, true);
    dataView.setFloat32(offset + 8, pA.z, true);
    offset += 12;

    dataView.setFloat32(offset, pB.x, true);
    dataView.setFloat32(offset + 4, pB.y, true);
    dataView.setFloat32(offset + 8, pB.z, true);
    offset += 12;

    dataView.setFloat32(offset, pC.x, true);
    dataView.setFloat32(offset + 4, pC.y, true);
    dataView.setFloat32(offset + 8, pC.z, true);
    offset += 12;

    dataView.setUint16(offset, 0, true);
    offset += 2;
  }

  nonIndexed.dispose();
  return arrayBuffer;
}

/**
 * 2. ASCII STL (.stl)
 */
export function exportGeometryToAsciiSTL(
  geometry: THREE.BufferGeometry,
  solidName: string = 'StarkPrint_Lithophane'
): string {
  const safeSolid = solidName.replace(/\s+/g, '_');
  const { posAttr, triangleIndices, triangleCount, dispose } = extractIndexedMeshData(geometry);

  const lines: string[] = [`solid ${safeSolid}`];
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();

  for (let i = 0; i < triangleCount; i++) {
    const i0 = triangleIndices[i * 3];
    const i1 = triangleIndices[i * 3 + 1];
    const i2 = triangleIndices[i * 3 + 2];

    pA.fromBufferAttribute(posAttr, i0);
    pB.fromBufferAttribute(posAttr, i1);
    pC.fromBufferAttribute(posAttr, i2);

    cb.subVectors(pC, pB);
    ab.subVectors(pA, pB);
    faceNormal.crossVectors(cb, ab).normalize();

    lines.push(
      `  facet normal ${faceNormal.x.toFixed(6)} ${faceNormal.y.toFixed(6)} ${faceNormal.z.toFixed(6)}`,
      '    outer loop',
      `      vertex ${pA.x.toFixed(5)} ${pA.y.toFixed(5)} ${pA.z.toFixed(5)}`,
      `      vertex ${pB.x.toFixed(5)} ${pB.y.toFixed(5)} ${pB.z.toFixed(5)}`,
      `      vertex ${pC.x.toFixed(5)} ${pC.y.toFixed(5)} ${pC.z.toFixed(5)}`,
      '    endloop',
      '  endfacet'
    );
  }

  lines.push(`endsolid ${safeSolid}\n`);
  dispose();
  return lines.join('\n');
}

/**
 * 3. Wavefront OBJ (.obj)
 */
export function exportGeometryToOBJ(
  geometry: THREE.BufferGeometry,
  objectName: string = 'StarkPrint_Lithophane'
): string {
  const { posAttr, normAttr, uvAttr, vertexCount, triangleIndices, triangleCount, dispose } =
    extractIndexedMeshData(geometry);

  const lines: string[] = [
    '# Stark Print Photo 3D Studio - Wavefront OBJ Export',
    '# Units: millimeters (mm)',
    `o ${objectName.replace(/\s+/g, '_')}`,
  ];

  for (let i = 0; i < vertexCount; i++) {
    lines.push(
      `v ${posAttr.getX(i).toFixed(4)} ${posAttr.getY(i).toFixed(4)} ${posAttr.getZ(i).toFixed(4)}`
    );
  }

  const hasUV = Boolean(uvAttr && uvAttr.count === vertexCount);
  if (hasUV && uvAttr) {
    for (let i = 0; i < vertexCount; i++) {
      lines.push(`vt ${uvAttr.getX(i).toFixed(4)} ${uvAttr.getY(i).toFixed(4)}`);
    }
  }

  const hasNorm = Boolean(normAttr && normAttr.count === vertexCount);
  if (hasNorm && normAttr) {
    for (let i = 0; i < vertexCount; i++) {
      lines.push(
        `vn ${normAttr.getX(i).toFixed(4)} ${normAttr.getY(i).toFixed(4)} ${normAttr.getZ(i).toFixed(4)}`
      );
    }
  }

  for (let i = 0; i < triangleCount; i++) {
    // OBJ indices are 1-based
    const a = triangleIndices[i * 3] + 1;
    const b = triangleIndices[i * 3 + 1] + 1;
    const c = triangleIndices[i * 3 + 2] + 1;

    if (hasUV && hasNorm) {
      lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`);
    } else if (hasNorm) {
      lines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
    } else {
      lines.push(`f ${a} ${b} ${c}`);
    }
  }

  dispose();
  return lines.join('\n') + '\n';
}

/**
 * 4. Stanford PLY (.ply)
 */
export function exportGeometryToPLY(
  geometry: THREE.BufferGeometry,
  comment: string = 'Stark Print Photo 3D Studio - Millimeter Scale'
): string {
  const { posAttr, normAttr, vertexCount, triangleIndices, triangleCount, dispose } =
    extractIndexedMeshData(geometry);

  const hasNorm = Boolean(normAttr && normAttr.count === vertexCount);

  const headerLines = [
    'ply',
    'format ascii 1.0',
    `comment ${comment}`,
    `element vertex ${vertexCount}`,
    'property float x',
    'property float y',
    'property float z',
  ];

  if (hasNorm) {
    headerLines.push('property float nx', 'property float ny', 'property float nz');
  }

  headerLines.push(
    `element face ${triangleCount}`,
    'property list uchar int vertex_indices',
    'end_header'
  );

  const bodyLines: string[] = [];
  for (let i = 0; i < vertexCount; i++) {
    const vx = posAttr.getX(i).toFixed(4);
    const vy = posAttr.getY(i).toFixed(4);
    const vz = posAttr.getZ(i).toFixed(4);
    if (hasNorm && normAttr) {
      const nx = normAttr.getX(i).toFixed(4);
      const ny = normAttr.getY(i).toFixed(4);
      const nz = normAttr.getZ(i).toFixed(4);
      bodyLines.push(`${vx} ${vy} ${vz} ${nx} ${ny} ${nz}`);
    } else {
      bodyLines.push(`${vx} ${vy} ${vz}`);
    }
  }

  for (let i = 0; i < triangleCount; i++) {
    const i0 = triangleIndices[i * 3];
    const i1 = triangleIndices[i * 3 + 1];
    const i2 = triangleIndices[i * 3 + 2];
    bodyLines.push(`3 ${i0} ${i1} ${i2}`);
  }

  dispose();
  return headerLines.join('\n') + '\n' + bodyLines.join('\n') + '\n';
}

/**
 * 5. 3D Manufacturing Format (.3mf)
 * Generates an Open Packaging Conventions ZIP archive containing:
 * - [Content_Types].xml
 * - _rels/.rels
 * - 3D/3dmodel.model (XML mesh with unit="millimeter" and multi-object build items)
 */
export async function exportGeometryTo3MF(
  parts: { name: string; geometry: THREE.BufferGeometry }[],
  title: string = 'Stark Print Lithophane Lamp'
): Promise<Blob> {
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

  const objectsXml: string[] = [];
  const buildItemsXml: string[] = [];

  parts.forEach((part, idx) => {
    const objectId = idx + 1;
    const { posAttr, vertexCount, triangleIndices, triangleCount, dispose } =
      extractIndexedMeshData(part.geometry);

    const verticesLines: string[] = [];
    for (let i = 0; i < vertexCount; i++) {
      verticesLines.push(
        `          <vertex x="${posAttr.getX(i).toFixed(4)}" y="${posAttr.getY(i).toFixed(4)}" z="${posAttr.getZ(i).toFixed(4)}" />`
      );
    }

    const trianglesLines: string[] = [];
    for (let i = 0; i < triangleCount; i++) {
      const v1 = triangleIndices[i * 3];
      const v2 = triangleIndices[i * 3 + 1];
      const v3 = triangleIndices[i * 3 + 2];
      trianglesLines.push(`          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`);
    }

    const safeName = part.name.replace(/[<>&"']/g, '');
    objectsXml.push(`    <object id="${objectId}" name="${safeName}" type="model">
      <mesh>
        <vertices>
${verticesLines.join('\n')}
        </vertices>
        <triangles>
${trianglesLines.join('\n')}
        </triangles>
      </mesh>
    </object>`);

    buildItemsXml.push(`    <item objectid="${objectId}" />`);
    dispose();
  });

  const safeTitle = title.replace(/[<>&"']/g, '');
  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${safeTitle}</metadata>
  <metadata name="Application">Stark Print Photo 3D Studio</metadata>
  <metadata name="CreationDate">${new Date().toISOString()}</metadata>
  <resources>
${objectsXml.join('\n')}
  </resources>
  <build>
${buildItemsXml.join('\n')}
  </build>
</model>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.folder('_rels')?.file('.rels', relsXml);
  zip.folder('3D')?.file('3dmodel.model', modelXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
  });
}

/**
 * 6. Binary glTF 2.0 (.glb)
 * Self-contained binary glTF 2.0 builder that works identically in browser & Node.js.
 */
export function exportGeometryToGLB(
  parts: { name: string; geometry: THREE.BufferGeometry; colorHex?: string }[]
): ArrayBuffer {
  const bufferViews: any[] = [];
  const accessors: any[] = [];
  const meshes: any[] = [];
  const nodes: any[] = [];
  const materials: any[] = [];
  const binaryChunks: Uint8Array[] = [];
  let byteOffset = 0;

  parts.forEach((part) => {
    const { posAttr, normAttr, vertexCount, triangleIndices, dispose } =
      extractIndexedMeshData(part.geometry);

    // Positions Float32Array
    const positions = new Float32Array(vertexCount * 3);
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }

    // Normals Float32Array
    const normals = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      normals[i * 3] = normAttr ? normAttr.getX(i) : 0;
      normals[i * 3 + 1] = normAttr ? normAttr.getY(i) : 0;
      normals[i * 3 + 2] = normAttr ? normAttr.getZ(i) : 1;
    }

    // Indices Uint32Array
    const indices = new Uint32Array(triangleIndices);

    const posBytes = new Uint8Array(positions.buffer);
    const normBytes = new Uint8Array(normals.buffer);
    const idxBytes = new Uint8Array(indices.buffer);

    // BufferView 0: Positions
    const posViewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: posBytes.byteLength,
      target: 34962, // ARRAY_BUFFER
    });
    binaryChunks.push(posBytes);
    byteOffset += posBytes.byteLength;

    // Accessor 0: Positions
    const posAccessorIndex = accessors.length;
    accessors.push({
      bufferView: posViewIndex,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: vertexCount,
      type: 'VEC3',
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    });

    // BufferView 1: Normals
    const normViewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: normBytes.byteLength,
      target: 34962,
    });
    binaryChunks.push(normBytes);
    byteOffset += normBytes.byteLength;

    // Accessor 1: Normals
    const normAccessorIndex = accessors.length;
    accessors.push({
      bufferView: normViewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: 'VEC3',
    });

    // BufferView 2: Indices
    const idxViewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: idxBytes.byteLength,
      target: 34963, // ELEMENT_ARRAY_BUFFER
    });
    binaryChunks.push(idxBytes);
    byteOffset += idxBytes.byteLength;

    // Accessor 2: Indices
    const idxAccessorIndex = accessors.length;
    accessors.push({
      bufferView: idxViewIndex,
      byteOffset: 0,
      componentType: 5125, // UNSIGNED_INT
      count: indices.length,
      type: 'SCALAR',
    });

    // Material
    const col = new THREE.Color(part.colorHex || '#fffaf0');
    const matIndex = materials.length;
    materials.push({
      name: `${part.name}_Material`,
      pbrMetallicRoughness: {
        baseColorFactor: [col.r, col.g, col.b, 1.0],
        metallicFactor: 0.05,
        roughnessFactor: 0.4,
      },
      doubleSided: true,
    });

    const meshIndex = meshes.length;
    meshes.push({
      name: part.name,
      primitives: [
        {
          attributes: {
            POSITION: posAccessorIndex,
            NORMAL: normAccessorIndex,
          },
          indices: idxAccessorIndex,
          material: matIndex,
        },
      ],
    });

    nodes.push({
      name: part.name,
      mesh: meshIndex,
    });

    dispose();
  });

  // Pad binary buffer to 4-byte alignment
  const binPad = (4 - (byteOffset % 4)) % 4;
  const totalBinLength = byteOffset + binPad;

  const gltfJson = {
    asset: {
      version: '2.0',
      generator: 'Stark Print Photo 3D Studio',
    },
    scene: 0,
    scenes: [
      {
        name: 'StarkPrint_Lamp_Scene',
        nodes: nodes.map((_, i) => i),
      },
    ],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [
      {
        byteLength: totalBinLength,
      },
    ],
  };

  const jsonString = JSON.stringify(gltfJson);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonString);
  const jsonPad = (4 - (jsonBytes.byteLength % 4)) % 4;
  const paddedJsonLength = jsonBytes.byteLength + jsonPad;

  // GLB total length: 12-byte header + (8 + paddedJsonLength) + (8 + totalBinLength)
  const totalLength = 12 + 8 + paddedJsonLength + 8 + totalBinLength;
  const glbBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(glbBuffer);
  const outBytes = new Uint8Array(glbBuffer);

  // 12-byte GLB Header
  view.setUint32(0, 0x46546c67, true); // 'glTF' magic
  view.setUint32(4, 2, true); // version 2
  view.setUint32(8, totalLength, true);

  // Chunk 0: JSON
  let ptr = 12;
  view.setUint32(ptr, paddedJsonLength, true);
  view.setUint32(ptr + 4, 0x4e4f534a, true); // 'JSON'
  ptr += 8;
  outBytes.set(jsonBytes, ptr);
  for (let i = 0; i < jsonPad; i++) {
    outBytes[ptr + jsonBytes.byteLength + i] = 0x20; // space padding
  }
  ptr += paddedJsonLength;

  // Chunk 1: BIN
  view.setUint32(ptr, totalBinLength, true);
  view.setUint32(ptr + 4, 0x004e4942, true); // 'BIN\0'
  ptr += 8;
  for (const chunk of binaryChunks) {
    outBytes.set(chunk, ptr);
    ptr += chunk.byteLength;
  }

  return glbBuffer;
}

/**
 * Initiates browser file download for a binary or text Blob
 */
export function triggerFileDownload(
  data: BlobPart,
  filename: string,
  mimeType: string = 'application/octet-stream'
) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads a single geometry in the chosen format
 */
export async function downloadGeometryInFormat(
  geometry: THREE.BufferGeometry,
  baseFilename: string,
  format: ExportFormatId,
  partColorHex?: string
): Promise<string> {
  const cleanBase = baseFilename.replace(/\.(stl|obj|3mf|ply|glb)$/i, '');

  switch (format) {
    case 'stl_binary': {
      const buf = exportGeometryToBinarySTL(geometry, `StarkPrint - ${cleanBase}`);
      const filename = `${cleanBase}.stl`;
      triggerFileDownload(buf, filename, 'application/sla');
      return filename;
    }
    case 'stl_ascii': {
      const ascii = exportGeometryToAsciiSTL(geometry, cleanBase);
      const filename = `${cleanBase}_ascii.stl`;
      triggerFileDownload(ascii, filename, 'text/plain');
      return filename;
    }
    case 'obj': {
      const obj = exportGeometryToOBJ(geometry, cleanBase);
      const filename = `${cleanBase}.obj`;
      triggerFileDownload(obj, filename, 'text/plain');
      return filename;
    }
    case 'ply': {
      const ply = exportGeometryToPLY(geometry, `StarkPrint - ${cleanBase}`);
      const filename = `${cleanBase}.ply`;
      triggerFileDownload(ply, filename, 'text/plain');
      return filename;
    }
    case '3mf': {
      const blob = await exportGeometryTo3MF([{ name: cleanBase, geometry }], cleanBase);
      const filename = `${cleanBase}.3mf`;
      triggerFileDownload(
        blob,
        filename,
        'application/vnd.ms-package.3dmanufacturing-3dmodel+xml'
      );
      return filename;
    }
    case 'glb': {
      const glb = exportGeometryToGLB([{ name: cleanBase, geometry, colorHex: partColorHex }]);
      const filename = `${cleanBase}.glb`;
      triggerFileDownload(glb, filename, 'model/gltf-binary');
      return filename;
    }
  }
}

/**
 * Legacy helper for direct Binary STL download
 */
export function downloadGeometrySTL(geometry: THREE.BufferGeometry, filename: string) {
  const stlBuffer = exportGeometryToBinarySTL(geometry, `StarkPrint - ${filename}`);
  triggerFileDownload(stlBuffer, filename, 'application/sla');
}
