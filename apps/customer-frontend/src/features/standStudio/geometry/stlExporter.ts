import JSZip from 'jszip';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { CostEstimate, DesignConfig, ValidationReport } from '../types/design';
import { generatePrintSettingsReadme } from '../core/estimation';
import type { GeneratedAssembly } from './standBuilder';

const stlExporter = new STLExporter();

/**
 * Converts a Three.js Y-up BufferGeometry to slicer Z-up orientation
 * with min.z = 0 (resting flat on the print bed).
 */
export function prepareGeometryForSlicerStl(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const clone = geometry.clone();
  // Rotate +90° around X: (x, y, z) -> (x, -z, y) so +Y height becomes +Z height
  clone.rotateX(Math.PI / 2);
  clone.computeBoundingBox();
  if (clone.boundingBox) {
    clone.translate(0, 0, -clone.boundingBox.min.z);
  }
  clone.computeVertexNormals();
  return clone;
}

export function exportGeometryToBinaryStl(geometry: THREE.BufferGeometry): Uint8Array {
  const oriented = prepareGeometryForSlicerStl(geometry);
  const mesh = new THREE.Mesh(oriented);
  const result = stlExporter.parse(mesh, { binary: true }) as DataView;
  oriented.dispose();
  return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
}

export function buildSafeFilename(config: DesignConfig, suffix = ''): string {
  const slugName = (config.name || 'custom-stand')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const partSuffix = suffix ? `-${suffix}` : '';
  return `starkprint-${config.category}-${slugName}${partSuffix}`;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSingleSolidStl(
  assembly: GeneratedAssembly,
  config: DesignConfig
): void {
  const bytes = exportGeometryToBinaryStl(assembly.mergedSolidGeometry);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  triggerBlobDownload(blob, `${buildSafeFilename(config)}.stl`);
}

export function downloadPartStl(
  geometry: THREE.BufferGeometry,
  config: DesignConfig,
  partId: string
): void {
  const bytes = exportGeometryToBinaryStl(geometry);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  triggerBlobDownload(blob, `${buildSafeFilename(config, partId)}.stl`);
}

/**
 * Generates a ZIP archive containing aligned multi-part STLs (preserving relative coordinates
 * so multi-extruder or multi-color slicers load them aligned), plus print settings & dimension summary.
 */
export async function buildMultiPartZipBlob(
  assembly: GeneratedAssembly,
  config: DesignConfig,
  estimate: CostEstimate,
  validation: ValidationReport
): Promise<Blob> {
  const zip = new JSZip();
  const baseFilename = buildSafeFilename(config);

  // Align all parts collectively using a shared bounding offset so relative alignment is preserved
  assembly.mergedSolidGeometry.computeBoundingBox();
  const sharedMinY = assembly.mergedSolidGeometry.boundingBox?.min.y ?? 0;

  for (const part of assembly.parts) {
    const aligned = part.geometry.clone();
    aligned.translate(0, -sharedMinY, 0);
    aligned.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(aligned);
    const dv = stlExporter.parse(mesh, { binary: true }) as DataView;
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
    aligned.dispose();
    zip.file(`${baseFilename}-${part.id}.stl`, bytes);
  }

  // Also include merged single-piece STL for convenience
  const mergedBytes = exportGeometryToBinaryStl(assembly.mergedSolidGeometry);
  zip.file(`${baseFilename}-merged-solid.stl`, mergedBytes);

  // Dimension & print settings documentation
  const readme = generatePrintSettingsReadme(
    config.name,
    estimate,
    config.print,
    validation.dimensions
  );
  zip.file('README-print-settings.txt', readme);

  const summaryJson = JSON.stringify(
    {
      name: config.name,
      category: config.category,
      dimensionsMm: validation.dimensions,
      solidVolumeCm3: estimate.solidVolumeCm3,
      estimatedWeightGrams: estimate.weightGrams,
      estimatedPrintTime: estimate.formattedPrintTime,
      parts: assembly.parts.map((p) => ({ id: p.id, name: p.name, colorZone: p.zone })),
      note: 'Standard STL files do not carry color/material metadata. Load multi-part STLs together in your slicer to assign different filament colors per part.',
    },
    null,
    2
  );
  zip.file('dimensions-summary.json', summaryJson);

  return zip.generateAsync({ type: 'blob' });
}
