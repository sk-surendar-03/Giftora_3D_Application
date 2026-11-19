import * as THREE from 'three';

export interface ExportMeshPart {
  name: string;
  color: string;
  geometry: THREE.BufferGeometry;
}

/**
 * Extracts world-transformed triangles from a THREE.Object3D (or list of meshes)
 * and converts Three.js Y-up preview space into standard 3D-Printer Z-up millimeter space.
 */
export function collectPrintablePartsFromGroup(root: THREE.Object3D): ExportMeshPart[] {
  root.updateWorldMatrix(true, true);
  const parts: ExportMeshPart[] = [];

  // Map Three.js (x, y, z) -> Slicer (x, -z, y) so front-facing XY or desk stand sits naturally,
  // or keep plate flat on Z=0 for flat/wall plates.
  const rotToZUp = new THREE.Matrix4().makeRotationX(Math.PI / 2);

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj.userData?.excludeFromExport) return;
    const geom = obj.geometry;
    if (!geom || !geom.attributes.position) return;

    const cloned = geom.clone();
    const nonIndexed = cloned.index ? cloned.toNonIndexed() : cloned;
    nonIndexed.applyMatrix4(obj.matrixWorld);
    nonIndexed.applyMatrix4(rotToZUp);

    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    const hex =
      mat && 'color' in mat && mat.color instanceof THREE.Color
        ? `#${mat.color.getHexString()}`
        : '#cccccc';

    const partName = String(obj.userData?.partGroup || obj.name || 'part');
    parts.push({ name: partName, color: hex, geometry: nonIndexed });
  });

  // Shift all parts together so minimum Z = 0 (flush on printer build plate)
  let minZ = Infinity;
  for (const p of parts) {
    const pos = p.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z < minZ) minZ = z;
    }
  }
  if (Number.isFinite(minZ) && Math.abs(minZ) > 1e-5) {
    for (const p of parts) {
      p.geometry.translate(0, 0, -minZ);
    }
  }

  return parts;
}

/**
 * Writes a standard Binary STL ArrayBuffer from non-indexed BufferGeometry parts.
 * Coordinates are already in millimeters.
 */
export function generateBinarySTL(parts: ExportMeshPart[]): ArrayBuffer {
  let totalTriangles = 0;
  for (const part of parts) {
    const pos = part.geometry.attributes.position;
    totalTriangles += Math.floor(pos.count / 3);
  }

  const bufferLength = 84 + totalTriangles * 50;
  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  // 80-byte ASCII header
  const headerText = 'Stark Print Customized Nameplate Studio - Binary STL (units: mm)';
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < headerText.length ? headerText.charCodeAt(i) : 32);
  }
  view.setUint32(80, totalTriangles, true);

  let offset = 84;
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();

  for (const part of parts) {
    const pos = part.geometry.attributes.position;
    for (let i = 0; i + 2 < pos.count; i += 3) {
      vA.fromBufferAttribute(pos, i);
      vB.fromBufferAttribute(pos, i + 1);
      vC.fromBufferAttribute(pos, i + 2);

      cb.subVectors(vC, vB);
      ab.subVectors(vA, vB);
      cb.cross(ab).normalize();

      // Normal
      view.setFloat32(offset, cb.x, true);
      view.setFloat32(offset + 4, cb.y, true);
      view.setFloat32(offset + 8, cb.z, true);
      // V1
      view.setFloat32(offset + 12, vA.x, true);
      view.setFloat32(offset + 16, vA.y, true);
      view.setFloat32(offset + 20, vA.z, true);
      // V2
      view.setFloat32(offset + 24, vB.x, true);
      view.setFloat32(offset + 28, vB.y, true);
      view.setFloat32(offset + 32, vB.z, true);
      // V3
      view.setFloat32(offset + 36, vC.x, true);
      view.setFloat32(offset + 40, vC.y, true);
      view.setFloat32(offset + 44, vC.z, true);
      // Attribute byte count
      view.setUint16(offset + 48, 0, true);
      offset += 50;
    }
  }

  return buffer;
}

export function disposeExportParts(parts: ExportMeshPart[]): void {
  for (const p of parts) {
    p.geometry.dispose();
  }
}
