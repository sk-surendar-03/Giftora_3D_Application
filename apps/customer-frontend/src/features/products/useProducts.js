import { useEffect, useState } from 'react'
import { fetchProducts } from './productsApi'
import { mapApiProduct } from './mapApiProduct'

// The catalog is small enough that fetching one large page preserves the
// existing client-side faceted filter/sort UX in Products.jsx (multi-select
// categories/materials, a price range, a search box) exactly as it was
// against the static sample data, rather than re-architecting that UI into
// server-driven pagination — which the backend's /products endpoint does
// support (page/pageSize/search/category/material/minPrice/maxPrice/sort)
// for a future larger catalog.
const LIST_PAGE_SIZE = 100

export default function useProducts() {
  const [state, setState] = useState({ data: [], isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()

    // Deferred a tick (same escape hatch `useGeometryEngine` uses) so the
    // "start loading" reset isn't a setState called synchronously at the
    // top of the effect body.
    const timer = setTimeout(() => {
      setState({ data: [], isLoading: true, error: null })
      fetchProducts({ pageSize: LIST_PAGE_SIZE, sort: 'newest' }, controller.signal)
        .then((result) => {
          setState({ data: result.products.map(mapApiProduct), isLoading: false, error: null })
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          setState({ data: [], isLoading: false, error: err })
        })
    }, 0)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [])

  return state
}
