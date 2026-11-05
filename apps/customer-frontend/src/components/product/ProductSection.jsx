import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

export default function ProductSection({ eyebrow, title, subtitle, products, className = '' }) {
  // Show up to 4 items in featured/best-seller rows as designed in preview
  const displayProducts = products.slice(0, 4)

  return (
    <section className={`py-21 max-[1040px]:py-16 max-[760px]:py-12 ${className}`}>
      <div className="mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px]">
        
        {/* Section Head */}
        <div className="flex flex-col min-[761px]:flex-row justify-between items-start min-[761px]:items-end gap-5 mb-8.5 max-[760px]:mb-6">
          <div>
            {eyebrow && (
              <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
                {eyebrow}
              </span>
            )}
            <h2 className="font-display text-[38px] max-[760px]:text-[28px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-3">
              {title}
            </h2>
            {subtitle && (
              <p className="font-sans text-[15px] text-muted max-w-[44ch] mt-2.5">
                {subtitle}
              </p>
            )}
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 font-sans text-[14.5px] font-semibold text-accent hover:text-accent-dark transition-colors"
          >
            <span>View all</span>
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {/* Product Cards Grid: .prods { grid-template-columns: repeat(4, 1fr); gap: 24px; }
            <=1040px: repeat(2, 1fr); <=760px: gap: 14px; */}
        <div className="grid grid-cols-2 min-[1041px]:grid-cols-4 gap-6 max-[760px]:gap-3.5">
          {displayProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>

      </div>
    </section>
  )
}
