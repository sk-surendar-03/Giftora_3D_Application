import { useMemo } from 'react'
import { sampleProducts } from '../../data/sampleProducts'

// Stand-in for a future product-service API call, keeping the same
// { data, isLoading, error } shape useProducts() uses for the catalog.
export default function useProduct(slug) {
  const data = useMemo(() => sampleProducts.find((p) => p.slug === slug) ?? null, [slug])
  return { data, isLoading: false, error: null }
}
