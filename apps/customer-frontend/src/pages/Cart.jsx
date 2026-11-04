import { Link } from 'react-router-dom'
import { useCart } from '../features/cart/useCart.js'
import QuantitySelector from '../components/product/QuantitySelector'
import CustomizationDetails from '../components/product/CustomizationDetails.jsx'
import Button from '../components/ui/Button'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

export default function Cart() {
  const { cart, isAuthenticated, isLoading, loadError, mutating, mutationError, updateQuantity, removeItem } = useCart()

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">Your Cart</h1>
        <p className="mt-3 text-sm text-muted">Sign in to view and manage your cart.</p>
        <Link to="/login" state={{ from: '/cart' }} className="mt-6 inline-block">
          <Button variant="accent">Sign in</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-24 text-center text-sm text-muted sm:px-6">Loading your cart…</div>
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger sm:px-6">
        Something went wrong loading your cart. Please try again.
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">Your Cart</h1>
        <p className="mt-3 text-sm text-muted">Your cart is empty.</p>
        <Link to="/products" className="mt-6 inline-block">
          <Button variant="accent">Browse products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">Your Cart</h1>

      {mutationError && <p className="mt-4 text-sm text-danger">{mutationError}</p>}

      <div className="mt-8 divide-y divide-border rounded-card border border-border bg-surface">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4 p-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-control bg-ink/5">
              {item.product.images?.[0] && <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/products/${item.product.slug}`} className="text-sm font-medium text-ink hover:text-accent-dark">
                    {item.product.name}
                  </Link>
                  {!item.product.isActive && <p className="mt-0.5 text-xs text-danger">No longer available</p>}
                  <CustomizationDetails customization={item.customization} />
                </div>
                <p className="shrink-0 text-sm font-medium text-ink">{formatPrice(item.unitPriceCents)} each</p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <QuantitySelector value={item.quantity} onChange={(qty) => updateQuantity(item.id, qty)} />
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-ink">{formatPrice(item.lineTotalCents)}</p>
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => removeItem(item.id)}
                    className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 ml-auto max-w-xs space-y-2">
        <div className="flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span>{formatPrice(cart.subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-ink">
          <span>Total</span>
          <span>{formatPrice(cart.totalCents)}</span>
        </div>
        <Link to="/checkout" className="block pt-2">
          <Button variant="accent" className="w-full">
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </div>
  )
}
