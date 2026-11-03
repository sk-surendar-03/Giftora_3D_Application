import { useMemo } from 'react'
import { sampleProducts } from '../../data/sampleProducts'

// Same { data, isLoading, error } shape as useProduct()/useProducts(), keyed
// by id instead of slug since /customise/:productId links by product id.
export default function useProductById(productId) {
  const data = useMemo(() => sampleProducts.find((p) => p.id === productId) ?? null, [productId])
  return { data, isLoading: false, error: null }
}
