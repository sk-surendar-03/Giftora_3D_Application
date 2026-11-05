import { useEffect, useState } from 'react'
import { fetchProductBySlug } from './productsApi'
import { mapApiProduct } from './mapApiProduct'

export default function useProduct(slug) {
  const [state, setState] = useState({ data: null, isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(() => {
      if (!slug) {
        setState({ data: null, isLoading: false, error: null })
        return
      }
      setState({ data: null, isLoading: true, error: null })
      fetchProductBySlug(slug, controller.signal)
        .then((product) => setState({ data: mapApiProduct(product), isLoading: false, error: null }))
        .catch((err) => {
          if (controller.signal.aborted) return
          if (err.response?.status === 404) {
            // Not found is a real, expected data state here (the page
            // already renders <ProductUnavailable /> when `data` is null)
            // — not an error state.
            setState({ data: null, isLoading: false, error: null })
          } else {
            setState({ data: null, isLoading: false, error: err })
          }
        })
    }, 0)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [slug])

  return state
}
