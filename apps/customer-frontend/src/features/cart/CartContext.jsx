import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { fetchCart, addCartItem, updateCartItemQuantity, removeCartItem } from './cartApi.js'

export const EMPTY_CART = { id: null, items: [], subtotalCents: 0, totalCents: 0 }

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({ data: null, isLoading: isAuthenticated, error: null })
  const [mutating, setMutating] = useState(false)
  const [mutationError, setMutationError] = useState(null)

  const load = useCallback(() => {
    if (!isAuthenticated) {
      setState({ data: null, isLoading: false, error: null })
      return () => {}
    }
    const controller = new AbortController()
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchCart(controller.signal)
      .then((cart) => setState({ data: cart, isLoading: false, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return
        setState({ data: null, isLoading: false, error: err })
      })
    return () => controller.abort()
  }, [isAuthenticated])

  useEffect(() => {
    const cancel = load()
    return cancel
  }, [load])

  // Listen for global cart update events (from standalone custom design add, checkout, etc.)
  useEffect(() => {
    function handleCartEvent(e) {
      if (e.detail) {
        setState({ data: e.detail, isLoading: false, error: null })
      } else {
        load()
      }
    }
    window.addEventListener('giftora:cart-updated', handleCartEvent)
    return () => window.removeEventListener('giftora:cart-updated', handleCartEvent)
  }, [load])

  async function runMutation(fn) {
    setMutating(true)
    setMutationError(null)
    try {
      const cart = await fn()
      setState({ data: cart, isLoading: false, error: null })
      window.dispatchEvent(new CustomEvent('giftora:cart-updated', { detail: cart }))
      return cart
    } catch (err) {
      setMutationError(err.response?.data?.error ?? err.message ?? 'Something went wrong.')
      throw err
    } finally {
      setMutating(false)
    }
  }

  const cart = state.data ?? EMPTY_CART
  const cartCount = cart.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0

  const value = {
    cart,
    cartCount,
    isAuthenticated,
    isLoading: state.isLoading,
    loadError: state.error,
    mutating,
    mutationError,
    addToCart: (payload) => runMutation(() => addCartItem(payload)),
    updateQuantity: (itemId, quantity) => runMutation(() => updateCartItemQuantity(itemId, quantity)),
    removeItem: (itemId) => runMutation(() => removeCartItem(itemId)),
    refetch: load,
    setCartData: (cartData) => setState({ data: cartData, isLoading: false, error: null }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
