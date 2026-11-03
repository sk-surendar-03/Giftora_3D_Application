import { useEffect, useMemo, useRef } from 'react'
import { meshBufferToThreeGeometry } from './meshBufferToThreeGeometry.js'

/**
 * Converts a GeometryResult's baseMesh/reliefMesh into THREE.BufferGeometry
 * instances, disposing the previous pair whenever a new result arrives (or
 * this unmounts) to avoid leaking GPU buffers.
 * @param {import('./model/types').GeometryResult|null} result
 */
export function useResultGeometries(result) {
  const geometries = useMemo(() => {
    if (!result) return { baseGeometry: null, reliefGeometry: null }
    return { baseGeometry: meshBufferToThreeGeometry(result.baseMesh), reliefGeometry: meshBufferToThreeGeometry(result.reliefMesh) }
  }, [result])

  const previousRef = useRef(null)
  useEffect(() => {
    const previous = previousRef.current
    previousRef.current = geometries
    if (previous && previous !== geometries) {
      previous.baseGeometry?.dispose()
      previous.reliefGeometry?.dispose()
    }
  }, [geometries])

  useEffect(() => {
    return () => {
      previousRef.current?.baseGeometry?.dispose()
      previousRef.current?.reliefGeometry?.dispose()
      previousRef.current = null
    }
  }, [])

  return geometries
}
