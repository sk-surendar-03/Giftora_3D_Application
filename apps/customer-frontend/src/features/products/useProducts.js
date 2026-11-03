import { useMemo } from 'react'
import { sampleProducts } from '../../data/sampleProducts'

// Stand-in for a future TanStack Query hook backed by the product-service API.
// Keeps the same { data, isLoading, error } shape so Products.jsx won't need
// to change when this starts calling the real backend.
export default function useProducts() {
  const data = useMemo(() => sampleProducts, [])
  return { data, isLoading: false, error: null }
}
