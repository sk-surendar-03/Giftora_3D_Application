import * as THREE from 'three';
import { ADDITION, Brush, Evaluator, SUBTRACTION, computeMeshVolume } from 'three-bvh-csg';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const sharedEvaluator = new Evaluator();
sharedEvaluator.useGroups = false;
sharedEvaluator.attributes = ['position', 'normal', 'uv'];

/**
 * Ensures geometry has position, normal, and uv attributes required by three-bvh-csg
 * and STLExporter, and is safe for boolean operations.
 */
export function prepareCsgGeometry(raw: THREE.BufferGeometry): THREE.BufferGeometry {
  const geom = raw.clone();
  if (!geom.attributes.normal) {
    geom.computeVertexNormals();
  }
  const posCount = geom.attributes.position?.count ?? 0;
  if (!geom.attributes.uv && posCount > 0) {
    geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(posCount * 2), 2));
  }
  // Remove tangent or extra attributes that may differ across geometries
  for (const attrName of Object.keys(geom.attributes)) {
    if (attrName !== 'position' && attrName !== 'normal' && attrName !== 'uv') {
      geom.deleteAttribute(attrName);
    }
  }
  return geom;
}

export function createBrush(
  geometry: THREE.BufferGeometry,
  matrix?: THREE.Matrix4
): Brush {
  const prepared = prepareCsgGeometry(geometry);
  if (matrix) {
    prepared.applyMatrix4(matrix);
  }
  const brush = new Brush(prepared);
  brush.updateMatrixWorld(true);
  return brush;
}

export function csgUnion(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) {
    return new THREE.BoxGeometry(10, 10, 10);
  }
  if (geometries.length === 1) {
    return prepareCsgGeometry(geometries[0]);
  }

  let accBrush = createBrush(geometries[0]);
  for (let i = 1; i < geometries.length; i++) {
    const nextBrush = createBrush(geometries[i]);
    try {
      const result = sharedEvaluator.evaluate(accBrush, nextBrush, ADDITION);
      accBrush.geometry.dispose();
      nextBrush.geometry.dispose();
      accBrush = result;
      accBrush.updateMatrixWorld(true);
    } catch {
      // Fallback: merge cleanly if coplanar edge-case occurs
      const merged = BufferGeometryUtils.mergeGeometries(
        [
          prepareCsgGeometry(accBrush.geometry).toNonIndexed(),
          prepareCsgGeometry(nextBrush.geometry).toNonIndexed(),
        ],
        false
      );
      accBrush.geometry.dispose();
      nextBrush.geometry.dispose();
      if (merged) {
        accBrush = createBrush(merged);
        merged.dispose();
      }
    }
  }

  const out = accBrush.geometry.clone();
  accBrush.geometry.dispose();
  out.computeVertexNormals();
  out.computeBoundingBox();
  return out;
}

export function csgSubtract(
  baseGeometry: THREE.BufferGeometry,
  cutters: THREE.BufferGeometry[]
): THREE.BufferGeometry {
  if (cutters.length === 0) {
    return prepareCsgGeometry(baseGeometry);
  }

  let accBrush = createBrush(baseGeometry);
  for (const cutter of cutters) {
    const cutBrush = createBrush(cutter);
    try {
      const result = sharedEvaluator.evaluate(accBrush, cutBrush, SUBTRACTION);
      // Only adopt result if it produced non-empty geometry
      if (result.geometry.attributes.position && result.geometry.attributes.position.count > 0) {
        accBrush.geometry.dispose();
        accBrush = result;
        accBrush.updateMatrixWorld(true);
      } else {
        result.geometry.dispose();
      }
    } catch {
      // Skip degenerate cutter gracefully without breaking the base model
    } finally {
      cutBrush.geometry.dispose();
    }
  }

  const out = accBrush.geometry.clone();
  accBrush.geometry.dispose();
  out.computeVertexNormals();
  out.computeBoundingBox();
  return out;
}

export function mergeRawGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geometries.map((g) => {
    const prep = prepareCsgGeometry(g);
    if (prep.index) {
      const ni = prep.toNonIndexed();
      prep.dispose();
      return ni;
    }
    return prep;
  });
  const merged = BufferGeometryUtils.mergeGeometries(nonIndexed, false);
  nonIndexed.forEach((g) => g.dispose());
  if (!merged) {
    return new THREE.BoxGeometry(10, 10, 10);
  }
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  return merged;
}

export function computeVolumeCm3(geometry: THREE.BufferGeometry): number {
  try {
    const volMm3 = Math.abs(computeMeshVolume(geometry));
    if (Number.isFinite(volMm3) && volMm3 > 0) {
      return volMm3 / 1000;
    }
  } catch {
    // Fallback to bounding box estimation below
  }
  geometry.computeBoundingBox();
  if (!geometry.boundingBox) return 10;
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  return Math.max(1, (size.x * size.y * size.z * 0.35) / 1000);
}

export function getGeometryTriangleCount(geometry: THREE.BufferGeometry): number {
  if (geometry.index) {
    return Math.floor(geometry.index.count / 3);
  }
  return Math.floor((geometry.attributes.position?.count ?? 0) / 3);
}
