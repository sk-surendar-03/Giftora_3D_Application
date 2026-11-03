export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export function getCategories(products) {
  return [...new Set(products.map((p) => p.category).filter(Boolean))].sort()
}

export function getMaterials(products) {
  return [...new Set(products.map((p) => p.material).filter(Boolean))].sort()
}

export function getPriceBounds(products) {
  const prices = products.map((p) => p.price).filter((p) => typeof p === 'number')
  if (prices.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

export function matchesSearch(product, search) {
  if (!search.trim()) return true
  const term = search.trim().toLowerCase()
  return [product.name, product.description, product.category, product.material]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(term))
}

export function filterProducts(products, { search = '', categories = [], materials = [], priceMin, priceMax } = {}) {
  return products.filter((product) => {
    if (!matchesSearch(product, search)) return false
    if (categories.length > 0 && !categories.includes(product.category)) return false
    if (materials.length > 0 && !materials.includes(product.material)) return false
    if (typeof priceMin === 'number' && product.price < priceMin) return false
    if (typeof priceMax === 'number' && product.price > priceMax) return false
    return true
  })
}

export function sortProducts(products, sortBy) {
  const sorted = [...products]
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price)
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    default:
      return sorted
  }
}
