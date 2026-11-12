import { useEffect, useState } from 'react'
import { fetchPricing } from './pricingApi'

export function usePricing() {
  const [state, setState] = useState({ perCharacterPriceCents: null, baseCharacters: 0, basePriceCents: 0, isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    fetchPricing(controller.signal)
      .then((pricing) => setState({
        perCharacterPriceCents: pricing.perCharacterPriceCents,
        baseCharacters: pricing.baseCharacters ?? 0,
        basePriceCents: pricing.basePriceCents ?? 0,
        isLoading: false,
        error: null,
      }))
      .catch((err) => {
        if (controller.signal.aborted) return
        setState({ perCharacterPriceCents: null, baseCharacters: 0, basePriceCents: 0, isLoading: false, error: err })
      })
    return () => controller.abort()
  }, [])

  return state
}
