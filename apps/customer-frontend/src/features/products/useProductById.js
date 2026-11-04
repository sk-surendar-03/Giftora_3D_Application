import { useEffect, useState } from 'react'
import { fetchProducts } from './productsApi'
import { mapApiProduct } from './mapApiProduct'

// The backend (Phase 3) only exposes product lookup by slug, not by id —
// deliberately not adding a new backend route for this (out of scope for a
// frontend-only phase). `/customise/:productId` already links by id (see
// ProductDetail.jsx/Hero.jsx), so this fetches the product list and finds
// the match client-side, the same way the old static-data version did
// (`sampleProducts.find(p => p.id === productId)`).
export default function useProductById(productId) {
  const [state, setState] = useState({ data: null, isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(() => {
      if (!productId) {
        setState({ data: null, isLoading: false, error: null })
        return
      }
      setState({ data: null, isLoading: true, error: null })
      fetchProducts({ pageSize: 100 }, controller.signal)
        .then((result) => {
          const match = result.products.find((p) => p.id === productId)
          setState({ data: match ? mapApiProduct(match) : null, isLoading: false, error: null })
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          setState({ data: null, isLoading: false, error: err })
        })
    }, 0)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [productId])

  return state
}
