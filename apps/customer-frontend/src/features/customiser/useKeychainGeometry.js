import { useEffect, useRef, useState } from 'react'
import { generateKeychainGeometry, loadFont } from './geometry/index.js'

const DEBOUNCE_MS = 300

/**
 * Generates the real, merged keychain geometry (tag + ring + engraved text,
 * via manifold-3d CSG) for the given font/text/size, debounced so typing
 * doesn't trigger a rebuild on every keystroke. Disposes the previous
 * BufferGeometry whenever it's replaced or the hook unmounts, to avoid
 * leaking GPU buffers.
 */
export function useKeychainGeometry({ fontUrl, text, sizeScale }) {
  const [state, setState] = useState({ status: 'loading', geometry: null, error: null })
  const geometryRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    const timer = setTimeout(async () => {
      setState((previous) => ({ ...previous, status: 'loading', error: null }))
      try {
        const font = await loadFont(fontUrl)
        if (requestIdRef.current !== requestId) return

        const { geometry } = await generateKeychainGeometry({ font, text, sizeScale })
        if (requestIdRef.current !== requestId) {
          geometry.dispose()
          return
        }

        if (geometryRef.current) geometryRef.current.dispose()
        geometryRef.current = geometry
        setState({ status: 'ready', geometry, error: null })
      } catch (error) {
        if (requestIdRef.current !== requestId) return
        setState((previous) => ({ ...previous, status: 'error', error }))
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [fontUrl, text, sizeScale])

  useEffect(() => {
    return () => {
      if (geometryRef.current) geometryRef.current.dispose()
    }
  }, [])

  return state
}
