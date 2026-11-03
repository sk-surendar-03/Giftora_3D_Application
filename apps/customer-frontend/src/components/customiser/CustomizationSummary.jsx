import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function CustomizationSummary({ product, text, font, material, color, size, quantity }) {
  const rows = [
    { label: 'Product', value: product.name },
    { label: 'Text', value: text || '—' },
    { label: 'Font', value: font },
    { label: 'Material', value: material ?? product.materials?.[0] },
    { label: 'Colour', value: color?.label },
    { label: 'Size', value: size },
    { label: 'Quantity', value: quantity },
  ].filter((row) => row.value)

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Your customization</h2>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 text-sm">
            <dt className="text-muted">{row.label}</dt>
            <dd className="text-right font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link to={`/products/${product.slug}`}>
          <Button variant="secondary">Back to Product</Button>
        </Link>
        <Link to="/products">
          <Button variant="ghost">Continue Browsing</Button>
        </Link>
      </div>
    </div>
  )
}
