import { useState, useCallback } from 'react'
import {
  createNameplateDesign,
  uploadNameplateStl,
  uploadNameplatePreview,
} from '../api/nameplateDesignApi.js'
import { collectPrintablePartsFromGroup, generateBinarySTL, disposeExportParts } from '../geometry/stlExporter.ts'
import api from '../../../services/api'

export const PHASE_LABELS = {
  idle: 'Add Nameplate to Cart',
  'compiling-stl': 'Compiling 3D mesh...',
  'creating-design': 'Creating design...',
  'uploading-stl': 'Uploading 3D model...',
  'uploading-preview': 'Uploading preview...',
  'adding-to-cart': 'Adding to cart...',
  done: 'Added',
}

async function sha256Hex(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}

export function useAddNameplateToCart() {
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
      setPhase('compiling-stl')
      const rootGroup = payload.exportGroup
      if (!rootGroup) throw new Error('3D model is not ready yet.')

      const parts = collectPrintablePartsFromGroup(rootGroup)
      if (parts.length === 0) throw new Error('No printable geometry found.')

      const stlBuffer = generateBinarySTL(parts)
      disposeExportParts(parts)

      if (!stlBuffer || stlBuffer.byteLength < 84) {
        throw new Error('Could not generate binary STL from the current 3D model.')
      }

      const stlBlob = new Blob([stlBuffer], { type: 'application/octet-stream' })
      const sha256 = await sha256Hex(stlBuffer)

      setPhase('creating-design')
      const createRes = await createNameplateDesign({
        nameplateType: payload.design.type,
        shape: payload.design.shape,
        mountingStyle: payload.design.mountingStyle,
        designConfig: payload.design,
      })

      const nameplateDesignId = createRes?.id
      if (!nameplateDesignId) throw new Error('Server did not return a design ID.')

      setPhase('uploading-stl')
      await uploadNameplateStl(nameplateDesignId, stlBlob, sha256)

      setPhase('uploading-preview')
      try {
        if (typeof payload.capturePreview === 'function') {
          const dataUrl = await payload.capturePreview()
          if (dataUrl) {
            const pngBlob = dataUrlToBlob(dataUrl)
            if (pngBlob) await uploadNameplatePreview(nameplateDesignId, pngBlob)
          }
        }
      } catch (previewErr) {
        console.warn('Preview upload skipped:', previewErr)
      }

      setPhase('adding-to-cart')
      const cartRes = await api.post('/cart/nameplate-items', {
        nameplateDesignId,
        quantity: payload.quantity || 1,
        shippingMethod: payload.shippingMethod,
      })

      if (typeof window !== 'undefined' && cartRes.data?.cart) {
        window.dispatchEvent(new CustomEvent('giftora:cart-updated', { detail: cartRes.data.cart }))
      }

      setPhase('done')
      setAdded(true)
      return { nameplateDesignId }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong.'
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
