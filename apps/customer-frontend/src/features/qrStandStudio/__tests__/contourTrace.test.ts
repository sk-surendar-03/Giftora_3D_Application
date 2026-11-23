import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVectorPolygons,
  extractContoursFromGrid,
  pointInPolygon,
  signedPolygonArea,
  simplifyClosedPolygon,
} from '../geometry/contourTrace';

test('extractContoursFromGrid extracts boundary loops for solid and hollow shapes', () => {
  // 7x7 grid with a 5x5 square having a 3x3 hole in the middle
  const w = 7;
  const h = 7;
  const grid = new Uint8Array(w * h);
  for (let y = 1; y <= 5; y++) {
    for (let x = 1; x <= 5; x++) {
      if (x >= 2 && x <= 4 && y >= 2 && y <= 4) continue;
      grid[y * w + x] = 1;
    }
  }

  const loops = extractContoursFromGrid(grid, w, h);
  assert.equal(loops.length, 2);

  const polys = buildVectorPolygons(loops, w, h, 1, 0.1);
  assert.equal(polys.length, 1);
  assert.equal(polys[0].holes.length, 1);
  assert.ok(signedPolygonArea(polys[0].outer) > 0);
  assert.ok(signedPolygonArea(polys[0].holes[0]) < 0);
});

test('pointInPolygon correctly identifies interior vs exterior points', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  assert.equal(pointInPolygon({ x: 5, y: 5 }, square), true);
  assert.equal(pointInPolygon({ x: -1, y: 5 }, square), false);
  assert.equal(pointInPolygon({ x: 12, y: 12 }, square), false);
});

test('simplifyClosedPolygon prunes collinear vertices without altering shape', () => {
  const line = [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  const simplified = simplifyClosedPolygon(line, 0.1);
  assert.equal(simplified.length, 4); // (5,0) removed as collinear
});
