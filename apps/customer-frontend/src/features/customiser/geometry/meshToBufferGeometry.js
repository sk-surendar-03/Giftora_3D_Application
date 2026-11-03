import * as THREE from 'three'
import { asMesh, MANIFOLD_SCALE } from './build/manifoldUtils.js'

// Re-exported so existing callers (keychainGeometry.js) keep working unchanged.
export { MANIFOLD_SCALE }

/**
 * Converts a manifold-3d Manifold directly into a THREE.BufferGeometry, via
 * the upstream `asMesh` (MeshBuffer) step — see build/manifoldUtils.js.
 */
export function manifoldToBufferGeometry(manifold) {
  const { positions, indices } = asMesh(manifold)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
