import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

export default function ProductSection({ eyebrow, title, subtitle, products, className = '' }) {
  return (
    <section className={`mx-auto max-w-6xl px-4 py-16 sm:px-6 ${className}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <span className="text-xs font-medium tracking-wide text-accent-dark uppercase">
              {eyebrow}
            </span>
          )}
          <h2 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-muted sm:text-base">{subtitle}</p>}
        </div>
        <Link to="/products" className="text-sm font-medium text-ink hover:text-accent-dark">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
