import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { CameraProjection, CameraViewPreset, NameplateDesign, PrintProfile } from '../core/types'
import { GeometryMeasurementSummary } from '../geometry/validation'
import { detectSoftwareWebGL } from '../geometry/materials'
import { NameplateMesh } from './NameplateMesh'

export interface NameplateCanvasHandle {
  capturePngDataUrl: () => string | null
  getExportGroup: () => THREE.Group | null
}

interface NameplateCanvasProps {
  design: NameplateDesign
  cameraPreset?: CameraViewPreset
  projection?: CameraProjection
  showBuildPlate?: boolean
  explodedPreview?: boolean
  onMeasurements?: (summary: GeometryMeasurementSummary) => void
}

const StudioEnvironment: React.FC = () => {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const rt = pmrem.fromScene(room, 0.04)
    scene.environment = rt.texture
    return () => {
      scene.environment = null
      rt.dispose()
      room.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

const CameraRig: React.FC<{
  preset: CameraViewPreset
  designWidth: number
  designHeight: number
  projection: CameraProjection
}> = ({ preset, designWidth, designHeight, projection }) => {
  const { camera, invalidate } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  useEffect(() => {
    const span = Math.max(designWidth, designHeight * 1.45, 145)
    const dist = span * 1.55
    const centerY = Math.max(18, designHeight * 0.45)
    const target = new THREE.Vector3(0, centerY, 0)

    let camPos = new THREE.Vector3(0, centerY + 20, dist)
    switch (preset) {
      case 'front':
        camPos = new THREE.Vector3(0, centerY, dist)
        break
      case 'top':
        camPos = new THREE.Vector3(0, dist * 1.25, 0.01)
        break
      case 'side':
        camPos = new THREE.Vector3(dist, centerY, 0)
        break
      case 'isometric':
      default:
        camPos = new THREE.Vector3(dist * 0.72, dist * 0.58, dist * 0.88)
        break
    }

    camera.position.copy(camPos)
    camera.lookAt(target)
    if (controlsRef.current) {
      controlsRef.current.target.copy(target)
      controlsRef.current.update()
    }
    invalidate()
  }, [preset, designWidth, designHeight, camera, invalidate])

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={40}
      maxDistance={900}
      maxPolarAngle={Math.PI / 2 + 0.08}
    />
  )
}

export const NameplateCanvas = React.forwardRef<NameplateCanvasHandle, NameplateCanvasProps>(
  (
    {
      design,
      cameraPreset = 'isometric',
      projection = 'perspective',
      showBuildPlate = true,
      explodedPreview = false,
      onMeasurements,
    },
    ref
  ) => {
    const canvasElementRef = useRef<HTMLCanvasElement | null>(null)
    const exportGroupRef = useRef<THREE.Group | null>(null)
    const [contextLost, setContextLost] = useState(false)
    const isSoftwareGl = typeof window !== 'undefined' ? detectSoftwareWebGL() : false

    useImperativeHandle(ref, () => ({
      capturePngDataUrl: () => {
        if (!canvasElementRef.current) return null
        return canvasElementRef.current.toDataURL('image/png')
      },
      getExportGroup: () => exportGroupRef.current,
    }))

    if (contextLost) {
      return (
        <div className="w-full h-full min-h-[380px] flex flex-col items-center justify-center bg-surface text-center p-6 rounded-card border border-line">
          <p className="text-sm font-semibold text-ink">3D WebGL context was interrupted</p>
          <button
            type="button"
            onClick={() => setContextLost(false)}
            className="mt-3 px-4 py-2 text-xs font-semibold rounded-control bg-accent text-surface hover:bg-accent-hover transition-colors"
          >
            Restore 3D Viewport
          </button>
        </div>
      )
    }

    return (
      <div className="relative w-full h-full min-h-[420px] rounded-card overflow-hidden bg-[#0D0D0D] border border-line">
        <Canvas
          shadows={!isSoftwareGl}
          dpr={[1, 2]}
          gl={{
            preserveDrawingBuffer: true,
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          onCreated={({ gl }) => {
            canvasElementRef.current = gl.domElement
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault()
              setContextLost(true)
            })
            gl.domElement.addEventListener('webglcontextrestored', () => {
              setContextLost(false)
            })
          }}
        >
          <color attach="background" args={['#0D0D0D']} />
          {projection === 'perspective' ? (
            <PerspectiveCamera makeDefault fov={36} near={1} far={2500} position={[120, 100, 230]} />
          ) : (
            <OrthographicCamera makeDefault zoom={2.2} near={-500} far={2000} position={[120, 100, 230]} />
          )}

          <StudioEnvironment />

          {/* Balanced Warm & Cool Studio Lighting */}
          <hemisphereLight args={['#FFF8E7', '#1A1A1A', 0.6]} />
          <directionalLight
            position={[120, 200, 150]}
            intensity={1.6}
            color="#FFF5E0"
            castShadow={!isSoftwareGl}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[-120, 80, -120]} intensity={0.65} color="#94A3B8" />
          <directionalLight position={[0, -100, 50]} intensity={0.25} color="#475569" />

          {/* Slicing Buildplate Grid */}
          {showBuildPlate && (
            <group position={[0, 0, 0]}>
              <gridHelper args={[260, 26, '#333333', '#1F1F1F']} />
            </group>
          )}

          <NameplateMesh
            design={design}
            exportGroupRef={exportGroupRef}
            explodedPreview={explodedPreview}
            onMeasurements={onMeasurements}
          />

          <CameraRig
            preset={cameraPreset}
            designWidth={design.widthMm}
            designHeight={design.heightMm}
            projection={projection}
          />
        </Canvas>
      </div>
    )
  }
)

NameplateCanvas.displayName = 'NameplateCanvas'
