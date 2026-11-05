import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { fetchCart, addCartItem, updateCartItemQuantity, removeCartItem } from './cartApi.js'

const EMPTY_CART = { id: null, items: [], subtotalCents: 0, totalCents: 0 }

/**
 * A cart only exists for an authenticated account (Cart.userId is unique
 * in the schema — see Phase 1) — this hook never calls the backend while
 * signed out, returning a clear `{ data: null, isLoading: false, error: null }`
 * that the page interprets as "please sign in", not a failed fetch.
 */
export function useCart() {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({ data: null, isLoading: isAuthenticated, error: null })
  const [mutating, setMutating] = useState(false)
  const [mutationError, setMutationError] = useState(null)

  const load = useCallback(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setState({ data: null, isLoading: false, error: null })
        return
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      fetchCart(controller.signal)
        .then((cart) => setState({ data: cart, isLoading: false, error: null }))
        .catch((err) => {
          if (controller.signal.aborted) return
          setState({ data: null, isLoading: false, error: err })
        })
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isAuthenticated])

  useEffect(() => load(), [load])

  async function runMutation(fn) {
    setMutating(true)
    setMutationError(null)
    try {
      const cart = await fn()
      setState({ data: cart, isLoading: false, error: null })
      return cart
    } catch (err) {
      setMutationError(err.response?.data?.error ?? err.message ?? 'Something went wrong.')
      throw err
    } finally {
      setMutating(false)
    }
  }

  return {
    cart: state.data ?? EMPTY_CART,
    isAuthenticated,
    isLoading: state.isLoading,
    loadError: state.error,
    mutating,
    mutationError,
    addToCart: (payload) => runMutation(() => addCartItem(payload)),
    updateQuantity: (itemId, quantity) => runMutation(() => updateCartItemQuantity(itemId, quantity)),
    removeItem: (itemId) => runMutation(() => removeCartItem(itemId)),
    refetch: load,
  }
}
