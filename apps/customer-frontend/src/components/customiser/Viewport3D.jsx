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

const SURFACE_PRESETS = [
  { id: 'matte', label: 'Matte', dotColor: '#eee8df' },
  { id: 'graph', label: 'Graph Paper', dotColor: '#b8b0a6' },
  { id: 'dark', label: 'Dark Room', dotColor: '#202735' },
]

export default function Viewport3D({
  text,
  color,
  textColor,
  materialName,
  scale,
  baseGeometry,
  reliefGeometry,
  geometryStatus,
  dimensions,
}) {
  const controlsRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [surfacePreset, setSurfacePreset] = useState('matte')
  const [surfaceMenuOpen, setSurfaceMenuOpen] = useState(false)
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

  function setViewAngle(type) {
    const controls = controlsRef.current
    if (!controls) return
    const dist = controls.object.position.length() || 4
    if (type === 'top') {
      controls.object.position.set(0, dist, 0.001)
    } else if (type === 'front') {
      controls.object.position.set(0, 0, dist)
    } else if (type === 'isometric') {
      controls.object.position.set(dist * 0.5, dist * 0.5, dist * 0.7)
    }
    controls.target.set(0, 0, 0)
    controls.update()
  }

  if (!webglAvailable) {
    return (
      <PreviewUnavailable message="Your browser or device doesn't support 3D previews. You can still choose your customization." />
    )
  }

  const surfaceBackgrounds = {
    matte: {
      backgroundColor: '#f3efe8',
      backgroundImage: 'linear-gradient(rgba(168,118,62,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(168,118,62,0.06) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    },
    graph: {
      backgroundColor: '#e6e2da',
      backgroundImage: 'linear-gradient(rgba(100,100,100,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.15) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    },
    dark: {
      backgroundColor: '#1e232d',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    },
  }

  return (
    <ThreeErrorBoundary
      fallback={
        <PreviewUnavailable message="The 3D preview couldn't be rendered. Your customization choices are unaffected." />
      }
    >
      <div className="relative flex flex-col overflow-hidden rounded-card border border-border shadow-card bg-surface">
        {/* Viewport canvas wrapper */}
        <div
          className="relative aspect-4/3 w-full overflow-hidden transition-colors"
          style={surfaceBackgrounds[surfacePreset] || surfaceBackgrounds.matte}
        >
          {/* Surface selector dropdown */}
          <div className="absolute top-3 right-3 z-20">
            <button
              type="button"
              onClick={() => setSurfaceMenuOpen(!surfaceMenuOpen)}
              className="flex items-center gap-1.5 rounded-control border border-border/70 bg-surface/90 px-2.5 py-1 text-xs font-medium text-ink shadow-sm backdrop-blur-sm hover:border-ink/40"
            >
              <span
                className="h-2.5 w-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: SURFACE_PRESETS.find((p) => p.id === surfacePreset)?.dotColor }}
              />
              <span className="capitalize">{surfacePreset}</span>
              <span className="text-[10px] text-muted">▼</span>
            </button>

            {surfaceMenuOpen && (
              <div className="absolute right-0 mt-1 w-32 rounded-control border border-border bg-surface p-1 shadow-lg z-30">
                {SURFACE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSurfacePreset(preset.id)
                      setSurfaceMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-left transition-colors ${
                      surfacePreset === preset.id ? 'bg-accent/10 font-semibold text-accent-dark' : 'hover:bg-paper text-ink'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: preset.dotColor }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading overlay */}
          {!ready && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/80">
              <span className="text-xs font-medium text-muted">Loading 3D preview…</span>
            </div>
          )}

          {/* Drag to rotate hint badge */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-medium text-paper backdrop-blur-xs">
            Drag to rotate
          </div>

          {/* 3D Canvas */}
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
        </div>

        {/* Reference Bottom Inspection Toolbar (Dark Pill Bar) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-[#212735] px-3 py-2 text-white sm:px-4">
          {/* Quick preset views */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewAngle('isometric')}
              title="Perspective View"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
            >
              ⬡
            </button>
            <button
              type="button"
              onClick={() => setViewAngle('top')}
              title="Top View"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
            >
              ⊤
            </button>
            <button
              type="button"
              onClick={() => setViewAngle('front')}
              title="Front View"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
            >
              ⊡
            </button>
          </div>

          {/* Zoom & Reset Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => zoomBy(0.85)}
              aria-label="Zoom in"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-white/10 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoomBy(1 / 0.85)}
              aria-label="Zoom out"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-white/10 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetView}
              className="flex h-7 items-center justify-center rounded-control bg-white/10 px-2 text-[11px] font-medium text-white hover:bg-white/20 transition-colors"
            >
              Reset view
            </button>
          </div>

          {/* Dimensions readout */}
          {dimensions && (
            <div className="text-[11px] font-medium text-white/80">
              {dimensions.widthMm.toFixed(1)} × {dimensions.heightMm.toFixed(1)} mm
            </div>
          )}
        </div>
      </div>

      {geometryStatus === 'loading' && (
        <p className="mt-2 text-xs text-muted">Updating 3D geometry…</p>
      )}
      {geometryStatus === 'error' && (
        <p className="mt-2 text-xs text-danger">
          Couldn't generate that shape — showing preview model. Try adjusting your text or style options.
        </p>
      )}
    </ThreeErrorBoundary>
  )
}
