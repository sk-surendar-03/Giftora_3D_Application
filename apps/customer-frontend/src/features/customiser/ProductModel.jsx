import { RoundedBox, Text } from '@react-three/drei'
import { getMaterialAppearance } from './materialAppearance'
import { getReadableTextColor } from './contrastColor'

/**
 * Renders the real, worker-generated keychain solid (baseGeometry +
 * reliefGeometry — the actual Open Keychain geometry engine's output,
 * Steps a–d) when available, or a simplified procedural fallback shape
 * while that geometry is loading or failed to generate, so the viewport is
 * never blank.
 */
export default function ProductModel({ text, color, textColor, materialName, scale = 1, baseGeometry, reliefGeometry }) {
  const appearance = getMaterialAppearance(materialName)

  if (baseGeometry && reliefGeometry) {
    const reliefColor = textColor ?? getReadableTextColor(color)
    return (
      <group>
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
