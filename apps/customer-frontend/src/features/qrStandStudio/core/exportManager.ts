import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { StandPartGeometries } from '../geometry/standGeometry';
import { mergeSafe } from '../geometry/textAndDecorations';
import type { StandDesign } from '../types/studio';

export interface NamedExportPart {
  key: keyof Pick<
    StandPartGeometries,
    'base' | 'body' | 'frame' | 'qrModules' | 'text' | 'logo' | 'decorations'
  >;
  label: string;
  filenameSuffix: string;
  color: string;
  geometry: THREE.BufferGeometry;
}

/**
 * Rotates geometry from Three.js Y-up to standard 3D slicer Z-up (X=X, Y=-Z, Z=Y)
 * and shifts min Z to 0 so it drops flat onto the slicer build plate.
 */
export function prepareSlicerGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const clone = geo.clone();
  clone.rotateX(Math.PI / 2);
  clone.computeBoundingBox();
  if (clone.boundingBox) {
    clone.translate(0, 0, -clone.boundingBox.min.z);
  }
  return clone;
}

/**
 * Generates binary STL byte array for combined parts.
 */
export function generateCombinedStlBinary(
  design: StandDesign,
  parts: StandPartGeometries
): Uint8Array | null {
  const geosToInclude: THREE.BufferGeometry[] = [];
  if (parts.base) geosToInclude.push(parts.base);
  if (parts.body) geosToInclude.push(parts.body);
  if (parts.frame) geosToInclude.push(parts.frame);
  if (parts.qrModules && design.printingMode !== 'recessed') {
    geosToInclude.push(parts.qrModules);
  }
  if (parts.text) geosToInclude.push(parts.text);
  if (parts.logo) geosToInclude.push(parts.logo);
  if (parts.decorations) geosToInclude.push(parts.decorations);

  const merged = mergeSafe(geosToInclude);
  if (!merged) return null;

  const slicerGeo = prepareSlicerGeometry(merged);
  merged.dispose();

  const mesh = new THREE.Mesh(slicerGeo);
  const exporter = new STLExporter();
  const buffer = exporter.parse(mesh, { binary: true }) as DataView;
  slicerGeo.dispose();

  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
  return bytes;
}

export function getExportableParts(
  design: StandDesign,
  parts: StandPartGeometries
): NamedExportPart[] {
  const list: NamedExportPart[] = [];
  if (parts.body) {
    list.push({
      key: 'body',
      label: 'Stand Body',
      filenameSuffix: 'body',
      color: design.colors.standColor,
      geometry: parts.body,
    });
  }
  if (parts.base) {
    list.push({
      key: 'base',
      label: 'Pedestal Base',
      filenameSuffix: 'base',
      color: design.colors.baseColor,
      geometry: parts.base,
    });
  }
  if (parts.frame) {
    list.push({
      key: 'frame',
      label: 'Border Frame',
      filenameSuffix: 'frame',
      color: design.colors.frameColor,
      geometry: parts.frame,
    });
  }
  if (parts.qrModules && design.printingMode !== 'recessed') {
    list.push({
      key: 'qrModules',
      label: design.printingMode === 'inlay' ? 'QR Inlay Modules' : 'QR Raised Modules',
      filenameSuffix: design.printingMode === 'inlay' ? 'qr-inlay' : 'qr-modules',
      color: design.colors.qrColor,
      geometry: parts.qrModules,
    });
  }
  if (parts.text) {
    list.push({
      key: 'text',
      label: '3D Lettering',
      filenameSuffix: 'text',
      color: design.colors.textColor,
      geometry: parts.text,
    });
  }
  if (parts.logo) {
    list.push({
      key: 'logo',
      label: 'Center Logo',
      filenameSuffix: 'logo',
      color: design.colors.accentColor,
      geometry: parts.logo,
    });
  }
  if (parts.decorations) {
    list.push({
      key: 'decorations',
      label: 'Decorations',
      filenameSuffix: 'decorations',
      color: design.colors.accentColor,
      geometry: parts.decorations,
    });
  }
  return list;
}

export function generateSinglePartStlBinary(part: NamedExportPart): Uint8Array {
  const slicerGeo = prepareSlicerGeometry(part.geometry);
  const mesh = new THREE.Mesh(slicerGeo);
  const exporter = new STLExporter();
  const buffer = exporter.parse(mesh, { binary: true }) as DataView;
  slicerGeo.dispose();

  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
  return bytes;
}
