import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
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

const PREVIEW_MAX_WIDTH = 640
const PREVIEW_BACKGROUND = '#f3f6fb'

// Gives the page a way to snapshot the current 3D view as a PNG (used as the
// design's preview image in the cart and the admin panel). The canvas is read
// in the same task as a fresh render, which is when WebGL's drawing buffer is
// still valid, and drawn onto a fixed light background at a bounded size.
function PreviewCaptureBridge({ onCaptureReady }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!onCaptureReady) return undefined
    onCaptureReady(
      () =>
        new Promise((resolve, reject) => {
          gl.render(scene, camera)
          const source = gl.domElement
          const scale = Math.min(1, PREVIEW_MAX_WIDTH / source.width)
          const target = document.createElement('canvas')
          target.width = Math.max(32, Math.round(source.width * scale))
          target.height = Math.max(32, Math.round(source.height * scale))
          const context = target.getContext('2d')
          context.fillStyle = PREVIEW_BACKGROUND
          context.fillRect(0, 0, target.width, target.height)
          context.drawImage(source, 0, 0, target.width, target.height)
          target.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not capture the preview image.'))), 'image/png')
        }),
    )
    return () => onCaptureReady(null)
  }, [gl, scene, camera, onCaptureReady])
  return null
}

export default function Viewport3D({
  text,
  color,
  textColor,
  materialName,
  scale,
  baseGeometry,
  reliefGeometry,
  geometryStatus,
  geometryError,
  onRetry,
  dimensions,
  onCaptureReady,
}) {
  const controlsRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [surfacePreset, setSurfacePreset] = useState('matte')
  const [surfaceMenuOpen, setSurfaceMenuOpen] = useState(false)
  const webglAvailable = useMemo(() => isWebGLAvailable(), [])

  // Progressive loading status steps
  const [phaseIndex, setPhaseIndex] = useState(0)
  const loadingPhases = [
    { title: 'Initializing 3D engine…', subtitle: 'Loading CSG kernel & font definitions' },
    { title: 'Generating 3D model…', subtitle: 'Computing solid manifold layers & extrusions' },
    { title: 'Preparing solid preview…', subtitle: 'Finalizing mesh buffers & rendering solid' },
  ]

  const isInitialLoading = (!baseGeometry || !reliefGeometry) && geometryStatus === 'loading'
  const isUpdating = baseGeometry && reliefGeometry && geometryStatus === 'loading'
  const isError = geometryStatus === 'error' && (!baseGeometry || !reliefGeometry)

  useEffect(() => {
    if (!isInitialLoading) {
      setPhaseIndex(0)
      return undefined
    }

    setPhaseIndex(0)
    const t1 = setTimeout(() => setPhaseIndex(1), 1100)
    const t2 = setTimeout(() => setPhaseIndex(2), 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isInitialLoading])

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
      backgroundColor: '#f3f6fb',
      backgroundImage: 'linear-gradient(#dbe4f0 1px, transparent 1px), linear-gradient(90deg, #dbe4f0 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    },
    graph: {
      backgroundColor: '#e6e2da',
      backgroundImage: 'linear-gradient(rgba(100,100,100,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.15) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    },
    dark: {
      backgroundColor: '#0D0D0D',
      backgroundImage: 'linear-gradient(#262626 1px, transparent 1px), linear-gradient(90deg, #262626 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    },
  }

  return (
    <ThreeErrorBoundary
      fallback={
        <PreviewUnavailable message="The 3D preview couldn't be rendered. Your customization choices are unaffected." />
      }
    >
      <div className="relative flex flex-col overflow-hidden rounded-card border border-line bg-surface">
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

          {/* Updating indicator pill (when changing text/options while model is already loaded) */}
          {isUpdating && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full border border-accent/40 bg-surface/90 px-3 py-1 text-[11.5px] font-medium text-accent shadow-md backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
              <span>Updating 3D model…</span>
            </div>
          )}

          {/* Initial 3D engine initialization & model generation loading overlay */}
          {isInitialLoading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-[#0a0b0e]/95 backdrop-blur-md">
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                {/* Inner pulsing core */}
                <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                </div>
              </div>

              <h3 className="font-display text-[17px] font-semibold text-ink m-0 tracking-tight">
                {loadingPhases[phaseIndex].title}
              </h3>
              <p className="font-sans text-[13px] text-muted max-w-xs mt-1.5 mb-4">
                {loadingPhases[phaseIndex].subtitle}
              </p>

              {/* Progress track */}
              <div className="h-1 w-48 overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full bg-accent transition-all duration-700 ease-out"
                  style={{ width: `${((phaseIndex + 1) / loadingPhases.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error overlay with retry option */}
          {isError && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-[#0a0b0e]/95 backdrop-blur-md">
              <div className="h-12 w-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="font-display text-[17px] font-semibold text-ink m-0">3D Generation Error</h3>
              <p className="font-sans text-[13px] text-muted max-w-sm mt-1.5 mb-5">
                {geometryError?.message || "Couldn't generate that 3D solid geometry. Try adjusting your text or style options."}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-control bg-accent px-4 py-2 text-xs font-semibold text-on-accent hover:bg-accent-dark transition-colors cursor-pointer"
                >
                  Retry Generation
                </button>
              )}
            </div>
          )}

          {/* Canvas loading fallback if WebGL context creation takes a moment */}
          {!ready && !isInitialLoading && !isError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/80">
              <span className="text-xs font-medium text-muted">Preparing 3D viewport…</span>
            </div>
          )}

          {/* Drag to rotate hint badge */}
          {!isInitialLoading && !isError && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#1d2230] shadow-sm">
              Drag to rotate
            </div>
          )}

          {/* 3D Canvas */}
          <Canvas camera={{ position: INITIAL_CAMERA_POSITION, fov: 45 }} onCreated={() => setReady(true)}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 4, 3]} intensity={1.1} />
            <directionalLight position={[-3, -2, -2]} intensity={0.3} />
            <PreviewCaptureBridge onCaptureReady={onCaptureReady} />
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

        {/* Bottom Inspection Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface px-3 py-2 text-ink sm:px-4">
          {/* Quick preset views */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewAngle('isometric')}
              title="Perspective View"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-soft border border-line text-xs text-ink hover:border-accent hover:text-accent transition-colors"
            >
              ⬡
            </button>
            <button
              type="button"
              onClick={() => setViewAngle('top')}
              title="Top View"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-soft border border-line text-xs text-ink hover:border-accent hover:text-accent transition-colors"
            >
              ⊤
            </button>
            <button
              type="button"
              onClick={() => setViewAngle('front')}
              title="Front View"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-soft border border-line text-xs text-ink hover:border-accent hover:text-accent transition-colors"
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
              className="flex h-7 w-7 items-center justify-center rounded-control bg-soft border border-line text-sm font-bold text-ink hover:border-accent hover:text-accent transition-colors"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => zoomBy(1 / 0.85)}
              aria-label="Zoom out"
              className="flex h-7 w-7 items-center justify-center rounded-control bg-soft border border-line text-sm font-bold text-ink hover:border-accent hover:text-accent transition-colors"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetView}
              className="flex h-7 items-center justify-center rounded-control bg-soft border border-line px-2 text-[11px] font-medium text-ink hover:border-accent hover:text-accent transition-colors"
            >
              Reset view
            </button>
          </div>

          {/* Dimensions readout */}
          {dimensions && (
            <div className="text-[11.5px] font-mono text-muted">
              {dimensions.widthMm.toFixed(1)} × {dimensions.heightMm.toFixed(1)} mm
            </div>
          )}
        </div>
      </div>

      {geometryStatus === 'error' && !isError && (
        <p className="mt-2 text-xs text-danger">
          {geometryError?.message || 'Could not compute 3D geometry. Please adjust your text or parameters.'}
        </p>
      )}
    </ThreeErrorBoundary>
  )
}
