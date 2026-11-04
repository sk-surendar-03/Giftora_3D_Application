import { useMemo, useState } from 'react'
import useProducts from '../features/products/useProducts'
import {
  filterProducts,
  getCategories,
  getMaterials,
  sortProducts,
} from '../features/products/filters'
import Input from '../components/ui/Input'
import CatalogFilters from '../components/product/CatalogFilters'
import ActiveFilters from '../components/product/ActiveFilters'
import SortMenu from '../components/product/SortMenu'
import EmptyState from '../components/product/EmptyState'
import ProductCard from '../components/product/ProductCard'
import ProductGridSkeleton from '../components/product/ProductGridSkeleton'
import Button from '../components/ui/Button'

const INITIAL_FILTERS = { search: '', categories: [], materials: [] }

export default function Products() {
  const { data: products, isLoading, error } = useProducts()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [sortBy, setSortBy] = useState('newest')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const categories = useMemo(() => getCategories(products), [products])
  const materials = useMemo(() => getMaterials(products), [products])

  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, filters)
    return sortProducts(filtered, sortBy)
  }, [products, filters, sortBy])

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.categories.length > 0 ||
    filters.materials.length > 0

  function toggleValue(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }))
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS)
  }

  const filterProps = {
    categories,
    materials,
    filters,
    onToggleCategory: (value) => toggleValue('categories', value),
    onToggleMaterial: (value) => toggleValue('materials', value),
    onClearAll: resetFilters,
    hasActiveFilters,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">All Products</h1>
        <p className="mt-2 text-sm text-muted">
          {isLoading
            ? 'Loading products…'
            : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          aria-label="Search products"
          type="search"
          placeholder="Search by name, category or material"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          className="sm:max-w-sm"
        />
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <Button variant="secondary" className="sm:hidden" onClick={() => setMobileFiltersOpen(true)}>
            Filters
          </Button>
          <SortMenu value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      <div className="mb-6">
        <ActiveFilters
          filters={filters}
          onRemoveCategory={(value) => toggleValue('categories', value)}
          onRemoveMaterial={(value) => toggleValue('materials', value)}
          onClearSearch={() => setFilters((prev) => ({ ...prev, search: '' }))}
          onClearAll={resetFilters}
        />
      </div>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-[220px_1fr]">
        <aside className="hidden sm:block">
          <CatalogFilters {...filterProps} />
        </aside>

        <div>
          {error ? (
            <div className="rounded-card border border-danger/30 bg-danger/5 p-8 text-center text-sm text-danger">
              Something went wrong loading products. Please try again.
            </div>
          ) : isLoading ? (
            <ProductGridSkeleton />
          ) : filteredProducts.length === 0 ? (
            <EmptyState onReset={resetFilters} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="relative ml-auto flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            <CatalogFilters {...filterProps} />
            <Button className="mt-8 w-full" onClick={() => setMobileFiltersOpen(false)}>
              Show {filteredProducts.length} results
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
