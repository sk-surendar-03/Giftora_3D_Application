import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../features/wishlist/WishlistContext.jsx'
import useProducts from '../features/products/useProducts.js'
import ProductCard from '../components/product/ProductCard.jsx'
import Button from '../components/ui/Button.jsx'

export default function Wishlist() {
  const { wishlistProductIds, isLoading: wishlistLoading, error: wishlistError } = useWishlist()
  const { data: allProducts, isLoading: productsLoading, error: productsError } = useProducts()

  const wishlistedProducts = useMemo(() => {
    if (!allProducts || wishlistProductIds.size === 0) return []
    return allProducts.filter((product) => wishlistProductIds.has(product.id))
  }, [allProducts, wishlistProductIds])

  const isLoading = wishlistLoading || productsLoading
  const error = wishlistError || productsError

  return (
    <div className="bg-bg text-ink min-h-[75vh]">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 py-12">
        {/* Header Section */}
        <div className="mb-10 pb-6 border-b border-line flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent text-xs">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" />
                </svg>
              </span>
              <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
                Customer Saved Items
              </span>
            </div>
            <h1 className="font-display text-[34px] sm:text-[40px] font-semibold text-ink leading-[1.15] tracking-[-0.02em] m-0">
              My Wishlist
            </h1>
            <p className="mt-2 font-sans text-[15px] text-muted max-w-[60ch]">
              Saved pieces from our industrial 3D manufacturing catalog. Items remain saved to your session and account.
            </p>
          </div>

          {!isLoading && wishlistedProducts.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-soft px-3.5 py-1 text-xs font-semibold text-accent border border-line">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'Saved Item' : 'Saved Items'}
              </span>
              <Link to="/products">
                <Button variant="outline" size="sm">
                  Continue Browsing
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent mb-4" />
            <p className="text-[15px] text-muted">Loading your saved items…</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="rounded-card border border-rose-500/30 bg-rose-500/10 p-8 text-center max-w-lg mx-auto">
            <p className="text-sm font-semibold text-rose-400 mb-4">{error}</p>
            <Link to="/products">
              <Button variant="primary" size="sm">
                Browse Products
              </Button>
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && wishlistedProducts.length === 0 && (
          <div className="rounded-card border border-line bg-surface p-12 sm:p-16 text-center max-w-lg mx-auto my-8">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-soft text-muted mb-5 border border-line">
              <svg className="h-8 w-8 text-muted/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" />
              </svg>
            </div>
            <h2 className="font-display text-[24px] font-semibold text-ink m-0">Your Wishlist is Empty</h2>
            <p className="mt-2.5 text-[14.5px] text-muted leading-relaxed">
              Explore our collection of precision 3D-engineered products and tap the heart icon on any piece to save it here for later.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/products">
                <Button variant="primary" size="md">
                  Browse Catalog
                </Button>
              </Link>
              <Link to="/3d-customisation">
                <Button variant="outline" size="md">
                  3D Customisation Hub
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Populated Wishlist Grid */}
        {!isLoading && !error && wishlistedProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {wishlistedProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
