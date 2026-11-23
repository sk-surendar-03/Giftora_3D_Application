import JSZip from 'jszip';
import * as THREE from 'three';
import { LithophaneProject, MeshValidationReport } from '../types/lithophane';
import {
  ExportFormatId,
  exportGeometryToBinarySTL,
  exportGeometryToAsciiSTL,
  exportGeometryToOBJ,
  exportGeometryToPLY,
  exportGeometryTo3MF,
  exportGeometryToGLB,
  triggerFileDownload,
} from '../geometry/stlExporter';

export interface ZipExportBundle {
  project: LithophaneProject;
  lithophaneGeo: THREE.BufferGeometry;
  baseGeo?: THREE.BufferGeometry;
  frameGeo?: THREE.BufferGeometry;
  previewDataUrl?: string;
  report: MeshValidationReport;
  preferredFormat?: ExportFormatId;
  includeAllFormats?: boolean;
}

function serializePartInFormat(
  geometry: THREE.BufferGeometry,
  partName: string,
  format: ExportFormatId
): { ext: string; data: ArrayBuffer | string | Promise<Blob> } {
  switch (format) {
    case 'stl_ascii':
      return { ext: 'ascii.stl', data: exportGeometryToAsciiSTL(geometry, partName) };
    case 'obj':
      return { ext: 'obj', data: exportGeometryToOBJ(geometry, partName) };
    case 'ply':
      return { ext: 'ply', data: exportGeometryToPLY(geometry, partName) };
    case '3mf':
      return {
        ext: '3mf',
        data: exportGeometryTo3MF([{ name: partName, geometry }], partName),
      };
    case 'glb':
      return {
        ext: 'glb',
        data: exportGeometryToGLB([{ name: partName, geometry }]),
      };
    case 'stl_binary':
    default:
      return {
        ext: 'stl',
        data: exportGeometryToBinarySTL(geometry, `StarkPrint - ${partName}`),
      };
  }
}

