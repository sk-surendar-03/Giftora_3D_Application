import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function ProductCard({ product, index = 0 }) {
  const priceDisplay = typeof product.price === 'number' ? `₹${product.price}` : product.price
  
  // Design preview tile tint cycling: default (var(--soft)), alt1 (var(--alt)), alt2 (color-mix with acc)
  const tintClasses = ['', 'bg-alt', 'bg-[#1F3046]']
  const tintClass = tintClasses[index % 3] || 'bg-soft'

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

          {/* Badge at top left (12px, 12px) */}
          {(product.badge || product.material) && (
            <span className="absolute left-3 top-3 inline-flex items-center h-6 rounded-full px-2.5 text-[11.5px] font-semibold bg-secondary text-on-secondary">
              {product.badge || product.material}
            </span>
          )}

          {/* Wishlist button at top right (12px, 12px) */}
          <button
            type="button"
            aria-label="Save"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink border-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25)] hover:text-accent cursor-pointer transition-colors"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" />
            </svg>
          </button>
        </div>

        {/* Category Label */}
        <div className="font-sans text-[12.5px] font-semibold text-muted uppercase tracking-[0.08em] mt-4">
          {product.category || 'Custom Keepsake'}
        </div>

        {/* Product Title */}
        <Link to={`/products/${product.slug}`} className="block">
          <h3 className="font-sans text-[16px] max-[760px]:text-[14.5px] font-semibold text-ink leading-[1.3] mt-1 mb-1 hover:text-accent transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Rating row */}
        <div className="flex items-center gap-2 text-[13px] text-muted my-1.5">
          <div className="flex text-accent gap-[1px]">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3.5 h-3.5 fill-accent stroke-none" viewBox="0 0 24 24">
                <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
              </svg>
            ))}
          </div>
          <span>4.9 (812)</span>
        </div>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mt-1.5 font-sans">
          <b className="text-[18px] font-bold text-ink">{priceDisplay}</b>
          <s className="text-[14px] text-muted">₹{typeof product.price === 'number' ? Math.round(product.price * 1.25) : '1,299'}</s>
          <span className="text-[13px] font-semibold text-[#17683f]">20% off</span>
        </div>
      </div>

      {/* Button: .btn-s .btn-sm full-width, margin-top: 14px, 38px tall on desktop, 40px on mobile <=760 */}
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
