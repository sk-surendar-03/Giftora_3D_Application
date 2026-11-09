import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js'

// Display size of the normalised model: its longest side becomes this many
// scene units, centred at the origin, so every model frames the same way.
const TARGET_SIZE = 2

/**
 * Parses an STL or 3MF file (ArrayBuffer) into a centred, normalised, Y-up
 * Object3D for the storefront viewer. STL and 3MF are Z-up; the viewer is Y-up.
 * Throws when the file cannot be parsed or contains no geometry.
 */
export function parseProductModel(buffer, format) {
  let content
  if (format === 'stl') {
    const geometry = new STLLoader().parse(buffer)
    if (!geometry.attributes.position || geometry.attributes.position.count < 3) throw new Error('The STL file has no geometry.')
    if (!geometry.attributes.normal) geometry.computeVertexNormals()
    content = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: '#c9ced6', metalness: 0.1, roughness: 0.55, side: THREE.DoubleSide }),
    )
  } else if (format === '3mf') {
    content = new ThreeMFLoader().parse(buffer)
    let meshCount = 0
    content.traverse((child) => {
      if (child.isMesh) {
        meshCount += 1
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((material) => {
          if (material) material.side = THREE.DoubleSide
        })
      }
    })
    if (meshCount === 0) throw new Error('The 3MF file has no geometry.')
  } else {
    throw new Error(`Unsupported model format: ${format}`)
  }

  const root = new THREE.Group()
  root.add(content)
  root.rotation.x = -Math.PI / 2 // Z-up -> Y-up
  root.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const longest = Math.max(size.x, size.y, size.z)
  if (!Number.isFinite(longest) || longest <= 0) throw new Error('The model has no visible size.')

  const centre = box.getCenter(new THREE.Vector3())
  const pivot = new THREE.Group()
  pivot.add(root)
  root.position.sub(centre) // centre in the pivot's (pre-scale) space
  pivot.scale.setScalar(TARGET_SIZE / longest)
  return { object: pivot, size: { x: size.x, y: size.y, z: size.z }, longest }
}

/** Frees GPU resources held by a parsed model. */
export function disposeProductModel(object) {
  object?.traverse((child) => {
    if (!child.isMesh) return
    child.geometry?.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => material?.dispose())
  })
}
