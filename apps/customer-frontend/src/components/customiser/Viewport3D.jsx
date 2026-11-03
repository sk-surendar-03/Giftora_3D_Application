import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import ProductModel from '../../features/customiser/ProductModel'
import ThreeErrorBoundary from './ThreeErrorBoundary'
import PreviewUnavailable from './PreviewUnavailable'
import { isWebGLAvailable } from '../../features/customiser/webgl'

const INITIAL_CAMERA_POSITION = [0, 0.3, 4]
const MIN_DISTANCE = 2.2
const MAX_DISTANCE = 7

export default function Viewport3D({ text, color, textColor, materialName, scale, baseGeometry, reliefGeometry, geometryStatus, dimensions }) {
  const controlsRef = useRef(null)
  const [ready, setReady] = useState(false)
  const webglAvailable = useMemo(() => isWebGLAvailable(), [])

  function zoomBy(multiplier) {
    const controls = controlsRef.current
    if (!controls) return
    const offset = new THREE.Vector3().subVectors(controls.object.position, controls.target)
    const nextDistance = offset.length() * multiplier
    if (nextDistance < MIN_DISTANCE || nextDistance > MAX_DISTANCE) return
    offset.multiplyScalar(multiplier)
    controls.object.position.copy(controls.target).add(offset)
    controls.update()
  }

  function resetView() {
    const controls = controlsRef.current
    if (!controls) return
    controls.object.position.set(...INITIAL_CAMERA_POSITION)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  if (!webglAvailable) {
    return (
      <PreviewUnavailable message="Your browser or device doesn't support 3D previews. You can still choose your customization below." />
    )
  }

  return (
    <ThreeErrorBoundary
      fallback={
        <PreviewUnavailable message="The 3D preview couldn't be rendered. Your customization choices below are unaffected." />
      }
    >
      <div
        className="relative aspect-square w-full overflow-hidden rounded-card border border-border"
        style={{
          backgroundColor: '#eaf3fb',
          backgroundImage:
            'linear-gradient(rgba(148,196,228,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,196,228,0.35) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {!ready && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/80">
            <span className="text-sm font-medium text-muted">Loading 3D preview…</span>
          </div>
        )}

        <Canvas camera={{ position: INITIAL_CAMERA_POSITION, fov: 45 }} onCreated={() => setReady(true)}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 3]} intensity={1.1} />
          <directionalLight position={[-3, -2, -2]} intensity={0.3} />
          <Suspense fallback={null}>
            <ProductModel
              text={text}
              color={color}
              textColor={textColor}
              materialName={materialName}
              scale={scale}
              baseGeometry={baseGeometry}
              reliefGeometry={reliefGeometry}
            />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={MIN_DISTANCE}
            maxDistance={MAX_DISTANCE}
          />
        </Canvas>

        {dimensions && (
          <div className="absolute bottom-3 left-3 rounded-control bg-surface/90 px-2.5 py-1.5 text-xs font-medium text-ink shadow-card">
            {dimensions.widthMm.toFixed(1)} × {dimensions.heightMm.toFixed(1)} × {dimensions.thicknessMm.toFixed(1)} mm
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={() => zoomBy(0.85)}
            aria-label="Zoom in"
            className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-ink shadow-card hover:border-ink/30"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1 / 0.85)}
            aria-label="Zoom out"
            className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-ink shadow-card hover:border-ink/30"
          >
            −
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset view"
            className="flex h-9 items-center justify-center rounded-control border border-border bg-surface px-3 text-xs font-medium text-ink shadow-card hover:border-ink/30"
          >
            Reset view
          </button>
        </div>
      </div>
      {geometryStatus === 'loading' && (
        <p className="mt-2 text-xs text-muted">Generating your design…</p>
      )}
      {geometryStatus === 'error' && (
        <p className="mt-2 text-xs text-danger">
          Couldn't generate that design — showing a placeholder shape instead. Try adjusting your text or options.
        </p>
      )}
      <p className="mt-2 text-xs text-muted">
        Drag to rotate, scroll or pinch to zoom. {baseGeometry ? 'Real generated preview — check the printability status below before ordering.' : 'Placeholder shape, not your final design.'}
      </p>
    </ThreeErrorBoundary>
  )
}
