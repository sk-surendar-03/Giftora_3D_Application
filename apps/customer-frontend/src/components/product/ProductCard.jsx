import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-card"
    >
      <div className="aspect-square bg-ink/5">
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4">
        {product.material && (
          <Badge tone="accent" className="mb-2">
            {product.material}
          </Badge>
        )}
        <h3 className="text-sm font-medium text-ink">{product.name}</h3>
        <p className="mt-1 text-sm text-muted">
          {typeof product.price === 'number' ? `₹${product.price}` : product.price}
        </p>
      </div>
    </Link>
  )
}
