import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import { useAddresses } from '../features/addresses/useAddresses.js'
import { useCheckoutReview } from '../features/checkout/useCheckoutReview.js'
import { createOrder } from '../features/orders/ordersApi.js'
import CustomizationDetails from '../components/product/CustomizationDetails.jsx'
import Button from '../components/ui/Button'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

export default function Checkout() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { addresses, isLoading: addressesLoading, loadError: addressesError } = useAddresses()
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [confirmState, setConfirmState] = useState({ submitting: false, error: null })
  // One key per checkout page visit — sent on every "Place Order" attempt
  // from this visit, so a double-click or a retried network request can't
  // create two orders (the backend treats a repeated key as "return the
  // order that already exists").
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  // Preselect the default address once addresses load, without overriding
  // a choice the customer already made.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedAddressId || addresses.length === 0) return
      const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0]
      setSelectedAddressId(defaultAddress.id)
    }, 0)
    return () => clearTimeout(timer)
  }, [addresses, selectedAddressId])

  const review = useCheckoutReview(selectedAddressId)

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">Checkout</h1>
        <p className="mt-3 text-sm text-muted">Sign in to continue to checkout.</p>
        <Link to="/login" state={{ from: '/checkout' }} className="mt-6 inline-block">
          <Button variant="accent">Sign in</Button>
        </Link>
      </div>
    )
  }

  if (addressesLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-24 text-center text-sm text-muted sm:px-6">Loading checkout…</div>
  }

  if (addressesError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger sm:px-6">
        Something went wrong loading your addresses. Please try again.
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">Checkout</h1>
        <p className="mt-3 text-sm text-muted">Add a delivery address to continue.</p>
        <Link to="/addresses" state={{ from: '/checkout' }} className="mt-6 inline-block">
          <Button variant="accent">Add an address</Button>
        </Link>
      </div>
    )
  }

  const cartIsEmpty = review.error?.response?.status === 400 && review.error.response.data?.error === 'Your cart is empty.'

  async function handlePlaceOrder() {
    setConfirmState({ submitting: true, error: null })
    try {
      const order = await createOrder(selectedAddressId, idempotencyKey)
      navigate(`/order-success/${order.id}`, { replace: true })
    } catch (err) {
      setConfirmState({ submitting: false, error: err.response?.data?.error ?? 'Something went wrong placing your order. Please try again.' })
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Checkout</h1>
        <Link to="/cart" className="text-sm font-medium text-ink hover:text-accent-dark">
          Edit cart
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Delivery address</h2>
        <div className="mt-3 space-y-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`flex cursor-pointer items-start gap-3 rounded-card border p-4 text-sm ${
                selectedAddressId === address.id ? 'border-ink bg-ink/5' : 'border-border bg-surface'
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddressId === address.id}
                onChange={() => setSelectedAddressId(address.id)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{address.fullName}</p>
                  {address.isDefault && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-dark">Default</span>}
                </div>
                <p className="mt-0.5 text-muted">{address.phone}</p>
                <p className="mt-1 text-ink">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}, {address.country}
                </p>
              </div>
            </label>
          ))}
        </div>
        <Link to="/addresses" className="mt-3 inline-block text-sm font-medium text-ink hover:text-accent-dark">
          Manage addresses
        </Link>
      </section>

      {review.isLoading && <p className="mt-8 text-sm text-muted">Checking your order…</p>}

      {review.error && !cartIsEmpty && (
        <p className="mt-8 text-sm text-danger">
          {review.error.response?.data?.error ?? 'Something went wrong preparing your checkout. Please try again.'}
        </p>
      )}

      {cartIsEmpty && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted">Your cart is empty.</p>
          <Link to="/products" className="mt-4 inline-block">
            <Button variant="accent">Browse products</Button>
          </Link>
        </div>
      )}

      {review.data && (
        <>
          <section className="mt-8">
            <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Order summary</h2>
            <div className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
              {review.data.items.map((item) => {
                const issue = review.data.issues.find((i) => i.itemId === item.id)
                return (
                  <div key={item.id} className="flex gap-4 p-5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-control bg-ink/5">
                      {item.product.images?.[0] && <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-ink">{item.product.name}</p>
                          <CustomizationDetails customization={item.customization} />
                          <p className="mt-1 text-xs text-muted">Qty {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-sm font-medium text-ink">{item.available ? formatPrice(item.lineTotalCents) : '—'}</p>
                      </div>
                      {issue && <p className={`mt-2 text-xs ${issue.blocking ? 'text-danger' : 'text-accent-dark'}`}>{issue.message}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="mt-6 ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(review.data.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Shipping</span>
              <span>{formatPrice(review.data.shippingCents)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatPrice(review.data.totalCents)}</span>
            </div>
          </div>

          <div className="mt-8">
            <Button
              variant="accent"
              size="lg"
              className="w-full sm:w-auto"
              disabled={!review.data.canConfirm || confirmState.submitting}
              onClick={handlePlaceOrder}
            >
              {confirmState.submitting ? 'Placing order…' : 'Place Order'}
            </Button>
            {!review.data.canConfirm && (
              <p className="mt-2 text-xs text-danger">Resolve the issues above before placing your order.</p>
            )}

            {confirmState.error && <p className="mt-3 text-sm text-danger">{confirmState.error}</p>}
          </div>
        </>
      )}
    </div>
  )
}
