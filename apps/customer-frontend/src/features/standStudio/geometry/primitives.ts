import * as THREE from 'three';
import type { BaseShape } from '../types/design';

/**
 * Creates a 2D rounded rectangle centered at (0, 0).
 */
export function createRoundedRectShape(
  width: number,
  depth: number,
  radius: number
): THREE.Shape {
  const hw = width / 2;
  const hd = depth / 2;
  const r = Math.min(Math.max(0.2, radius), hw - 0.5, hd - 0.5);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return shape;
}

export function createChamferedRectShape(
  width: number,
  depth: number,
  chamfer: number
): THREE.Shape {
  const hw = width / 2;
  const hd = depth / 2;
  const c = Math.min(Math.max(1, chamfer), hw * 0.45, hd * 0.45);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + c, -hd);
  shape.lineTo(hw - c, -hd);
  shape.lineTo(hw, -hd + c);
  shape.lineTo(hw, hd - c);
  shape.lineTo(hw - c, hd);
  shape.lineTo(-hw + c, hd);
  shape.lineTo(-hw, hd - c);
  shape.lineTo(-hw, -hd + c);
  shape.closePath();
  return shape;
}

export function createBasePlateShape(
  width: number,
  depth: number,
  cornerRadius: number,
  baseShape: BaseShape
): THREE.Shape {
  if (baseShape === 'stadium') {
    const r = Math.min(width, depth) * 0.48;
    return createRoundedRectShape(width, depth, r);
  }
  if (baseShape === 'chamfered') {
    return createChamferedRectShape(width, depth, Math.max(4, cornerRadius * 1.1));
  }
  if (baseShape === 'hexagonal') {
    return createChamferedRectShape(width, depth, Math.min(width, depth) * 0.25);
  }
  return createRoundedRectShape(width, depth, cornerRadius);
}

/**
 * Extrudes a 2D XZ footprint upward along +Y starting at y = 0.
 */
export function extrudeFootprintUp(
  shape: THREE.Shape,
  height: number,
  bevelSize = 0.6,
  curveSegments = 16
): THREE.BufferGeometry {
  const safeBevel = Math.min(bevelSize, height * 0.22);
  const extrudeDepth = Math.max(0.5, height - safeBevel * 2);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: safeBevel > 0.05,
    bevelThickness: safeBevel,
    bevelSize: safeBevel,
    bevelSegments: 2,
    curveSegments,
  });
  // ExtrudeGeometry extrudes along +Z from 0..depth (plus bevel -safeBevel..depth+safeBevel).
  // Rotate -90° around X so local Z becomes +Y (upward) and local Y becomes -Z.
  geom.rotateX(-Math.PI / 2);
  geom.computeBoundingBox();
  if (geom.boundingBox) {
    geom.translate(0, -geom.boundingBox.min.y, 0);
  }
  geom.computeVertexNormals();
  return geom;
}

