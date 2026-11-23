import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesignFromTemplate } from '../data/templates';
import { generateStandGeometry } from '../geometry/standGeometry';
import { validateManifoldGeometry } from '../geometry/manifoldValidator';

test('validateManifoldGeometry verifies base and body geometry are manifold with no degenerates', () => {
  const design = createDesignFromTemplate('classic_upright');
  const parts = generateStandGeometry(design);

  assert.ok(parts.base, 'Pedestal base exists');
  const baseReport = validateManifoldGeometry(parts.base);
  assert.equal(baseReport.isManifold, true, 'Base must be 2-manifold (no edges shared by >2 faces)');
  assert.equal(baseReport.degenerateTriangleCount, 0, 'Base must have 0 degenerate triangles');
  assert.ok(baseReport.triangleCount > 0, 'Base must have positive triangle count');

  assert.ok(parts.body, 'Stand body exists');
  const bodyReport = validateManifoldGeometry(parts.body);
  assert.equal(bodyReport.isManifold, true, 'Body must be 2-manifold');
  assert.equal(bodyReport.degenerateTriangleCount, 0, 'Body must have 0 degenerate triangles');
  assert.ok(bodyReport.triangleCount > 0, 'Body must have positive triangle count');
});

test('validateManifoldGeometry checks QR modules in raised mode have clean non-degenerate faces', () => {
  const design = createDesignFromTemplate('classic_upright');
  design.printingMode = 'raised';
  const parts = generateStandGeometry(design);

  assert.ok(parts.qrModules, 'QR modules exist');
  const qrReport = validateManifoldGeometry(parts.qrModules);
  assert.equal(qrReport.degenerateTriangleCount, 0, 'QR modules must have 0 degenerate triangles');
  assert.ok(qrReport.triangleCount >= 100, 'QR modules must contain proper extruded module triangles');
});
