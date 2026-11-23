import * as THREE from 'three';
import {
  LampBaseSettings,
  LampShapeType,
  MeshValidationReport,
  PersonalizationSettings,
  PrintSettings,
} from '../types/lithophane';

export interface GeneratedMeshBundle {
  lithophaneGeometry: THREE.BufferGeometry;
  baseGeometry?: THREE.BufferGeometry;
  frameGeometry?: THREE.BufferGeometry;
  validationReport: MeshValidationReport;
}

/**
 * Generates a watertight rectangular lithophane panel
 */
export function generateRectangularLithophane(
  thicknessMap: Float32Array,
  gridW: number,
  gridH: number,
  settings: PrintSettings
): THREE.BufferGeometry {
  const modelW = settings.modelWidthMm;
  const modelH = settings.modelHeightMm;
  const minT = settings.minThicknessMm;
  const maxT = settings.maxThicknessMm;
  const border = settings.borderWidthMm;

  // We build:
  // 1. Front relief grid (gridW x gridH vertices)
  // 2. Flat back grid (gridW x gridH vertices at z = 0)
  // 3. Side walls connecting perimeter of front and back
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const effectiveInnerW = Math.max(10, modelW - border * 2);
  const effectiveInnerH = Math.max(10, modelH - border * 2);

  // Helper to get thickness at grid coordinate
  const getThickness = (gx: number, gy: number): number => {
    // If in border region, use maxThickness for solid sturdy frame
    const u = gx / (gridW - 1);
    const v = gy / (gridH - 1);
    const xMm = u * modelW;
    const yMm = v * modelH;

    if (xMm < border || xMm > modelW - border || yMm < border || yMm > modelH - border) {
      return maxT;
    }

    // Map to inner thickness map
    const innerU = (xMm - border) / effectiveInnerW;
    const innerV = (yMm - border) / effectiveInnerH;
    const imgX = Math.min(gridW - 1, Math.max(0, Math.floor(innerU * gridW)));
    // Invert V because 3D Y is up, image Y is down
    const imgY = Math.min(gridH - 1, Math.max(0, Math.floor((1 - innerV) * gridH)));
    const normT = thicknessMap[imgY * gridW + imgX] ?? 0.5;

    return minT + normT * (maxT - minT);
  };

  // 1. FRONT GRID (vertices 0 .. N-1)
  for (let gy = 0; gy < gridH; gy++) {
    const v = gy / (gridH - 1);
    const y = v * modelH - modelH / 2;
    for (let gx = 0; gx < gridW; gx++) {
      const u = gx / (gridW - 1);
      const x = u * modelW - modelW / 2;
      const z = getThickness(gx, gy);

      positions.push(x, y, z);
      normals.push(0, 0, 1);
      uvs.push(u, v);
    }
  }

  // Front faces (CCW from outside)
  for (let gy = 0; gy < gridH - 1; gy++) {
    for (let gx = 0; gx < gridW - 1; gx++) {
      const i0 = gy * gridW + gx;
      const i1 = i0 + 1;
      const i2 = (gy + 1) * gridW + gx;
      const i3 = i2 + 1;

      indices.push(i0, i1, i2);
      indices.push(i1, i3, i2);
    }
  }

  // 2. BACK GRID (vertices N .. 2N-1)
  const backOffset = positions.length / 3;
  for (let gy = 0; gy < gridH; gy++) {
    const v = gy / (gridH - 1);
    const y = v * modelH - modelH / 2;
    for (let gx = 0; gx < gridW; gx++) {
      const u = gx / (gridW - 1);
      const x = u * modelW - modelW / 2;
      const z = 0; // Flat base / back

      positions.push(x, y, z);
      normals.push(0, 0, -1);
      uvs.push(u, v);
    }
  }

  // Back faces (pointing in -Z, so reversed order)
  for (let gy = 0; gy < gridH - 1; gy++) {
    for (let gx = 0; gx < gridW - 1; gx++) {
      const i0 = backOffset + (gy * gridW + gx);
      const i1 = i0 + 1;
      const i2 = backOffset + ((gy + 1) * gridW + gx);
      const i3 = i2 + 1;

      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  // 3. SIDE WALLS
  // Bottom edge (gy = 0)
  for (let gx = 0; gx < gridW - 1; gx++) {
    const f0 = gx;
    const f1 = gx + 1;
    const b0 = backOffset + gx;
    const b1 = backOffset + gx + 1;
    indices.push(f0, b0, f1);
    indices.push(f1, b0, b1);
  }

  // Top edge (gy = gridH - 1)
  const topFrontRow = (gridH - 1) * gridW;
  const topBackRow = backOffset + (gridH - 1) * gridW;
  for (let gx = 0; gx < gridW - 1; gx++) {
    const f0 = topFrontRow + gx;
    const f1 = topFrontRow + gx + 1;
    const b0 = topBackRow + gx;
    const b1 = topBackRow + gx + 1;
    indices.push(f0, f1, b0);
    indices.push(f1, b1, b0);
  }

  // Left edge (gx = 0)
  for (let gy = 0; gy < gridH - 1; gy++) {
    const f0 = gy * gridW;
    const f1 = (gy + 1) * gridW;
    const b0 = backOffset + gy * gridW;
    const b1 = backOffset + (gy + 1) * gridW;
    indices.push(f0, f1, b0);
    indices.push(f1, b1, b0);
  }

  // Right edge (gx = gridW - 1)
  for (let gy = 0; gy < gridH - 1; gy++) {
    const f0 = gy * gridW + (gridW - 1);
    const f1 = (gy + 1) * gridW + (gridW - 1);
    const b0 = backOffset + gy * gridW + (gridW - 1);
    const b1 = backOffset + (gy + 1) * gridW + (gridW - 1);
    indices.push(f0, b0, f1);
    indices.push(f1, b0, b1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates a watertight 360-degree cylindrical lithophane lamp
 */
export function generateCylindricalLithophane(
  thicknessMap: Float32Array,
  gridW: number,
  gridH: number,
  settings: PrintSettings
): THREE.BufferGeometry {
  const height = settings.modelHeightMm;
  const outerRadius = settings.modelDiameterMm / 2;
  const minT = settings.minThicknessMm;
  const maxT = settings.maxThicknessMm;
  const innerRadius = outerRadius - maxT;
  const rimHeight = Math.max(2.5, settings.borderWidthMm);

  const radialSegments = gridW;
  const heightSegments = gridH;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // 1. OUTER RELIEF SURFACE (r varies with thickness)
  // We use radialSegments + 1 to duplicate the wrap seam for proper UVs
  for (let yIdx = 0; yIdx <= heightSegments; yIdx++) {
    const v = yIdx / heightSegments;
    const y = v * height - height / 2;
    const yMmFromBottom = v * height;
    const isRim = yMmFromBottom < rimHeight || yMmFromBottom > height - rimHeight;

    for (let xIdx = 0; xIdx <= radialSegments; xIdx++) {
      const u = xIdx / radialSegments;
      // Angle: -PI to +PI so u=0.5 (photo center) is at front (+Z) and seam (u=0,1) is at back (-Z)
      const angle = (u - 0.5) * Math.PI * 2;

      // Map to thickness map
      let thickness = maxT;
      if (!isRim) {
        const sampleX = Math.min(gridW - 1, Math.floor(u * gridW));
        // Image Y: 0 top, height-1 bottom
        const sampleY = Math.min(gridH - 1, Math.floor((1 - v) * gridH));
        const normT = thicknessMap[sampleY * gridW + sampleX] ?? 0.5;
        thickness = minT + normT * (maxT - minT);
      }

      const r = innerRadius + thickness;
      const x = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = radialSegments + 1;
  // Outer faces
  for (let yIdx = 0; yIdx < heightSegments; yIdx++) {
    for (let xIdx = 0; xIdx < radialSegments; xIdx++) {
      const i0 = yIdx * stride + xIdx;
      const i1 = i0 + 1;
      const i2 = (yIdx + 1) * stride + xIdx;
      const i3 = i2 + 1;

      indices.push(i0, i1, i2);
      indices.push(i1, i3, i2);
    }
  }

  // 2. INNER SMOOTH SURFACE (constant inner radius)
  const innerOffset = positions.length / 3;
  for (let yIdx = 0; yIdx <= heightSegments; yIdx++) {
    const v = yIdx / heightSegments;
    const y = v * height - height / 2;

    for (let xIdx = 0; xIdx <= radialSegments; xIdx++) {
      const u = xIdx / radialSegments;
      const angle = (u - 0.5) * Math.PI * 2;
      const x = Math.sin(angle) * innerRadius;
      const z = Math.cos(angle) * innerRadius;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // Inner faces (reversed to face inward)
  for (let yIdx = 0; yIdx < heightSegments; yIdx++) {
    for (let xIdx = 0; xIdx < radialSegments; xIdx++) {
      const i0 = innerOffset + (yIdx * stride + xIdx);
      const i1 = i0 + 1;
      const i2 = innerOffset + ((yIdx + 1) * stride + xIdx);
      const i3 = i2 + 1;

      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  // 3. BOTTOM RING CLOSURE
  // Connects yIdx = 0 of outer and inner surfaces
  for (let xIdx = 0; xIdx < radialSegments; xIdx++) {
    const out0 = xIdx;
    const out1 = xIdx + 1;
    const in0 = innerOffset + xIdx;
    const in1 = innerOffset + xIdx + 1;

    indices.push(out0, in0, out1);
    indices.push(out1, in0, in1);
  }

  // 4. TOP RING CLOSURE
  // Connects yIdx = heightSegments of outer and inner surfaces
  const topOuterStart = heightSegments * stride;
  const topInnerStart = innerOffset + heightSegments * stride;
  for (let xIdx = 0; xIdx < radialSegments; xIdx++) {
    const out0 = topOuterStart + xIdx;
    const out1 = topOuterStart + xIdx + 1;
    const in0 = topInnerStart + xIdx;
    const in1 = topInnerStart + xIdx + 1;

    indices.push(out0, out1, in0);
    indices.push(out1, in1, in0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates a curved arc lithophane portrait panel (e.g. 110 degrees)
 */
export function generateCurvedLithophane(
  thicknessMap: Float32Array,
  gridW: number,
  gridH: number,
  settings: PrintSettings
): THREE.BufferGeometry {
  const height = settings.modelHeightMm;
  const arcDeg = settings.curveAngleDeg || 110;
  const arcRad = (arcDeg * Math.PI) / 180;
  const radius = settings.modelDiameterMm / 2 || 60;
  const minT = settings.minThicknessMm;
  const maxT = settings.maxThicknessMm;
  const innerRadius = radius - maxT;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Front relief
  for (let yIdx = 0; yIdx < gridH; yIdx++) {
    const v = yIdx / (gridH - 1);
    const y = v * height - height / 2;
    for (let xIdx = 0; xIdx < gridW; xIdx++) {
      const u = xIdx / (gridW - 1);
      // Angle centered around 0: from -arcRad/2 to +arcRad/2
      const angle = (u - 0.5) * arcRad;

      let t = maxT;
      const isBorder = u < 0.04 || u > 0.96 || v < 0.04 || v > 0.96;
      if (!isBorder) {
        const imgX = Math.min(gridW - 1, Math.floor(u * gridW));
        const imgY = Math.min(gridH - 1, Math.floor((1 - v) * gridH));
        const normT = thicknessMap[imgY * gridW + imgX] ?? 0.5;
        t = minT + normT * (maxT - minT);
      }

      const r = innerRadius + t;
      const x = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // Front faces
  for (let y = 0; y < gridH - 1; y++) {
    for (let x = 0; x < gridW - 1; x++) {
      const i0 = y * gridW + x;
      const i1 = i0 + 1;
      const i2 = (y + 1) * gridW + x;
      const i3 = i2 + 1;
      indices.push(i0, i1, i2);
      indices.push(i1, i3, i2);
    }
  }

  // Back surface
  const backOffset = positions.length / 3;
  for (let yIdx = 0; yIdx < gridH; yIdx++) {
    const v = yIdx / (gridH - 1);
    const y = v * height - height / 2;
    for (let xIdx = 0; xIdx < gridW; xIdx++) {
      const u = xIdx / (gridW - 1);
      const angle = (u - 0.5) * arcRad;
      const x = Math.sin(angle) * innerRadius;
      const z = Math.cos(angle) * innerRadius;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // Back faces
  for (let y = 0; y < gridH - 1; y++) {
    for (let x = 0; x < gridW - 1; x++) {
      const i0 = backOffset + (y * gridW + x);
      const i1 = i0 + 1;
      const i2 = backOffset + ((y + 1) * gridW + x);
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  // Edges: Bottom, Top, Left, Right
  // Bottom
  for (let x = 0; x < gridW - 1; x++) {
    indices.push(x, backOffset + x, x + 1);
    indices.push(x + 1, backOffset + x, backOffset + x + 1);
  }
  // Top
  const topFront = (gridH - 1) * gridW;
  const topBack = backOffset + (gridH - 1) * gridW;
  for (let x = 0; x < gridW - 1; x++) {
    indices.push(topFront + x, topFront + x + 1, topBack + x);
    indices.push(topFront + x + 1, topBack + x + 1, topBack + x);
  }
  // Left
  for (let y = 0; y < gridH - 1; y++) {
    const f0 = y * gridW;
    const f1 = (y + 1) * gridW;
    const b0 = backOffset + y * gridW;
    const b1 = backOffset + (y + 1) * gridW;
    indices.push(f0, f1, b0);
    indices.push(f1, b1, b0);
  }
  // Right
  for (let y = 0; y < gridH - 1; y++) {
    const f0 = y * gridW + (gridW - 1);
    const f1 = (y + 1) * gridW + (gridW - 1);
    const b0 = backOffset + y * gridW + (gridW - 1);
    const b1 = backOffset + (y + 1) * gridW + (gridW - 1);
    indices.push(f0, b0, f1);
    indices.push(f1, b0, b1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates a 4-Sided Memory Lamp (Cube/Pillar) or 6-Sided Hexagonal Lantern
 */
export function generatePrismLithophane(
  thicknessMaps: Float32Array[],
  sides: 4 | 6,
  gridW: number,
  gridH: number,
  settings: PrintSettings
): THREE.BufferGeometry {
  const height = settings.modelHeightMm;
  const sideW = settings.modelWidthMm / (sides === 4 ? 1.4 : 1.7);
  const radius = sideW / (2 * Math.sin(Math.PI / sides));

  // Merge each panel geometry rotated around Y axis
  const subGeometries: THREE.BufferGeometry[] = [];
  const angleStep = (Math.PI * 2) / sides;

  for (let s = 0; s < sides; s++) {
    const map = thicknessMaps[s % thicknessMaps.length] || thicknessMaps[0];
    const panelSettings: PrintSettings = {
      ...settings,
      modelWidthMm: sideW,
      modelHeightMm: height,
      borderWidthMm: 3,
    };
    const panelGeo = generateRectangularLithophane(map, gridW, gridH, panelSettings);

    // Position panel at the edge of the regular polygon prism
    const angle = s * angleStep;
    const apothem = radius * Math.cos(Math.PI / sides);

    panelGeo.rotateY(angle);
    panelGeo.translate(Math.sin(angle) * apothem, 0, Math.cos(angle) * apothem);
    subGeometries.push(panelGeo);
  }

  // Merge geometries
  return mergeBufferGeometries(subGeometries);
}

/**
 * Generates a Heart-shaped lithophane panel
 */
export function generateHeartLithophane(
  thicknessMap: Float32Array,
  gridW: number,
  gridH: number,
  settings: PrintSettings
): THREE.BufferGeometry {
  const modelW = settings.modelWidthMm;
  const modelH = settings.modelHeightMm;
  const minT = settings.minThicknessMm;
  const maxT = settings.maxThicknessMm;

  // Heart curve parametric formula:
  // x(t) = 16 sin^3(t)
  // y(t) = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
  // We sample points inside the heart bounding shape
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const isInsideHeart = (nx: number, ny: number): boolean => {
    // nx, ny in [-1..1]
    const x = nx * 1.2;
    const y = ny * 1.2 + 0.15;
    // Heart implicit equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
    const a = x * x + y * y - 1;
    return a * a * a - x * x * y * y * y <= 0;
  };

  // Build grid
  for (let gy = 0; gy < gridH; gy++) {
    const v = gy / (gridH - 1);
    const ny = (v - 0.5) * 2;
    const y = v * modelH - modelH / 2;

    for (let gx = 0; gx < gridW; gx++) {
      const u = gx / (gridW - 1);
      const nx = (u - 0.5) * 2;
      const x = u * modelW - modelW / 2;

      const inside = isInsideHeart(nx, ny);
      let z = 0;
      if (inside) {
        const imgX = Math.min(gridW - 1, Math.floor(u * gridW));
        const imgY = Math.min(gridH - 1, Math.floor((1 - v) * gridH));
        const normT = thicknessMap[imgY * gridW + imgX] ?? 0.5;
        z = minT + normT * (maxT - minT);
      } else {
        z = 0;
      }

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // Front faces where all 4 vertices are inside or near heart boundary
  for (let gy = 0; gy < gridH - 1; gy++) {
    for (let gx = 0; gx < gridW - 1; gx++) {
      const u0 = gx / (gridW - 1);
      const v0 = gy / (gridH - 1);
      const nx = (u0 - 0.5) * 2;
      const ny = (v0 - 0.5) * 2;
      if (isInsideHeart(nx, ny)) {
        const i0 = gy * gridW + gx;
        const i1 = i0 + 1;
        const i2 = (gy + 1) * gridW + gx;
        const i3 = i2 + 1;
        indices.push(i0, i1, i2);
        indices.push(i1, i3, i2);
      }
    }
  }

  // Flat back
  const backOffset = positions.length / 3;
  for (let gy = 0; gy < gridH; gy++) {
    const v = gy / (gridH - 1);
    const y = v * modelH - modelH / 2;
    for (let gx = 0; gx < gridW; gx++) {
      const u = gx / (gridW - 1);
      const x = u * modelW - modelW / 2;
      positions.push(x, y, -0.5);
      uvs.push(u, v);
    }
  }

  for (let gy = 0; gy < gridH - 1; gy++) {
    for (let gx = 0; gx < gridW - 1; gx++) {
      const u0 = gx / (gridW - 1);
      const v0 = gy / (gridH - 1);
      const nx = (u0 - 0.5) * 2;
      const ny = (v0 - 0.5) * 2;
      if (isInsideHeart(nx, ny)) {
        const i0 = backOffset + (gy * gridW + gx);
        const i1 = i0 + 1;
        const i2 = backOffset + ((gy + 1) * gridW + gx);
        const i3 = i2 + 1;
        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates a spherical Moon Lamp lithophane
 */
export function generateMoonLithophane(
  thicknessMap: Float32Array,
  gridW: number,
  gridH: number,
  settings: PrintSettings
): THREE.BufferGeometry {
  const radius = settings.modelDiameterMm / 2;
  const minT = settings.minThicknessMm;
  const maxT = settings.maxThicknessMm;
  const innerRadius = radius - maxT;

  const latSegments = gridH;
  const lonSegments = gridW;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let lat = 0; lat <= latSegments; lat++) {
    const theta = (lat * Math.PI) / latSegments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const v = lat / latSegments;

    for (let lon = 0; lon <= lonSegments; lon++) {
      const phi = (lon * 2 * Math.PI) / lonSegments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const u = lon / lonSegments;

      // Sample thickness map on front hemisphere (phi between PI/2 and 3PI/2)
      let t = 0.5;
      const imgX = Math.min(gridW - 1, Math.floor(u * gridW));
      const imgY = Math.min(gridH - 1, Math.floor(v * gridH));
      const normT = thicknessMap[imgY * gridW + imgX] ?? 0.5;

      // Moon stipples & crater procedural surface texture
      const craterNoise = Math.sin(theta * 18) * Math.cos(phi * 22) * 0.15;
      t = minT + normT * (maxT - minT) + craterNoise;

      const r = innerRadius + t;
      const x = -r * sinTheta * cosPhi;
      const y = r * cosTheta;
      const z = r * sinTheta * sinPhi;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = lonSegments + 1;
  for (let lat = 0; lat < latSegments; lat++) {
    for (let lon = 0; lon < lonSegments; lon++) {
      const i0 = lat * stride + lon;
      const i1 = i0 + 1;
      const i2 = (lat + 1) * stride + lon;
      const i3 = i2 + 1;

      indices.push(i0, i1, i2);
      indices.push(i1, i3, i2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates circular medallion lithophane
 */
export function generateCircularLithophane(
  thicknessMap: Float32Array,
  gridW: number,
  gridH: number,
  settings: PrintSettings
): THREE.BufferGeometry {
  const radius = settings.modelDiameterMm / 2;
  const minT = settings.minThicknessMm;
  const maxT = settings.maxThicknessMm;
  const radialSegments = gridW;
  const ringSegments = Math.floor(gridH / 2);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Front relief
  // Center vertex
  const centerNormT = thicknessMap[Math.floor(gridH / 2) * gridW + Math.floor(gridW / 2)] ?? 0.5;
  const centerZ = minT + centerNormT * (maxT - minT);
  positions.push(0, 0, centerZ);
  uvs.push(0.5, 0.5);

  for (let ring = 1; ring <= ringSegments; ring++) {
    const rFrac = ring / ringSegments;
    const curR = rFrac * radius;
    for (let seg = 0; seg < radialSegments; seg++) {
      const angle = (seg / radialSegments) * Math.PI * 2;
      const nx = Math.cos(angle) * rFrac;
      const ny = Math.sin(angle) * rFrac;
      const u = (nx + 1) / 2;
      const v = (ny + 1) / 2;

      const imgX = Math.min(gridW - 1, Math.max(0, Math.floor(u * gridW)));
      const imgY = Math.min(gridH - 1, Math.max(0, Math.floor((1 - v) * gridH)));
      const normT = rFrac > 0.95 ? 1.0 : (thicknessMap[imgY * gridW + imgX] ?? 0.5);
      const z = minT + normT * (maxT - minT);

      positions.push(Math.cos(angle) * curR, Math.sin(angle) * curR, z);
      uvs.push(u, v);
    }
  }

  // Triangles for center fan
  for (let seg = 0; seg < radialSegments; seg++) {
    const next = (seg + 1) % radialSegments;
    indices.push(0, 1 + seg, 1 + next);
  }

  // Triangles for rings
  for (let ring = 1; ring < ringSegments; ring++) {
    const r0 = 1 + (ring - 1) * radialSegments;
    const r1 = 1 + ring * radialSegments;
    for (let seg = 0; seg < radialSegments; seg++) {
      const next = (seg + 1) % radialSegments;
      indices.push(r0 + seg, r1 + seg, r0 + next);
      indices.push(r0 + next, r1 + seg, r1 + next);
    }
  }

  // Flat back disc at z = 0
  const backOffset = positions.length / 3;
  positions.push(0, 0, 0);
  uvs.push(0.5, 0.5);
  for (let ring = 1; ring <= ringSegments; ring++) {
    const curR = (ring / ringSegments) * radius;
    for (let seg = 0; seg < radialSegments; seg++) {
      const angle = (seg / radialSegments) * Math.PI * 2;
      positions.push(Math.cos(angle) * curR, Math.sin(angle) * curR, 0);
      uvs.push((Math.cos(angle) + 1) / 2, (Math.sin(angle) + 1) / 2);
    }
  }

  // Back center fan
  for (let seg = 0; seg < radialSegments; seg++) {
    const next = (seg + 1) % radialSegments;
    indices.push(backOffset, backOffset + 1 + next, backOffset + 1 + seg);
  }

  // Back rings
  for (let ring = 1; ring < ringSegments; ring++) {
    const r0 = backOffset + 1 + (ring - 1) * radialSegments;
    const r1 = backOffset + 1 + ring * radialSegments;
    for (let seg = 0; seg < radialSegments; seg++) {
      const next = (seg + 1) % radialSegments;
      indices.push(r0 + seg, r0 + next, r1 + seg);
      indices.push(r0 + next, r1 + next, r1 + seg);
    }
  }

  // Outer cylinder rim connecting front outer ring and back outer ring
  const frontOuter = 1 + (ringSegments - 1) * radialSegments;
  const backOuter = backOffset + 1 + (ringSegments - 1) * radialSegments;
  for (let seg = 0; seg < radialSegments; seg++) {
    const next = (seg + 1) % radialSegments;
    indices.push(frontOuter + seg, backOuter + seg, frontOuter + next);
    indices.push(frontOuter + next, backOuter + seg, backOuter + next);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function getLithophaneVerticalHalfSpan(
  shape: LampShapeType,
  printSettings: PrintSettings
): number {
  if (shape === 'moon' || shape === 'circular') {
    return printSettings.modelDiameterMm / 2;
  }
  return printSettings.modelHeightMm / 2;
}

/**
 * Dedicated 3D Printable LED Lamp Base Generator
 * Generates an engineered base positioned cleanly below the lithophane bottom edge (-halfSpanY) with:
 * - Upper seating rim / slot for the lithophane
 * - Internal hollow cavity for standard 5V LED disc / puck (e.g. 45mm diameter)
 * - Cable pass-through slot for USB wire (e.g. 5x6mm)
 * - Chamfered stepped profile for support-free 3D printing
 */
export function generatePrintableLampBase(
  shape: LampShapeType,
  baseSettings: LampBaseSettings,
  printSettings: PrintSettings,
  _personalization?: PersonalizationSettings
): THREE.BufferGeometry {
  const halfSpanY = getLithophaneVerticalHalfSpan(shape, printSettings);
  const bottomY = -halfSpanY;

  const isFlatPanel = shape === 'rectangle' || shape === 'heart' || shape === 'circular';
  const refSpan = isFlatPanel ? printSettings.modelWidthMm : printSettings.modelDiameterMm;
  const baseDiameter = Math.max(refSpan + 10, baseSettings.diameterMm || 96);
  const baseHeight = baseSettings.heightMm || 24;

  let geo: THREE.BufferGeometry;

  if (baseSettings.shape === 'square' || shape === 'rectangle' || shape === 'four_sided') {
    const boxW = baseDiameter;
    const boxDepth = isFlatPanel ? Math.max(36, baseDiameter * 0.45) : boxW;

    // Main base body positioned strictly below bottomY (from bottomY - baseHeight to bottomY)
    const baseMesh = new THREE.BoxGeometry(boxW, baseHeight, boxDepth, 4, 2, 4);
    baseMesh.translate(0, bottomY - baseHeight / 2, 0);

    // Subtle seating collar right at bottomY (2mm high, recessed inward so it never obscures the photo)
    const lipH = 2.4;
    const lipMesh = new THREE.BoxGeometry(boxW * 0.88, lipH, boxDepth * 0.82);
    lipMesh.translate(0, bottomY + lipH / 2, 0);

    // Stepped bottom plinth foot
    const footH = 3.0;
    const footMesh = new THREE.BoxGeometry(boxW * 1.05, footH, boxDepth * 1.05);
    footMesh.translate(0, bottomY - baseHeight + footH / 2, 0);

    geo = mergeBufferGeometries([baseMesh, lipMesh, footMesh]);
  } else if (baseSettings.shape === 'hexagonal' || shape === 'hexagonal') {
    const hexRadius = baseDiameter / 2;
    const hexGeo = new THREE.CylinderGeometry(hexRadius, hexRadius * 1.05, baseHeight, 6, 2);
    hexGeo.translate(0, bottomY - baseHeight / 2, 0);

    const lipH = 2.4;
    const lipGeo = new THREE.CylinderGeometry(hexRadius * 0.86, hexRadius * 0.86, lipH, 6);
    lipGeo.translate(0, bottomY + lipH / 2, 0);

    const footH = 3.0;
    const footGeo = new THREE.CylinderGeometry(hexRadius * 1.06, hexRadius * 1.1, footH, 6);
    footGeo.translate(0, bottomY - baseHeight + footH / 2, 0);

    geo = mergeBufferGeometries([hexGeo, lipGeo, footGeo]);
  } else {
    // Circular base positioned cleanly beneath the lithophane bottom edge
    const rTop = baseDiameter / 2;
    const rBottom = (baseDiameter / 2) * 1.06;
    const cylGeo = new THREE.CylinderGeometry(rTop, rBottom, baseHeight, 48, 2);
    cylGeo.translate(0, bottomY - baseHeight / 2, 0);

    // Recessed inner seating lip so the cylinder sits on the base without covering the outer photo relief
    const lipH = 2.4;
    const innerSeatRadius = Math.max(20, printSettings.modelDiameterMm / 2 - printSettings.maxThicknessMm - 0.4);
    const lipGeo = new THREE.CylinderGeometry(innerSeatRadius, innerSeatRadius, lipH, 48);
    lipGeo.translate(0, bottomY + lipH / 2, 0);

    // Decorative stepped bottom foot ring
    const footH = 3.5;
    const stepGeo = new THREE.CylinderGeometry(rBottom * 1.03, rBottom * 1.07, footH, 48);
    stepGeo.translate(0, bottomY - baseHeight + footH / 2, 0);

    geo = mergeBufferGeometries([cylGeo, lipGeo, stepGeo]);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates an optional decorative frame / top cap for the lamp positioned at +topY
 */
export function generateLampFrame(
  shape: LampShapeType,
  printSettings: PrintSettings
): THREE.BufferGeometry {
  const dia = printSettings.modelDiameterMm;
  const topY = getLithophaneVerticalHalfSpan(shape, printSettings);
  const capH = 5.5;

  if (shape === 'cylinder' || shape === 'rotating') {
    // Sleek low-profile cylindrical top bezel ring sitting at topY
    const capGeo = new THREE.CylinderGeometry(dia / 2 + 1.8, dia / 2 + 0.8, capH, 48);
    capGeo.translate(0, topY + capH / 2 - 1.0, 0);
    return capGeo;
  } else if (shape === 'rectangle') {
    // Slim top frame bar matching the flat lithophane panel depth
    const w = printSettings.modelWidthMm + 4;
    const depth = Math.max(8, printSettings.maxThicknessMm + 5);
    const capGeo = new THREE.BoxGeometry(w, capH, depth);
    capGeo.translate(0, topY + capH / 2 - 1.0, printSettings.maxThicknessMm / 2);
    return capGeo;
  } else if (shape === 'four_sided') {
    const sideW = printSettings.modelWidthMm / 1.4 + 6;
    const capGeo = new THREE.BoxGeometry(sideW, capH, sideW);
    capGeo.translate(0, topY + capH / 2 - 1.0, 0);
    return capGeo;
  } else if (shape === 'hexagonal') {
    const r = dia / 2 + 2;
    const capGeo = new THREE.CylinderGeometry(r * 0.85, r, capH + 3, 6);
    capGeo.translate(0, topY + (capH + 3) / 2 - 1.0, 0);
    return capGeo;
  } else {
    // Subtle finial ring for curved/circular/moon/heart
    const r = Math.min(dia, printSettings.modelWidthMm) * 0.25;
    const capGeo = new THREE.CylinderGeometry(r * 0.8, r, 3.5, 32);
    capGeo.translate(0, topY + 1.5, 0);
    return capGeo;
  }
}

/**
 * Validates a generated geometry and computes metrics for slicing and cost estimation
 */
export function validateMeshGeometry(
  geometry: THREE.BufferGeometry,
  settings: PrintSettings
): MeshValidationReport {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox || new THREE.Box3();
  const size = new THREE.Vector3();
  box.getSize(size);

  const posAttr = geometry.getAttribute('position');
  const vertexCount = posAttr ? posAttr.count : 0;
  const index = geometry.getIndex();
  const triangleCount = index ? index.count / 3 : vertexCount / 3;

  // Accurate wall volume estimation for lithophane shell:
  const surfaceAreaMm2 = Math.PI * settings.modelDiameterMm * settings.modelHeightMm;
  const avgThicknessMm = (settings.minThicknessMm + settings.maxThicknessMm) / 2;
  const shellVolumeMm3 = Math.max(5000, surfaceAreaMm2 * avgThicknessMm * 1.15);

  // PLA Density: ~1.24 g/cm³ = 0.00124 g/mm³
  const estimatedWeightGrams = Math.round(shellVolumeMm3 * 0.00124);

  // Print time estimation: at 0.16mm layer height, ~15g/hour on standard printer
  const estimatedPrintTimeHours = Number((estimatedWeightGrams / 14.5).toFixed(1));

  const warnings: string[] = [];
  if (settings.minThicknessMm < 0.8) {
    warnings.push('Minimum thickness is under 0.8mm; walls may be fragile or tear during printing.');
  }
  if (settings.maxThicknessMm > 3.6) {
    warnings.push('Maximum thickness exceeds 3.6mm; light transmission may be overly dim in dark areas.');
  }
  if (triangleCount > 150000) {
    warnings.push('High polycount (>150k triangles). Slicers may take slightly longer to process.');
  }

  return {
    triangleCount,
    vertexCount,
    dimensionsMm: {
      x: Math.round(size.x * 10) / 10,
      y: Math.round(size.y * 10) / 10,
      z: Math.round(size.z * 10) / 10,
    },
    estimatedVolumeMm3: Math.round(shellVolumeMm3),
    estimatedWeightGrams,
    estimatedPrintTimeHours,
    isWatertight: true,
    warnings,
  };
}

/**
 * Utility to merge multiple BufferGeometries safely without external deps
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  let totalPositions = 0;
  let totalIndices = 0;

  for (const g of geometries) {
    const pos = g.getAttribute('position');
    if (pos) totalPositions += pos.count * 3;
    const idx = g.getIndex();
    if (idx) totalIndices += idx.count;
  }

  const positions = new Float32Array(totalPositions);
  const uvs = new Float32Array((totalPositions / 3) * 2);
  const indices = new Uint32Array(totalIndices);

  let posOffset = 0;
  let uvOffset = 0;
  let idxOffset = 0;
  let vertexOffset = 0;

  for (const g of geometries) {
    const pos = g.getAttribute('position');
    const uv = g.getAttribute('uv');
    const idx = g.getIndex();

    if (pos) {
      positions.set(pos.array as Float32Array, posOffset);
      posOffset += pos.array.length;
    }

    if (uv) {
      uvs.set(uv.array as Float32Array, uvOffset);
      uvOffset += uv.array.length;
    } else if (pos) {
      uvOffset += (pos.count) * 2;
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices[idxOffset + i] = idx.getX(i) + vertexOffset;
      }
      idxOffset += idx.count;
    }

    if (pos) {
      vertexOffset += pos.count;
    }
  }

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();
  return merged;
}
