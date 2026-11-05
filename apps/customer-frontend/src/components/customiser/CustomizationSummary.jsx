import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../features/cart/useCart.js'
import { useAuth } from '../../features/auth/useAuth.js'
import Button from '../ui/Button'

export default function CustomizationSummary({ product, text, font, material, color, size, quantity }) {
  const { isAuthenticated } = useAuth()
  const { addToCart, mutating, mutationError } = useCart()
  const navigate = useNavigate()
  const [addedMessage, setAddedMessage] = useState(null)

  const rows = [
    { label: 'Product', value: product.name },
    { label: 'Text', value: text || '—' },
    { label: 'Font', value: font },
    { label: 'Material', value: material ?? product.materials?.[0] },
    { label: 'Colour', value: color?.label },
    { label: 'Size', value: size },
    { label: 'Quantity', value: quantity },
  ].filter((row) => row.value)

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/customise/${product.id}` } })
      return
    }
    setAddedMessage(null)
    try {
      await addToCart({ productId: product.id, quantity, customization: { text, font, material, color, size } })
      setAddedMessage('Added to cart.')
    } catch {
      // mutationError (from useCart) already surfaces the real message below.
    }
  }

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

      {addedMessage && <p className="mt-3 text-sm text-accent-dark">{addedMessage}</p>}
      {mutationError && <p className="mt-3 text-sm text-danger">{mutationError}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="accent" onClick={handleAddToCart} disabled={mutating}>
          {mutating ? 'Adding…' : 'Add to Cart'}
        </Button>
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
