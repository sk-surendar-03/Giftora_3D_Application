import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  generateCombinedStlBinary,
  getExportableParts,
  prepareSlicerGeometry,
} from '../core/exportManager';
import { createDesignFromTemplate } from '../data/templates';
import { generateStandGeometry } from '../geometry/standGeometry';

test('prepareSlicerGeometry rotates Three.js Y-up to Slicer Z-up and grounds Z at 0', () => {
  // Create an arbitrary box in Three.js coordinates (X=30, Y=50, Z=10)
  const box = new THREE.BoxGeometry(30, 50, 10);
  box.translate(0, 25, 0); // bottom at Y=0, top at Y=50

  const slicerBox = prepareSlicerGeometry(box);
  slicerBox.computeBoundingBox();
  const bb = slicerBox.boundingBox!;

  // Height along Z in slicer must equal original Y height (50mm)
  assert.equal(Math.round(bb.min.z), 0, 'Slicer geometry must drop flat to Z=0 on build plate');
  assert.equal(Math.round(bb.max.z - bb.min.z), 50, 'Z span in slicer matches Three.js Y height');
  assert.equal(Math.round(bb.max.x - bb.min.x), 30, 'X span remains unchanged');
  assert.equal(Math.round(bb.max.y - bb.min.y), 10, 'Y span in slicer matches original Z thickness');

  box.dispose();
  slicerBox.dispose();
});

test('generateCombinedStlBinary creates valid binary STL with 80-byte header and triangle count', () => {
  const design = createDesignFromTemplate('classic_upright');
  const parts = generateStandGeometry(design);

  const stlBytes = generateCombinedStlBinary(design, parts);
  assert.ok(stlBytes !== null, 'STL binary should be generated');
  assert.ok(stlBytes.length > 84, 'STL binary must be at least 84 bytes (80-byte header + 4-byte count)');

  const view = new DataView(stlBytes.buffer, stlBytes.byteOffset, stlBytes.byteLength);
  const triangleCount = view.getUint32(80, true);
  assert.ok(triangleCount > 50, 'STL must record triangle count matching parts');
  // Binary STL size formula: 80 bytes header + 4 bytes count + triangleCount * 50 bytes
  assert.equal(stlBytes.length, 84 + triangleCount * 50);
});

test('getExportableParts lists all individual components for multi-material slicing', () => {
  const design = createDesignFromTemplate('classic_upright');
  design.printingMode = 'inlay';
  const parts = generateStandGeometry(design);

  const exportParts = getExportableParts(design, parts);
  assert.ok(exportParts.some((p) => p.key === 'body'));
  assert.ok(exportParts.some((p) => p.key === 'base'));
  assert.ok(exportParts.some((p) => p.key === 'qrModules'));
  assert.ok(exportParts.some((p) => p.key === 'frame'));
});
