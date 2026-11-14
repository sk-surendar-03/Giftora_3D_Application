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
    <div className="bg-bg text-ink min-h-[80vh]">
      <div className="mx-auto max-w-[1400px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-12">
        {/* Page Header */}
        <div className="mb-8 pb-5 border-b border-line">
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
            Catalog
          </span>
          <h1 className="font-display text-[38px] max-[760px]:text-[30px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-2">
            All 3D Engineered Products
          </h1>
          <p className="font-sans text-[15px] text-muted mt-2">
            {isLoading
              ? 'Loading products…'
              : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'design available' : 'designs available'}`}
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="mb-6 flex flex-col gap-4 min-[761px]:flex-row min-[761px]:items-center min-[761px]:justify-between">
          <div className="w-full min-[761px]:max-w-md">
            <Input
              aria-label="Search products"
              type="search"
              placeholder="Search by name, category or material..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between gap-3 min-[761px]:justify-end">
            <Button variant="secondary" size="sm" className="min-[761px]:hidden" onClick={() => setMobileFiltersOpen(true)}>
              Filters
            </Button>
            <SortMenu value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* Active Filters */}
        <div className="mb-6">
          <ActiveFilters
            filters={filters}
            onRemoveCategory={(value) => toggleValue('categories', value)}
            onRemoveMaterial={(value) => toggleValue('materials', value)}
            onClearSearch={() => setFilters((prev) => ({ ...prev, search: '' }))}
            onClearAll={resetFilters}
          />
        </div>

        {/* Main Catalog Layout */}
        <div className="grid grid-cols-1 items-start gap-8 min-[761px]:grid-cols-[240px_1fr]">
          <aside className="hidden min-[761px]:block min-[761px]:sticky min-[761px]:top-[96px] self-start max-h-[calc(100vh-116px)] overflow-y-auto">
            <CatalogFilters {...filterProps} />
          </aside>

          <div>
            {error ? (
              <div className="rounded-card border border-danger/40 bg-surface p-8 text-center text-[14px] text-danger">
                Something went wrong loading products. Please try again.
              </div>
            ) : isLoading ? (
              <ProductGridSkeleton />
            ) : filteredProducts.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              <div className="grid grid-cols-1 min-[761px]:grid-cols-2 min-[1041px]:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex min-[761px]:hidden">
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />
            <div className="relative ml-auto flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-surface border-l border-line p-6">
              <div className="mb-5 flex items-center justify-between pb-3 border-b border-line">
                <h2 className="font-sans text-[16px] font-semibold text-ink">Filters</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  className="text-muted hover:text-ink text-lg"
                >
                  ✕
                </button>
              </div>
              <CatalogFilters {...filterProps} />
              <div className="mt-8">
                <Button variant="primary" size="lg" className="w-full" onClick={() => setMobileFiltersOpen(false)}>
                  Show {filteredProducts.length} results
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
