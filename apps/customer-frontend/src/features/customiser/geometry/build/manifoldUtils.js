// Ported from Open Keychain (MIT) — src/infrastructure/geometry/manifold-utils.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
//
// This is the full upstream API (Step (a)/the earlier integration step only
// ported `asMesh` as `meshToBufferGeometry.manifoldToBufferGeometry`, which
// converts straight to THREE.BufferGeometry). The builder pipeline (Step b)
// needs the portable `MeshBuffer` ({positions, indices}) shape upstream
// actually passes between CSG stages, so this file now owns `asMesh` in its
// original MeshBuffer-returning form, and `meshToBufferGeometry.js` calls it
// internally rather than duplicating the vertex-extraction loop.
// See THIRD-PARTY-NOTICES.md.

export const MANIFOLD_SCALE = 1000

/** @param {import('manifold-3d').Manifold} manifold @returns {import('../model/types').MeshBuffer} */
export function asMesh(manifold) {
  const mesh = manifold.getMesh()
  const positions = new Float32Array(mesh.numVert * 3)
  for (let vertex = 0; vertex < mesh.numVert; vertex += 1) {
    const source = mesh.position(vertex)
    positions[vertex * 3] = source[0] / MANIFOLD_SCALE
    positions[vertex * 3 + 1] = source[1] / MANIFOLD_SCALE
    positions[vertex * 3 + 2] = source[2] / MANIFOLD_SCALE
  }
  return { positions, indices: Uint32Array.from(mesh.triVerts) }
}

/** Rehydrate a serialised mesh for a constructive operation.
 * @param {import('manifold-3d').ManifoldToplevel} wasm
 * @param {import('../model/types').MeshBuffer} mesh
 * @returns {import('manifold-3d').Manifold}
 */
export function manifoldFromMesh(wasm, mesh) {
  if (!validateMesh(mesh)) throw new Error('Cannot construct a solid from an invalid mesh.')
  const input = new wasm.Mesh({
    numProp: 3,
    vertProperties: Float32Array.from(mesh.positions, (value) => value * MANIFOLD_SCALE),
    triVerts: mesh.indices,
  })
  input.merge()
  return new wasm.Manifold(input)
}

/**
 * Keep the relief as its own material while removing its positive-volume overlap
 * from the base. Their union is the authoritative printable model.
 * @param {import('manifold-3d').Manifold} base
 * @param {import('manifold-3d').Manifold} relief
 * @param {import('manifold-3d').Manifold} [model]
 */
export function partitionMaterialSolids(base, relief, model) {
  const partitionedBase = base.subtract(relief)
  return { base: partitionedBase, relief, model: model ?? partitionedBase.add(relief) }
}

/** @param {import('../model/types').MeshBuffer[]} meshes @returns {import('../model/types').MeshBuffer} */
export function mergeMeshes(meshes) {
  const positions = new Float32Array(meshes.reduce((sum, mesh) => sum + mesh.positions.length, 0))
  const indices = new Uint32Array(meshes.reduce((sum, mesh) => sum + mesh.indices.length, 0))
  let positionOffset = 0
  let vertexOffset = 0
  let indexOffset = 0
  for (const mesh of meshes) {
    positions.set(mesh.positions, positionOffset)
    for (let index = 0; index < mesh.indices.length; index += 1) indices[indexOffset + index] = mesh.indices[index] + vertexOffset
    positionOffset += mesh.positions.length
    vertexOffset += mesh.positions.length / 3
    indexOffset += mesh.indices.length
  }
  return { positions, indices }
}

/** @param {readonly import('manifold-3d').CrossSection[] | readonly import('manifold-3d').Manifold[]} items */
export function disposeGeometry(items) {
  items.forEach((item) => {
    try {
      item.delete()
    } catch {
      // Already deleted as part of an operation that consumed it — safe to ignore.
    }
  })
}

/** @param {import('../model/types').MeshBuffer} mesh @returns {boolean} */
export function validateMesh(mesh) {
  return (
    mesh.positions instanceof Float32Array &&
    mesh.indices instanceof Uint32Array &&
    mesh.positions.length % 3 === 0 &&
    mesh.indices.length % 3 === 0 &&
    mesh.positions.every(Number.isFinite) &&
    mesh.indices.every((index) => index < mesh.positions.length / 3)
  )
}

/** @param {{min: readonly number[], max: readonly number[]}} bounds @returns {boolean} */
export function finiteBounds(bounds) {
  return [...bounds.min, ...bounds.max].every(Number.isFinite)
}

/** @param {import('manifold-3d').CrossSection} section @returns {number} */
export function sectionArea(section) {
  const polygonArea = (polygon) =>
    polygon.reduce((area, point, index) => {
      const next = polygon[(index + 1) % polygon.length]
      return area + point[0] * next[1] - next[0] * point[1]
    }, 0) / 2
  return Math.abs(section.toPolygons().reduce((area, polygon) => area + polygonArea(polygon), 0))
}
