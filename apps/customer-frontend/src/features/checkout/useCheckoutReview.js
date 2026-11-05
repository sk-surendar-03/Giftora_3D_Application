import { useEffect, useState } from 'react'
import { reviewCheckout } from './checkoutApi.js'

/**
 * Re-runs the server-side checkout revalidation whenever the selected
 * address changes. The result (prices, availability, totals) always comes
 * from this call — nothing here is computed from the client's own cart
 * state, per the "don't trust client-submitted totals" requirement.
 */
export function useCheckoutReview(addressId) {
  const [state, setState] = useState({ data: null, isLoading: Boolean(addressId), error: null })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!addressId) {
        setState({ data: null, isLoading: false, error: null })
        return
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      reviewCheckout(addressId)
        .then((result) => setState({ data: result, isLoading: false, error: null }))
        .catch((err) => setState({ data: null, isLoading: false, error: err }))
    }, 0)
    return () => clearTimeout(timer)
  }, [addressId])

  return state
}
