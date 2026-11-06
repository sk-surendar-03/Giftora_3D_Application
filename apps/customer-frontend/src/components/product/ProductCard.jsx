import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { useWishlist } from '../../features/wishlist/WishlistContext.jsx'

export default function ProductCard({ product, index = 0 }) {
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [isToggling, setIsToggling] = useState(false)
  const isSaved = isWishlisted(product.id)

  const priceDisplay = typeof product.price === 'number' ? `₹${product.price}` : product.price
  
  // Design preview tile tint cycling: default (var(--soft)), alt1 (var(--alt)), alt2 (color-mix with acc)
  const tintClasses = ['', 'bg-alt', 'bg-[#1F3046]']
  const tintClass = tintClasses[index % 3] || 'bg-soft'

  const hasOriginalPrice = typeof product.originalPrice === 'number' && product.originalPrice > product.price
  const hasDiscount = typeof product.discountPercent === 'number' && product.discountPercent > 0
  const hasRating = typeof product.rating === 'number' && product.rating > 0

  // Extract display-only color swatches configured by Admin for this specific product
  const configuredColors = (() => {
    const list = []
    const seenHexes = new Set()

    function addColor(item) {
      if (!item) return
      const hex = typeof item === 'string' ? item : item.hex
      const label = (typeof item === 'object' && item.label) ? item.label : hex
      if (!hex || typeof hex !== 'string') return
      const normalized = hex.trim().toLowerCase()
      if (!seenHexes.has(normalized)) {
        seenHexes.add(normalized)
        list.push({ label, hex: hex.trim() })
      }
    }

    if (product.colorsByMaterial && typeof product.colorsByMaterial === 'object') {
      // Grouped by material — iterate materials and colors in configured order
      for (const colorArr of Object.values(product.colorsByMaterial)) {
        if (Array.isArray(colorArr)) {
          for (const c of colorArr) addColor(c)
        }
      }
    } else if (Array.isArray(product.colors)) {
      for (const c of product.colors) addColor(c)
    }

    return list
  })()

  return (
    <article className="prod flex flex-col justify-between">
      {/* Top Image Tile (.ph) with 8px radius, relative, 1:1 aspect ratio */}
      <div>
        <div className={`relative aspect-square w-full rounded-card overflow-hidden ${tintClass || 'bg-soft'}`}>
          <Link to={`/products/${product.slug}`} className="block h-full w-full">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted gap-2">
                <svg className="w-14 h-14 text-accent/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
                  <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
                </svg>
              </div>
            )}
          </Link>

          {/* Badge at top left */}
          {(product.badge || product.material) && (
            <span className="absolute left-3 top-3 inline-flex items-center h-6 rounded-full px-2.5 text-[11.5px] font-semibold bg-secondary text-on-secondary">
              {product.badge || product.material}
            </span>
          )}

          {/* Wishlist button at top right */}
          <button
            type="button"
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            disabled={isToggling}
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              if (isToggling) return
              setIsToggling(true)
              try {
                await toggleWishlist(product.id)
              } catch {
                // Error is handled in context and rolled back
              } finally {
                setIsToggling(false)
              }
            }}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface border-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25)] cursor-pointer transition-all ${
              isSaved
                ? 'text-danger hover:scale-110'
                : 'text-ink hover:text-accent hover:scale-105'
            } disabled:opacity-60 disabled:cursor-wait`}
          >
            <svg
              className={`h-[18px] w-[18px] transition-transform ${isSaved ? 'scale-105 fill-current stroke-none' : 'stroke-current fill-none'}`}
              viewBox="0 0 24 24"
              strokeWidth="1.6"
            >
              <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" />
            </svg>
          </button>
        </div>

        {/* Category Label */}
        {product.category && (
          <div className="font-sans text-[12.5px] font-semibold text-muted uppercase tracking-[0.08em] mt-4">
            {product.category}
          </div>
        )}

        {/* Product Title */}
        <Link to={`/products/${product.slug}`} className="block">
          <h3 className="font-sans text-[16px] max-[760px]:text-[14.5px] font-semibold text-ink leading-[1.3] mt-1 mb-1 hover:text-accent transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Dynamic Rating row — only rendered if actual rating data exists */}
        {hasRating && (
          <div className="flex items-center gap-2 text-[13px] text-muted my-1.5">
            <div className="flex text-accent gap-[1px]">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'fill-accent' : 'fill-line text-line'} stroke-none`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
                </svg>
              ))}
            </div>
            <span>
              {product.rating} {product.reviewsCount ? `(${product.reviewsCount})` : ''}
            </span>
          </div>
        )}

        {/* Price Row: selling price, and dynamic original price & discount if configured */}
        <div className="flex items-baseline gap-2 mt-1.5 font-sans">
          <b className="text-[18px] font-bold text-ink">{priceDisplay}</b>
          {hasOriginalPrice && (
            <s className="text-[14px] text-muted">₹{product.originalPrice}</s>
          )}
          {hasDiscount && (
            <span className="text-[13px] font-semibold text-[#17683f]">{product.discountPercent}% off</span>
          )}
        </div>

        {/* Display-only Admin-configured Color Swatches */}
        {configuredColors.length > 0 && (
          <div
            className="flex items-center gap-1.5 mt-2.5 pt-0.5 pointer-events-none select-none"
            aria-label="Available finishes"
          >
            {configuredColors.slice(0, 5).map((color, idx) => (
              <span
                key={idx}
                title={color.label}
                className="h-3.5 w-3.5 rounded-full inline-block shrink-0 shadow-sm"
                style={{
                  backgroundColor: color.hex,
                  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.4)',
                }}
              />
            ))}
            {configuredColors.length > 5 && (
              <span className="text-[11px] font-medium text-muted ml-0.5">
                +{configuredColors.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Button: Personalise */}
      <div className="mt-3.5">
        <Link to={`/products/${product.slug}`} className="block">
          <Button variant="secondary" size="sm" className="w-full h-[38px] max-[760px]:h-[40px] max-[760px]:text-[13px] max-[760px]:px-2.5">
            Personalise
          </Button>
        </Link>
      </div>
    </article>
  )
}
