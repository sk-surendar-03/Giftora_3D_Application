import { useState, useCallback } from 'react'
import {
  createPhotoLampDesign,
  uploadPhotoLampImage,
  uploadPhotoLampStl,
  uploadPhotoLampBaseStl,
  uploadPhotoLampPreview,
  addPhotoLampToCart as apiAddPhotoLampToCart,
} from '../api/photoLampDesignApi.js'
import { exportGeometryToBinarySTL } from '../geometry/stlExporter'

export const PHASE_LABELS = {
  idle: 'Add Photo Lamp to Cart',
  'uploading-photos': 'Processing & uploading photos...',
  'compiling-stl': 'Compiling 3D mesh...',
  'creating-design': 'Creating design...',
  'uploading-stl': 'Uploading lamp STL...',
  'uploading-base-stl': 'Uploading base STL...',
  'uploading-preview': 'Uploading preview...',
  'adding-to-cart': 'Adding to cart...',
  done: 'Added to Cart',
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

async function compressImageBlobIfNeeded(blob, maxBytes = 2 * 1024 * 1024, maxDimension = 1200) {
  if (!blob || blob.size <= maxBytes) return blob
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(blob)
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (compressedBlob) => {
          resolve(compressedBlob || blob)
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(blob)
    }
    img.src = url
  })
}

export function useAddPhotoLampToCart() {
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
      const {
        title = 'Custom Lithophane Photo Lamp',
        templateId = 'cylinder',
        shape = 'cylinder',
        printSettings,
        baseSettings,
        lightingSettings,
        personalization,
        photos = [],
        lithophaneGeometry,
        baseGeometry,
        capturePreview,
        quantity = 1,
        shippingMethod,
        note,
      } = payload

      if (!photos || photos.length === 0 || !photos[0]) {
        throw new Error('Please select at least one photo before adding to cart.')
      }

      setPhase('uploading-photos')
      // Ensure all photos have a server photoKey
      const sanitizedPhotos = []
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        if (!p) continue

        let photoKey = p.photoKey
        let sha256 = p.sha256
        if (!photoKey && (p.dataUrl || p.file || p.blob)) {
          let blob = p.blob || p.file
          if (!blob && p.dataUrl) {
            blob = dataUrlToBlob(p.dataUrl)
          }
          if (blob) {
            blob = await compressImageBlobIfNeeded(blob)
            const uploadRes = await uploadPhotoLampImage(blob, blob.type || 'image/jpeg')
            const photoData = uploadRes?.photo || uploadRes
            photoKey = photoData?.photoKey || uploadRes?.photoKey
            sha256 = photoData?.sha256 || uploadRes?.sha256
          }
        }

        sanitizedPhotos.push({
          slotIndex: p.slotIndex ?? i,
          photoKey: photoKey || undefined,
          sha256: sha256 || undefined,
          crop: p.crop || undefined,
          filter: p.filter || undefined,
          aspectRatio: p.aspectRatio,
        })
      }

      setPhase('compiling-stl')
      if (!lithophaneGeometry) {
        throw new Error('3D geometry is not generated yet. Please wait for the viewer to render.')
      }

      const panelStlBytes = exportGeometryToBinarySTL(
        lithophaneGeometry,
        `Giftora Photo Lamp - ${templateId}`
      )
      if (!panelStlBytes || panelStlBytes.byteLength < 84) {
        throw new Error('Could not generate binary STL for lithophane panel.')
      }
      if (panelStlBytes.byteLength > 2.95 * 1024 * 1024) {
        throw new Error('3D model mesh is too large for upload. Please set Print Settings resolution to Medium or Low.')
      }
      const panelSha256 = await sha256Hex(panelStlBytes)
      const panelBlob = new Blob([panelStlBytes], { type: 'application/octet-stream' })

      let baseBlob = null
      let baseSha256 = null
      if (baseGeometry && baseSettings?.enabled !== false) {
        const baseStlBytes = exportGeometryToBinarySTL(
          baseGeometry,
          `Giftora Lamp Base - ${templateId}`
        )
        if (baseStlBytes && baseStlBytes.byteLength >= 84) {
          baseSha256 = await sha256Hex(baseStlBytes)
          baseBlob = new Blob([baseStlBytes], { type: 'application/octet-stream' })
        }
      }

      setPhase('creating-design')
      const designConfig = {
        dimensions: {
          heightMm: printSettings?.modelHeightMm || 120,
          diameterMm: printSettings?.modelDiameterMm || 90,
          widthMm: printSettings?.modelWidthMm || 90,
          minThicknessMm: printSettings?.minThicknessMm || 0.8,
          maxThicknessMm: printSettings?.maxThicknessMm || 3.2,
        },
        base: {
          type: baseSettings?.enabled ? 'printed' : 'none',
          profile: baseSettings?.shape || 'circular',
        },
        lighting: {
          puckType: lightingSettings?.isOn ? (lightingSettings.colorPreset === 'cool' ? 'cool_white' : 'warm_white') : 'none',
        },
        personalization: {
          engravedText: personalization?.titleText || baseSettings?.engravedText || '',
          font: personalization?.fontFamily || 'Cinzel',
        },
      }

      const createRes = await createPhotoLampDesign({
        title,
        templateId,
        shape,
        photoKeys: sanitizedPhotos,
        photos: sanitizedPhotos,
        designConfig,
        printSettings,
        baseSettings,
        lightingSettings,
        personalization,
      })

      const designId = createRes?.id
      if (!designId) {
        throw new Error('Server did not return a valid design ID.')
      }

      setPhase('uploading-stl')
      await uploadPhotoLampStl(designId, panelBlob, panelSha256)

      if (baseBlob && baseSha256) {
        setPhase('uploading-base-stl')
        await uploadPhotoLampBaseStl(designId, baseBlob, baseSha256)
      }

      setPhase('uploading-preview')
      try {
        if (typeof capturePreview === 'function') {
          const previewDataUrl = await capturePreview()
          if (previewDataUrl) {
            const previewBlob = dataUrlToBlob(previewDataUrl)
            if (previewBlob) {
              await uploadPhotoLampPreview(designId, previewBlob)
            }
          }
        }
      } catch (previewErr) {
        console.warn('Lithophane preview snapshot skipped:', previewErr)
      }

      setPhase('adding-to-cart')
      const cartRes = await apiAddPhotoLampToCart({
        lithophaneDesignId: designId,
        quantity,
        shippingMethod,
        note,
      })

      if (typeof window !== 'undefined' && cartRes?.cart) {
        window.dispatchEvent(new CustomEvent('giftora:cart-updated', { detail: cartRes.cart }))
      }

      setPhase('done')
      setAdded(true)
      return { designId, cart: cartRes.cart }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong adding Photo Lamp to cart.'
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
