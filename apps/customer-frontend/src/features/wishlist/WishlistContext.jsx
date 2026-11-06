import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { fetchWishlist, addWishlist, removeWishlist } from './wishlistApi.js'

const WishlistContext = createContext(null)

const LOCAL_STORAGE_KEY = 'giftora_guest_wishlist'

function loadGuestWishlist() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveGuestWishlist(ids) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Ignore storage quota errors
  }
}

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [wishlistProductIds, setWishlistProductIds] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load wishlist when authentication changes
  const load = useCallback(() => {
    if (!isAuthenticated) {
      // For guest visitors, restore from localStorage
      const guestIds = loadGuestWishlist()
      setWishlistProductIds(new Set(guestIds))
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetchWishlist(controller.signal)
      .then((data) => {
        const ids = new Set(data.productIds || [])
        // Merge any guest wishlisted items into customer account seamlessly
        const guestIds = loadGuestWishlist()
        if (guestIds.length > 0) {
          Promise.allSettled(guestIds.map((id) => addWishlist(id))).then(() => {
            saveGuestWishlist([])
          })
          guestIds.forEach((id) => ids.add(id))
        }
        setWishlistProductIds(ids)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err.response?.data?.error ?? err.message ?? 'Failed to load wishlist')
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [isAuthenticated])

  useEffect(() => {
    const cleanup = load()
    return () => {
      if (cleanup) cleanup()
    }
  }, [load])

  const isWishlisted = useCallback(
    (productId) => {
      if (!productId) return false
      return wishlistProductIds.has(productId)
    },
    [wishlistProductIds]
  )

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!productId) return false

      const currentlyWishlisted = wishlistProductIds.has(productId)
      const nextSet = new Set(wishlistProductIds)

      // Optimistic UI update
      if (currentlyWishlisted) {
        nextSet.delete(productId)
      } else {
        nextSet.add(productId)
      }
      setWishlistProductIds(nextSet)

      if (!isAuthenticated) {
        saveGuestWishlist(Array.from(nextSet))
        return !currentlyWishlisted
      }

      try {
        if (currentlyWishlisted) {
          await removeWishlist(productId)
        } else {
          await addWishlist(productId)
        }
        return !currentlyWishlisted
      } catch (err) {
        // Rollback on failure so UI does not lie
        setWishlistProductIds(new Set(wishlistProductIds))
        const message = err.response?.data?.error ?? err.message ?? 'Wishlist update failed.'
        setError(message)
        throw err
      }
    },
    [wishlistProductIds, isAuthenticated]
  )

  return (
    <WishlistContext.Provider
      value={{
        wishlistProductIds,
        isWishlisted,
        toggleWishlist,
        isLoading,
        error,
        refetch: load,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
