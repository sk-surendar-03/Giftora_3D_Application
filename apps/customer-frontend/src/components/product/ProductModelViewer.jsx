import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import api from '../../services/api'
import { disposeProductModel, parseProductModel } from '../../features/products/parseProductModel'
import { isWebGLAvailable } from '../../features/customiser/webgl'
import ThreeErrorBoundary from '../customiser/ThreeErrorBoundary'
import PreviewUnavailable from '../customiser/PreviewUnavailable'

// Interactive viewer for a product's uploaded STL / 3MF model. The file is
// fetched as binary through the API (never used as an <img> source) and parsed
// in the browser. Rotate with drag, zoom with wheel / pinch. No download control.
export default function ProductModelViewer({ model }) {
  const [state, setState] = useState({ status: 'loading', object: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let parsed = null
    api
      .get(model.url, { responseType: 'arraybuffer', signal: controller.signal })
      .then(({ data }) => {
        parsed = parseProductModel(data, model.format)
        setState({ status: 'ready', object: parsed.object, error: null })
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', object: null, error: err })
      })
    return () => {
      controller.abort()
      disposeProductModel(parsed?.object)
    }
  }, [model.url, model.format])

  if (!isWebGLAvailable()) return <PreviewUnavailable message="Your browser or device does not support WebGL, which the 3D preview needs." />
  if (state.status === 'error') return <PreviewUnavailable message="This 3D model could not be loaded. Please try again later." />

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-card border border-line bg-soft">
      {state.status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px] text-muted" role="status">
          Loading 3D model…
        </div>
      )}
      {state.status === 'ready' && (
        <ThreeErrorBoundary fallback={<PreviewUnavailable message="This 3D model could not be displayed." />}>
          <Canvas camera={{ position: [2.6, 1.8, 3.4], fov: 40 }} aria-label="Interactive 3D model preview">
            <ambientLight intensity={0.8} />
            <directionalLight position={[4, 6, 5]} intensity={1.6} />
            <directionalLight position={[-4, -2, -3]} intensity={0.5} />
            <primitive object={state.object} />
            <OrbitControls makeDefault enablePan={false} minDistance={1.8} maxDistance={9} />
          </Canvas>
          <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[11.5px] text-muted">Drag to rotate · scroll or pinch to zoom</p>
        </ThreeErrorBoundary>
      )}
    </div>
  )
}
