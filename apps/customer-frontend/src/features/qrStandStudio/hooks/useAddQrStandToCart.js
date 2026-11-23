import { useState, useCallback } from 'react'
import {
  createQrStandDesign,
  uploadQrStandStl,
  uploadQrStandPreview,
  addQrStandToCart as apiAddQrStandToCart,
} from '../api/qrStandDesignApi.js'
import { generateCombinedStlBinary } from '../core/exportManager'
import { generateStandGeometry } from '../geometry/standGeometry'
import { buildQRPayload, generateQRMatrix } from '../core/qrGenerator'
import { validateCenterLogo } from '../core/qrLogoValidator'

export const PHASE_LABELS = {
  idle: 'Add QR Stand to Cart',
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

export function useAddQrStandToCart() {
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
      const design = payload.design
      if (!design) throw new Error('Design configuration is missing.')

      const primaryQr = design.qrCodes?.[0]
      if (!primaryQr) throw new Error('At least one QR code must be configured.')

      const qrPayload = buildQRPayload(primaryQr.type, primaryQr.fields)
      if (!qrPayload || !qrPayload.trim()) {
        throw new Error('Please fill in a valid QR payload before adding to cart.')
      }

      // Calculate actual QR version and reject oversized payloads
      let calculatedVersion
      try {
        const matrixResult = generateQRMatrix(qrPayload, primaryQr.errorCorrection || 'H')
        calculatedVersion = matrixResult.version
      } catch (err) {
        throw new Error(
          err?.message?.includes('Data too long')
            ? `The QR payload exceeds maximum supported capacity for error correction level ${primaryQr.errorCorrection || 'H'}. Please shorten the text or reduce fields.`
            : `Could not generate valid QR matrix: ${err?.message}`
        )
      }

      if (!Number.isInteger(calculatedVersion) || calculatedVersion < 1 || calculatedVersion > 14) {
        throw new Error(`Invalid calculated QR version (${calculatedVersion}). Supported versions are 1 to 14.`)
      }

      // If center logo is enabled, enforce logo constraints before allowing cart addition
      if (design.logo?.enabled) {
        const logoReport = validateCenterLogo(primaryQr, design.logo)
        if (!logoReport.isValid) {
          const firstErr = logoReport.issues.find((i) => i.severity === 'error')
          throw new Error(firstErr?.message || 'The center logo configuration is invalid or unsafe for physical scanning.')
        }
      }

      setPhase('compiling-stl')
      const parts = payload.parts || generateStandGeometry(design)
      const stlBytes = generateCombinedStlBinary(design, parts)

      if (!stlBytes || stlBytes.byteLength < 84) {
        throw new Error('Could not generate binary STL from the current 3D QR Stand model.')
      }

      const stlBlob = new Blob([stlBytes], { type: 'application/octet-stream' })
      const sha256 = await sha256Hex(stlBytes.buffer)

      setPhase('creating-design')
      const createRes = await createQrStandDesign({
        title: design.name || 'Custom QR Stand',
        templateId: design.templateId,
        printMode: design.printingMode,
        qrType: primaryQr.type,
        qrPayload,
        qrVersion: calculatedVersion,
        errorCorrection: primaryQr.errorCorrection || 'H',
        designConfig: design,
      })

      const qrStandDesignId = createRes?.id
      if (!qrStandDesignId) throw new Error('Server did not return a design ID.')

      setPhase('uploading-stl')
      await uploadQrStandStl(qrStandDesignId, stlBlob, sha256)

      setPhase('uploading-preview')
      try {
        if (typeof payload.capturePreview === 'function') {
          const dataUrl = await payload.capturePreview()
          if (dataUrl) {
            const pngBlob = dataUrlToBlob(dataUrl)
            if (pngBlob) await uploadQrStandPreview(qrStandDesignId, pngBlob)
          }
        }
      } catch (previewErr) {
        console.warn('Preview upload skipped:', previewErr)
      }

      setPhase('adding-to-cart')
      const cartRes = await apiAddQrStandToCart({
        qrStandDesignId,
        quantity: payload.quantity || 1,
        shippingMethod: payload.shippingMethod,
        note: payload.note,
      })

      if (typeof window !== 'undefined' && cartRes?.cart) {
        window.dispatchEvent(new CustomEvent('giftora:cart-updated', { detail: cartRes.cart }))
      }

      setPhase('done')
      setAdded(true)
      return { qrStandDesignId }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong adding QR Stand to cart.'
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
