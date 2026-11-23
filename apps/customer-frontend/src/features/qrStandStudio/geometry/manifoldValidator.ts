import * as THREE from 'three';

export interface GeometryHealthReport {
  isManifold: boolean;
  isWatertight: boolean;
  vertexCount: number;
  triangleCount: number;
  degenerateTriangleCount: number;
  boundaryEdgeCount: number;
  nonManifoldEdgeCount: number;
  eulerCharacteristic: number;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
    dimensions: [number, number, number];
  };
  warnings: string[];
}

/**
 * Validates 3D mesh topology:
 * - Checks for non-manifold edges (shared by >2 triangles)
 * - Checks for boundary edges (shared by only 1 triangle - open surfaces)
 * - Detects degenerate triangles (zero area)
 * - Calculates Euler characteristic V - E + F
 */
export function validateManifoldGeometry(geo: THREE.BufferGeometry): GeometryHealthReport {
  const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
  const pos = nonIndexed.attributes.position;
  const triangleCount = pos ? pos.count / 3 : 0;
  const warnings: string[] = [];

  if (!pos || pos.count < 3 || triangleCount === 0) {
    return {
      isManifold: false,
      isWatertight: false,
      vertexCount: 0,
      triangleCount: 0,
      degenerateTriangleCount: 0,
      boundaryEdgeCount: 0,
      nonManifoldEdgeCount: 0,
      eulerCharacteristic: 0,
      bounds: { min: [0, 0, 0], max: [0, 0, 0], dimensions: [0, 0, 0] },
      warnings: ['Geometry contains no vertices or triangles.'],
    };
  }

  geo.computeBoundingBox();
  const bb = geo.boundingBox || new THREE.Box3();
  const size = new THREE.Vector3();
  bb.getSize(size);

  // Precision key for vertex quantization to weld duplicate vertices for topology
  const precision = 1e3;
  const vertexKey = (x: number, y: number, z: number) =>
    `${Math.round(x * precision)},${Math.round(y * precision)},${Math.round(z * precision)}`;

  const vertexMap = new Map<string, number>();
  let uniqueVertexCount = 0;

  const edgeCountMap = new Map<string, number>();
  let degenerateCount = 0;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const edgeAB = new THREE.Vector3();
  const edgeAC = new THREE.Vector3();
  const cross = new THREE.Vector3();

  for (let i = 0; i < triangleCount; i++) {
    vA.fromBufferAttribute(pos, i * 3);
    vB.fromBufferAttribute(pos, i * 3 + 1);
    vC.fromBufferAttribute(pos, i * 3 + 2);

    // Degenerate triangle check (cross product of edges gives 2 * triangle area)
    edgeAB.subVectors(vB, vA);
    edgeAC.subVectors(vC, vA);
    cross.crossVectors(edgeAB, edgeAC);
    const area = cross.length() * 0.5;

    if (area < 1e-6) {
      degenerateCount++;
      continue;
    }

    const kA = vertexKey(vA.x, vA.y, vA.z);
    const kB = vertexKey(vB.x, vB.y, vB.z);
    const kC = vertexKey(vC.x, vC.y, vC.z);

    if (!vertexMap.has(kA)) vertexMap.set(kA, uniqueVertexCount++);
    if (!vertexMap.has(kB)) vertexMap.set(kB, uniqueVertexCount++);
    if (!vertexMap.has(kC)) vertexMap.set(kC, uniqueVertexCount++);

    // Undirected edge keys
    const edges = [
      kA < kB ? `${kA}|${kB}` : `${kB}|${kA}`,
      kB < kC ? `${kB}|${kC}` : `${kC}|${kB}`,
      kC < kA ? `${kC}|${kA}` : `${kA}|${kC}`,
    ];

    for (const e of edges) {
      edgeCountMap.set(e, (edgeCountMap.get(e) || 0) + 1);
    }
  }

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;

  for (const count of edgeCountMap.values()) {
    if (count === 1) {
      boundaryEdges++;
    } else if (count > 2) {
      nonManifoldEdges++;
    }
  }

  const isManifold = nonManifoldEdges === 0;
  const isWatertight = isManifold && boundaryEdges === 0 && degenerateCount === 0;

  if (degenerateCount > 0) {
    warnings.push(`Detected ${degenerateCount} degenerate or near-zero area triangles.`);
  }
  if (nonManifoldEdges > 0) {
    warnings.push(`Detected ${nonManifoldEdges} non-manifold edges shared by >2 faces.`);
  }
  if (boundaryEdges > 0) {
    warnings.push(`Detected ${boundaryEdges} boundary edges (mesh has open seams/holes).`);
  }

  const V = uniqueVertexCount;
  const E = edgeCountMap.size;
  const F = triangleCount - degenerateCount;
  const euler = V - E + F;

  return {
    isManifold,
    isWatertight,
    vertexCount: pos.count,
    triangleCount,
    degenerateTriangleCount: degenerateCount,
    boundaryEdgeCount: boundaryEdges,
    nonManifoldEdgeCount: nonManifoldEdges,
    eulerCharacteristic: euler,
    bounds: {
      min: [bb.min.x, bb.min.y, bb.min.z],
      max: [bb.max.x, bb.max.y, bb.max.z],
      dimensions: [size.x, size.y, size.z],
    },
    warnings,
  };
}
