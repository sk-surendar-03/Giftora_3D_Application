import { useRef, useState } from 'react'
import { addCustomDesignToCart, createDesign, uploadDesignPreview, uploadDesignStl } from './customDesignApi.js'
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
      const file = await client.export(params, 'stl', 'separate-colors', fontDefinition, undefined, subtitleFontDefinition, allowDisconnected)
      const sha256 = await sha256Hex(file.data)

      setPhase('saving')
      const { design: record, needsStl } = await createDesign(design)

      setPhase('uploading')
      if (needsStl) {
        try {
          await uploadDesignStl(record.id, file.data, sha256)
        } catch (err) {
          // 409: this design already has its (immutable) STL from an earlier
          // attempt — that stored file is the one that will be made.
          if (err?.response?.status !== 409) throw err
        }
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
