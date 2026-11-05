import { useMemo } from 'react'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import { getMaterialAppearance } from './materialAppearance'
import { getReadableTextColor } from './contrastColor'

// The camera/OrbitControls framing (Viewport3D.jsx) is tuned for a model
// roughly this wide/tall, in scene units. Short names ("Alex") land near
// this size naturally; long names or large size presets can be several
// times wider. Rather than touch the camera, auto-fit the generated solid
// to this target footprint so it always sits comfortably in frame.
const TARGET_FIT_SIZE = 2.4
const MIN_FIT_SCALE = 0.15
const MAX_FIT_SCALE = 3

/**
 * Renders the real, worker-generated keychain solid (baseGeometry +
 * reliefGeometry — the actual Open Keychain geometry engine's output,
 * Steps a–d) when available, or a simplified procedural fallback shape
 * while that geometry is loading or failed to generate, so the viewport is
 * never blank.
 */
export default function ProductModel({ text, color, textColor, materialName, scale = 1, baseGeometry, reliefGeometry }) {
  const appearance = getMaterialAppearance(materialName)

  // Fit the whole (base + relief) solid's bounding box into a consistent
  // on-screen footprint, so a long name or a large size preset doesn't get
  // clipped by the fixed camera the way a short name wouldn't be. This only
  // transforms the Three.js render group — real millimetre dimensions shown
  // elsewhere (preflight panel, exports) come from the untouched geometry.
  const fit = useMemo(() => {
    if (!baseGeometry || !reliefGeometry) return { scale: 1, offset: [0, 0, 0] }
    const box = new THREE.Box3()
    if (!baseGeometry.boundingBox) baseGeometry.computeBoundingBox()
    if (!reliefGeometry.boundingBox) reliefGeometry.computeBoundingBox()
    box.union(baseGeometry.boundingBox)
    box.union(reliefGeometry.boundingBox)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, 1e-6)
    const fitScale = Math.min(MAX_FIT_SCALE, Math.max(MIN_FIT_SCALE, TARGET_FIT_SIZE / maxDim))
    return { scale: fitScale, offset: [-center.x * fitScale, -center.y * fitScale, -center.z * fitScale] }
  }, [baseGeometry, reliefGeometry])

  if (baseGeometry && reliefGeometry) {
    const reliefColor = textColor ?? getReadableTextColor(color)
    return (
      <group scale={fit.scale} position={fit.offset}>
        <mesh geometry={baseGeometry}>
          <meshStandardMaterial color={color} {...appearance} />
        </mesh>
        <mesh geometry={reliefGeometry}>
          <meshStandardMaterial color={reliefColor} {...appearance} />
        </mesh>
      </group>
    )
  }

  return <FallbackModel text={text} color={color} appearance={appearance} scale={scale} />
}

function FallbackModel({ text, color, appearance, scale }) {
  const textColor = getReadableTextColor(color)

  return (
    <group scale={scale}>
      <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.05, 16, 32]} />
        <meshStandardMaterial color="#c4c8cc" metalness={0.8} roughness={0.3} />
      </mesh>

      <RoundedBox args={[2.2, 0.9, 0.16]} radius={0.12} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} {...appearance} />
      </RoundedBox>

      <Text
        position={[0, 0, 0.09]}
        fontSize={0.32}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.9}
        overflowWrap="break-word"
      >
        {text || 'Your Name'}
      </Text>
    </group>
  )
}