export function createPolygonShape(
  radius: number,
  sides: number,
  rotationOffset = 0
): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < sides; i++) {
    const a = rotationOffset + (i / sides) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function createCirclePath(radius: number, clockwise = true): THREE.Path {
  const path = new THREE.Path();
  path.absarc(0, 0, radius, 0, Math.PI * 2, clockwise);
  return path;
}

/**
 * Creates a hollow cylindrical/polygonal vessel resting at y = 0.
 */
export function createHollowCupGeometry(options: {
  outerRadius: number;
  wallThickness: number;
  bottomThickness: number;
  height: number;
  sides: number;
  bevel?: number;
}): THREE.BufferGeometry {
  const { outerRadius, wallThickness, bottomThickness, height, sides, bevel = 0.6 } = options;
  const innerRadius = Math.max(4, outerRadius - wallThickness);

  // Bottom solid disc
  const baseShape =
    sides >= 32
      ? (() => {
          const s = new THREE.Shape();
          s.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
          return s;
        })()
      : createPolygonShape(outerRadius, sides, sides === 4 ? Math.PI / 4 : 0);

  const bottomGeom = extrudeFootprintUp(baseShape, bottomThickness + 0.5, bevel, sides >= 32 ? 32 : 8);

  // Hollow wall ring
  const wallShape =
    sides >= 32
      ? (() => {
          const s = new THREE.Shape();
          s.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
          return s;
        })()
      : createPolygonShape(outerRadius, sides, sides === 4 ? Math.PI / 4 : 0);

  const hole =
    sides >= 32
      ? createCirclePath(innerRadius, true)
      : (() => {
          const p = new THREE.Path();
          for (let i = sides - 1; i >= 0; i--) {
            const a = (sides === 4 ? Math.PI / 4 : 0) + (i / sides) * Math.PI * 2;
            const x = Math.cos(a) * innerRadius;
            const y = Math.sin(a) * innerRadius;
            if (i === sides - 1) p.moveTo(x, y);
            else p.lineTo(x, y);
          }
          p.closePath();
          return p;
        })();

  wallShape.holes.push(hole);

  const wallHeight = Math.max(4, height - bottomThickness);
  const wallGeom = extrudeFootprintUp(wallShape, wallHeight, Math.min(bevel, wallThickness * 0.2), sides >= 32 ? 32 : 8);
  wallGeom.translate(0, bottomThickness, 0);

  return mergePair(bottomGeom, wallGeom);
}

/**
 * Creates a ribbed or spiral fluted hollow cup with sinusoidal radial modulation.
 */
export function createFlutedCupGeometry(options: {
  outerRadius: number;
  wallThickness: number;
  bottomThickness: number;
  height: number;
  ribCount: number;
  ribDepth: number;
  spiralTurns: number;
}): THREE.BufferGeometry {
  const {
    outerRadius,
    wallThickness,
    bottomThickness,
    height,
    ribCount,
    ribDepth,
    spiralTurns,
  } = options;
  const innerRadius = Math.max(4, outerRadius - wallThickness);
  const radialSegs = Math.max(48, ribCount * 4);
  const heightSegs = spiralTurns > 0 ? 28 : 4;

  // Build watertight closed-ring BufferGeometry explicitly
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const rings = heightSegs + 1;
  const cols = radialSegs;

  // Vertex rings: outer (0..rings-1), inner (rings..2*rings-1), plus bottom center & inner floor center
  const getOuterPoint = (rIdx: number, cIdx: number) => {
    const v = rIdx / heightSegs;
    const y = v * height;
    const theta = (cIdx / cols) * Math.PI * 2;
    const twist = v * spiralTurns * Math.PI * 2;
    const amp = ribDepth * Math.sin(ribCount * (theta + twist));
    // Taper ribs slightly at bottom 3mm for clean bed adhesion
    const bedBlend = Math.min(1, y / 4);
    const rad = outerRadius + amp * bedBlend;
    return [Math.cos(theta) * rad, y, Math.sin(theta) * rad];
  };

  // Outer wall vertices: rows 0..heightSegs, cols 0..cols
  for (let r = 0; r <= heightSegs; r++) {
    for (let c = 0; c <= cols; c++) {
      const [x, y, z] = getOuterPoint(r, c % cols);
      positions.push(x, y, z);
      uvs.push(c / cols, r / heightSegs);
    }
  }

  // Inner wall vertices: rows 0..heightSegs (y from bottomThickness..height)
  const innerStart = (heightSegs + 1) * (cols + 1);
  for (let r = 0; r <= heightSegs; r++) {
    const v = r / heightSegs;
    const y = bottomThickness + v * (height - bottomThickness);
    for (let c = 0; c <= cols; c++) {
      const theta = (c / cols) * Math.PI * 2;
      positions.push(Math.cos(theta) * innerRadius, y, Math.sin(theta) * innerRadius);
      uvs.push(c / cols, v);
    }
  }

  // Center vertices for bottom cap (y=0) and interior floor (y=bottomThickness)
  const bottomCenterIdx = positions.length / 3;
  positions.push(0, 0, 0);
  uvs.push(0.5, 0.5);

  const floorCenterIdx = positions.length / 3;
  positions.push(0, bottomThickness, 0);
  uvs.push(0.5, 0.5);

  const stride = cols + 1;

  // Outer surface triangles
  for (let r = 0; r < heightSegs; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * stride + c;
      const b = a + 1;
      const d = (r + 1) * stride + c;
      const e = d + 1;
      indices.push(a, d, b);
      indices.push(b, d, e);
    }
  }

  // Inner surface triangles (facing inward)
  for (let r = 0; r < heightSegs; r++) {
    for (let c = 0; c < cols; c++) {
      const a = innerStart + r * stride + c;
      const b = a + 1;
      const d = innerStart + (r + 1) * stride + c;
      const e = d + 1;
      indices.push(a, b, d);
      indices.push(b, e, d);
    }
  }

  // Top rim connecting outer top ring to inner top ring
  const outerTop = heightSegs * stride;
  const innerTop = innerStart + heightSegs * stride;
  for (let c = 0; c < cols; c++) {
    const o1 = outerTop + c;
    const o2 = outerTop + c + 1;
    const i1 = innerTop + c;
    const i2 = innerTop + c + 1;
    indices.push(o1, i1, o2);
    indices.push(o2, i1, i2);
  }

  // Bottom cap (facing -Y)
  for (let c = 0; c < cols; c++) {
    indices.push(bottomCenterIdx, c, c + 1);
  }

  // Interior floor (facing +Y)
  for (let c = 0; c < cols; c++) {
    indices.push(floorCenterIdx, innerStart + c + 1, innerStart + c);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Helper to merge two BufferGeometries cleanly with identical attributes.
 */
function mergePair(a: THREE.BufferGeometry, b: THREE.BufferGeometry): THREE.BufferGeometry {
  const ga = a.index ? a.toNonIndexed() : a.clone();
  const gb = b.index ? b.toNonIndexed() : b.clone();
  a.dispose();
  b.dispose();

  const posA = ga.attributes.position.array as Float32Array;
  const posB = gb.attributes.position.array as Float32Array;
  const normA = ga.attributes.normal.array as Float32Array;
  const normB = gb.attributes.normal.array as Float32Array;
  const uvA = ga.attributes.uv?.array as Float32Array | undefined;
  const uvB = gb.attributes.uv?.array as Float32Array | undefined;

  const pos = new Float32Array(posA.length + posB.length);
  pos.set(posA, 0);
  pos.set(posB, posA.length);

  const norm = new Float32Array(normA.length + normB.length);
  norm.set(normA, 0);
  norm.set(normB, normA.length);

  const totalVerts = pos.length / 3;
  const uv = new Float32Array(totalVerts * 2);
  if (uvA) uv.set(uvA, 0);
  if (uvB) uv.set(uvB, posA.length / 3 * 2);

  ga.dispose();
  gb.dispose();

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingBox();
  return out;
}
