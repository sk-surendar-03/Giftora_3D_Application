import { useState, useCallback } from 'react'
import {
  createStandDesign,
  uploadStandStl,
  uploadStandPreview,
  addStandToCart,
} from './standDesignApi.js'
// Use the SAME exporter as the "Download Binary STL" button — proven to produce valid STL
import { exportGeometryToBinaryStl } from '../standStudio/geometry/stlExporter.ts'

const PHASE_LABELS = {
  idle: 'Add to Cart',
  'creating-design': 'Creating design...',
  'uploading-stl': 'Uploading 3D model...',
  'uploading-preview': 'Uploading preview...',
  'adding-to-cart': 'Adding to cart...',
  done: 'Added',
}

export { PHASE_LABELS }

export function useAddStandToCart() {
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(false)

  const clearAdded = useCallback(() => {
    setAdded(false)
    setError(null)
    setPhase('idle')
  }, [])

  const addToCart = useCallback(async (payload) => {
    setError(null)
    setAdded(false)

    try {
      setPhase('creating-design')

      // Use the working exporter from stlExporter.ts
      const stlBytes = exportGeometryToBinaryStl(payload.assembly.mergedSolidGeometry)
      if (!stlBytes || stlBytes.byteLength < 84) {
        throw new Error('Could not generate STL from the current 3D model.')
      }
      const stlBlob = new Blob([stlBytes], { type: 'application/octet-stream' })
      const sha256 = await sha256Hex(stlBytes)

      const createData = await createStandDesign(payload.design)
      const standDesignId = createData.design && createData.design.id
      if (!standDesignId) throw new Error('Server did not return a design ID.')

      setPhase('uploading-stl')
      // The server measures the volume from these bytes and sets the price.
      await uploadStandStl(standDesignId, stlBlob, { sha256 })

      setPhase('uploading-preview')
      try {
        if (typeof payload.capturePreview === 'function') {
          const dataUrl = await payload.capturePreview()
          if (dataUrl) {
            const pngBlob = dataUrlToBlob(dataUrl)
            if (pngBlob) await uploadStandPreview(standDesignId, pngBlob)
          }
        }
      } catch (previewErr) {
        console.warn('Preview upload skipped:', previewErr)
      }

      setPhase('adding-to-cart')
      await addStandToCart({
        standDesignId,
        quantity: payload.quantity,
        shippingMethod: payload.shippingMethod,
      })

      setPhase('done')
      setAdded(true)
      return { standDesignId }
    } catch (err) {
      const message = (err && err.response && err.response.data && err.response.data.error) || (err && err.message) || 'Something went wrong.'
      setError(message)
      setPhase('idle')
      throw err
    }
  }, [])

  return {
    addToCart,
    phase,
    error,
    added,
    busy: phase !== 'idle' && phase !== 'done',
    clearAdded,
  }
}

async function sha256Hex(bytes) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(function (b) { return b.toString(16).padStart(2, '0') }).join('')
}

function dataUrlToBlob(dataUrl) {
  try {
    const parts = dataUrl.split(',')
    if (!parts[1]) return null
    const mimeMatch = /:(.*?);/.exec(parts[0])
    const mime = mimeMatch ? mimeMatch[1] : 'image/png'
    const binary = atob(parts[1])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  } catch (e) {
    return null
  }
}