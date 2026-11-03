import * as THREE from 'three'

/**
 * Converts a plain `{positions, indices}` MeshBuffer (already in real
 * millimetre units — `asMesh()` divides by MANIFOLD_SCALE before this ever
 * runs) into a THREE.BufferGeometry, scaled down from millimetres into the
 * viewer's scene units (same 1 unit ≈ 10mm convention the existing
 * procedural fallback model uses, so both can share one camera/viewport).
 * @param {{positions: Float32Array, indices: Uint32Array}} meshBuffer
 * @returns {import('three').BufferGeometry}
 */
const SCENE_UNITS_PER_MM = 0.1

export function meshBufferToThreeGeometry(meshBuffer) {
  const geometry = new THREE.BufferGeometry()
  const scaled =
    SCENE_UNITS_PER_MM === 1 ? meshBuffer.positions : Float32Array.from(meshBuffer.positions, (value) => value * SCENE_UNITS_PER_MM)
  geometry.setAttribute('position', new THREE.BufferAttribute(scaled, 3))
  geometry.setIndex(new THREE.BufferAttribute(meshBuffer.indices, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  // Deliberately not calling geometry.center() here: the base and relief
  // meshes must keep their position *relative to each other* (the engine
  // already centers the overall design around the origin internally), and
  // centering each mesh independently would pull the engraved text off the
  // tag's surface.
  return geometry
}

export { SCENE_UNITS_PER_MM }