export async function createAndDownloadProjectZip(bundle: ZipExportBundle): Promise<void> {
  const {
    project,
    lithophaneGeo,
    baseGeo,
    frameGeo,
    previewDataUrl,
    report,
    preferredFormat = 'stl_binary',
    includeAllFormats = true,
  } = bundle;
  const zip = new JSZip();

  const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'StarkPrint_Lamp';

  const partsList: { label: string; geo: THREE.BufferGeometry; colorHex: string }[] = [
    { label: `${safeName}_Lithophane`, geo: lithophaneGeo, colorHex: '#fffaf0' },
  ];

  if (baseGeo && project.baseSettings.enabled) {
    partsList.push({ label: `${safeName}_LampBase`, geo: baseGeo, colorHex: '#1c1917' });
  }

  if (frameGeo) {
    partsList.push({ label: `${safeName}_TopCap`, geo: frameGeo, colorHex: '#292524' });
  }

  // 1. Primary Chosen Format in Root
  for (const part of partsList) {
    const serialized = serializePartInFormat(part.geo, part.label, preferredFormat);
    const resolvedData = await serialized.data;
    zip.file(`${part.label}.${serialized.ext}`, resolvedData);
  }

  // 2. Multi-Part Combined 3MF & GLB Assembly Files for 1-Click Slicer / 3D Viewer Opening
  const combined3mfBlob = await exportGeometryTo3MF(
    partsList.map((p) => ({ name: p.label, geometry: p.geo })),
    project.name
  );
  zip.file(`${safeName}_Complete_Assembly.3mf`, combined3mfBlob);

  const combinedGlbBuffer = exportGeometryToGLB(
    partsList.map((p) => ({ name: p.label, geometry: p.geo, colorHex: p.colorHex }))
  );
  zip.file(`${safeName}_Complete_Assembly.glb`, combinedGlbBuffer);

  // 3. Optional Additional Formats Subfolder for Universal Compatibility
  if (includeAllFormats) {
    const compatFolder = zip.folder('Compatibility_Formats');
    if (compatFolder) {
      for (const part of partsList) {
        if (preferredFormat !== 'stl_binary') {
          compatFolder.file(
            `${part.label}.stl`,
            exportGeometryToBinarySTL(part.geo, part.label)
          );
        }
        if (preferredFormat !== 'obj') {
          compatFolder.file(`${part.label}.obj`, exportGeometryToOBJ(part.geo, part.label));
        }
        if (preferredFormat !== 'ply') {
          compatFolder.file(`${part.label}.ply`, exportGeometryToPLY(part.geo, part.label));
        }
      }
    }
  }

  // 4. Preview snapshot PNG
  if (previewDataUrl && previewDataUrl.startsWith('data:image/')) {
    const base64Data = previewDataUrl.split(',')[1];
    zip.file(`${safeName}_Preview.png`, base64Data, { base64: true });
  }

  // 5. Project JSON specs
  const specs = {
    studio: 'Stark Print Photo 3D Studio',
    projectName: project.name,
    shape: project.shape,
    timestamp: new Date().toISOString(),
    exportedFormats: ['STL (Binary)', '3MF (Assembly)', 'OBJ (Wavefront)', 'PLY (Stanford)', 'GLB (glTF 2.0)'],
    dimensionsMm: report.dimensionsMm,
    thickness: {
      minThicknessMm: project.printSettings.minThicknessMm,
      maxThicknessMm: project.printSettings.maxThicknessMm,
      borderWidthMm: project.printSettings.borderWidthMm,
    },
    meshStats: {
      triangleCount: report.triangleCount,
      estimatedWeightGrams: report.estimatedWeightGrams,
      estimatedPrintTimeHours: report.estimatedPrintTimeHours,
      isWatertight: report.isWatertight,
    },
    ledLighting: project.lighting,
    baseSpecs: project.baseSettings,
    personalization: project.personalization,
  };
  zip.file('Project_Specifications.json', JSON.stringify(specs, null, 2));

  // 6. Maker 3D Slicer Instructions TXT
  const instructions = `======================================================
STARK PRINT PHOTO 3D STUDIO - 3D PRINTING & COMPATIBILITY GUIDE
======================================================
Model: ${project.name} (${project.shape.toUpperCase()})
Export Date: ${new Date().toLocaleDateString()}
Estimated Weight: ~${report.estimatedWeightGrams} grams
Estimated Print Time: ~${report.estimatedPrintTimeHours} hours

INCLUDED FILE FORMATS & COMPATIBILITY:
------------------------------------------------------
- .STL (Binary STL): Universal format for Cura, PrusaSlicer, Simplify3D, Anycubic.
- .3MF (3D Manufacturing Format): Multi-part project assembly with millimeter units
  and metadata for Bambu Studio, OrcaSlicer, PrusaSlicer, and UltiMaker Cura.
- .OBJ (Wavefront OBJ): Includes vertex normals & UVs for Blender, Maya, Rhino, Fusion 360.
- .PLY (Stanford Polygon): For MeshLab, CloudCompare, and 3D inspection tools.
- .GLB (Binary glTF 2.0): Full 3D scene for Windows 3D Viewer, macOS QuickLook, AR & Web.

RECOMMENDED SLICER SETTINGS (Cura / PrusaSlicer / Bambu Studio / OrcaSlicer):
------------------------------------------------------
1. ORIENTATION:
   - For Cylindrical / Moon / Lantern: Print VERTICALLY standing up on its flat rim.
     Do NOT lay flat; vertical orientation yields the highest Z-layer resolution!
   - For Rectangular Panel: Print upright on its long edge with a 4-5mm brim for bed stability.
   - For Lamp Base: Print flat on its bottom face (zero supports required).

2. LAYER HEIGHT:
   - Recommended: 0.12mm (Ultra-Fine) or 0.16mm (Standard Quality).
   - First Layer: 0.20mm for strong bed adhesion.

3. INFILL & WALLS:
   - Infill: 100% Solid (ESSENTIAL for lithophanes so light does not show infill grid patterns).
   - Perimeters/Walls: 99 walls (ensures the entire thickness is solid concentric plastic).

4. PRINT SPEED:
   - Outer wall speed: 30 - 45 mm/s.
   - Slower speeds produce cleaner layer lines and sharper photo details.

5. RECOMMENDED FILAMENTS:
   - Warm White / Cool White PLA (e.g., Overture, Sunlu, eSun, Bambu Matte White).
   - Avoid dark or opaque colored filaments for the lithophane body.
   - Lamp Base can be printed in Wood PLA, Matte Black, Galaxy Black, or Marble PLA.
======================================================
Thank you for creating with Stark Print Photo 3D Studio!
`;
  zip.file('3D_PRINTING_INSTRUCTIONS.txt', instructions);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, `${safeName}_3DPrint_Bundle.zip`, 'application/zip');
}
