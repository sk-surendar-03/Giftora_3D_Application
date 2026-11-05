import { useEffect, useState } from 'react'
import { fetchPricing } from './pricingApi'

// The per-character rate is entirely admin-configured (Settings page in the
// admin frontend) — nothing here hardcodes a price, only fetches whatever
// rate is currently stored.
export function usePricing() {
  const [state, setState] = useState({ perCharacterPriceCents: null, isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    fetchPricing(controller.signal)
      .then((pricing) => setState({ perCharacterPriceCents: pricing.perCharacterPriceCents, isLoading: false, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return
        setState({ perCharacterPriceCents: null, isLoading: false, error: err })
      })
    return () => controller.abort()
  }, [])

  return state
}
