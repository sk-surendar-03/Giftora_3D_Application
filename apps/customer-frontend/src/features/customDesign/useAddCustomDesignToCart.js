import { useRef, useState } from 'react'
import { addCustomDesignToCart, createDesign, uploadDesignPreview, uploadDesignReliefStl, uploadDesignStl } from './customDesignApi.js'
import { clearDraft } from './designDraft.js'

async function sha256Hex(buffer) {
  if (!globalThis.crypto?.subtle) return undefined
  const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function messageFrom(error) {
  return error?.response?.data?.error ?? error?.failure?.message ?? error?.message ?? 'Something went wrong. Please try again.'
}

export const PHASE_LABELS = {
  exporting: 'Generating STL…',
  saving: 'Saving your design…',
  uploading: 'Uploading files…',
  adding: 'Adding to cart…',
}

/**
 * Add-to-cart for a standalone design: generate the STL with the existing
 * geometry engine, record the design (validated and priced on the server),
 * upload the STL (and a preview image), then add it to the cart. Every step
 * is safe to repeat, so a failed attempt can simply be retried.
 */
export function useAddCustomDesignToCart() {
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(false)
  const running = useRef(false)

  async function addToCart({ client, params, fontDefinition, subtitleFontDefinition, allowDisconnected, design, quantity, capturePreview }) {
    if (running.current) return
    running.current = true
    setError(null)
    setAdded(false)
    try {
      setPhase('exporting')
      // Export base + relief (text) meshes separately for two-color 3MF support in admin
      const dual = await client.exportDual(params, fontDefinition, subtitleFontDefinition, allowDisconnected)
      const [mergedSha256, reliefSha256] = await Promise.all([sha256Hex(dual.mergedData), sha256Hex(dual.reliefData)])

      setPhase('saving')
      const { design: record, needsStl } = await createDesign(design)

      setPhase('uploading')
      if (needsStl) {
        try {
          await uploadDesignStl(record.id, dual.mergedData, mergedSha256)
        } catch (err) {
          if (err?.response?.status !== 409) throw err
        }
      }
      // Always try to upload the relief (text) STL — idempotent, never blocks the order
      try {
        await uploadDesignReliefStl(record.id, dual.reliefData, reliefSha256)
      } catch (err) {
        console.warn('Relief STL upload failed (non-blocking):', err?.message)
      }
      if (capturePreview) {
        try {
          const png = await capturePreview()
          if (png) await uploadDesignPreview(record.id, png)
        } catch (err) {
          // The preview is a convenience for the shop; never block the order on it.
          console.warn('Design preview was not saved:', err)
        }
      }

      setPhase('adding')
      await addCustomDesignToCart({ customDesignId: record.id, quantity })
      clearDraft()
      setAdded(true)
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setPhase('idle')
      running.current = false
    }
  }

  return { addToCart, phase, error, added, busy: phase !== 'idle', clearAdded: () => setAdded(false) }
}
