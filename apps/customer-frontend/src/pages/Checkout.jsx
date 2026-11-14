import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import { useAddresses } from '../features/addresses/useAddresses.js'
import { useCheckoutReview } from '../features/checkout/useCheckoutReview.js'
import { createOrder } from '../features/orders/ordersApi.js'
import CustomizationDetails from '../components/product/CustomizationDetails.jsx'
import DesignPreviewImage from '../components/design/DesignPreviewImage.jsx'
import Button from '../components/ui/Button'
import { resolveImageUrl } from '../utils/imageUrl.js'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

export default function Checkout() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { addresses, isLoading: addressesLoading, loadError: addressesError } = useAddresses()
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [customerNote, setCustomerNote] = useState('')
  const [confirmState, setConfirmState] = useState({ submitting: false, error: null })
  const [idempotencyKey] = useState(() => crypto.randomUUID())

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
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-[500px] px-[18px] py-24 text-center">
          <h1 className="font-display text-[32px] font-semibold text-ink">Checkout</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">Sign in to complete your order.</p>
          <div className="mt-6">
            <Link to="/login" state={{ from: '/checkout' }}>
              <Button variant="primary" size="md">Sign in</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (addressesLoading) {
    return <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-[15px] text-muted">Loading checkout…</div>
  }

  if (addressesError) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger">
          Something went wrong loading your addresses. Please try again.
        </div>
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-[500px] px-[18px] py-24 text-center">
          <h1 className="font-display text-[32px] font-semibold text-ink">Checkout</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">Add a delivery address to continue with your order.</p>
          <div className="mt-6">
            <Link to="/addresses" state={{ from: '/checkout' }}>
              <Button variant="primary" size="md">Add an address</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const cartIsEmpty = review.error?.response?.status === 400 && review.error.response.data?.error === 'Your cart is empty.'

  async function handlePlaceOrder() {
    setConfirmState({ submitting: true, error: null })
    try {
      const order = await createOrder(selectedAddressId, idempotencyKey, customerNote)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('giftora:cart-updated', { detail: { id: null, items: [], subtotalCents: 0, totalCents: 0 } }))
      }
      navigate(`/order-success/${order.id}`, { replace: true })
    } catch (err) {
      setConfirmState({ submitting: false, error: err.response?.data?.error ?? 'Something went wrong placing your order. Please try again.' })
    }
  }

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-10">
        
        {/* Header & Stepper */}
        <div className="flex flex-col min-[761px]:flex-row min-[761px]:items-end justify-between gap-4 pb-6 border-b border-line mb-8">
          <div>
            <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
              Step 2 of 2
            </span>
            <h1 className="font-display text-[40px] max-[760px]:text-[30px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-2">
              Checkout
            </h1>
          </div>
          <Link to="/cart" className="text-[13.5px] font-semibold text-accent hover:underline">
            ← Edit cart
          </Link>
        </div>

        {/* Stepper indicator matching Industrial Obsidian */}
        <div className="flex items-center gap-3 mb-8 text-[13.5px] font-medium text-muted">
          <div className="flex items-center gap-2 text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-soft border border-line text-accent text-[12px] font-bold">✓</span>
            <span>Cart</span>
          </div>
          <span className="w-8 h-[1px] bg-line" />
          <div className="flex items-center gap-2 text-accent font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent text-[12px] font-bold">2</span>
            <span>Address & Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 min-[1041px]:grid-cols-[1.6fr_1fr] gap-9 items-start">
          
          {/* Left Column: Addresses & Options */}
          <div className="space-y-6">
            <section className="rounded-card border border-line bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0">
                  1. Delivery address
                </h3>
                <Link to="/addresses" className="text-[13px] text-muted hover:text-accent underline">
                  Manage addresses
                </Link>
              </div>

              <div className="space-y-3">
                {addresses.map((address) => {
                  const isSelected = selectedAddressId === address.id
                  return (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer items-start gap-3.5 rounded-control border p-4 text-[14px] transition-colors ${
                        isSelected ? 'border-accent bg-soft text-ink ring-1 ring-accent' : 'border-line bg-surface hover:border-accent/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 accent-[#D9AE4E]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink m-0">{address.fullName}</p>
                          {address.isDefault && (
                            <span className="rounded-full bg-soft border border-line px-2 py-0.5 text-[11px] font-medium text-accent">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] text-muted m-0">{address.phone}</p>
                        <p className="mt-1 text-ink m-0 leading-relaxed">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}, {address.country}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </section>

            {/* Delivery option card */}
            <section className="rounded-card border border-line bg-surface p-6">
              <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-4">
                2. Shipping method
              </h3>
              {review.data?.items?.length > 0 ? (
                <div className="space-y-2">
                  {review.data.items.map((it) => {
                    const sm = it.customization?.shippingMethod
                    const shipCents = sm?.priceCents ?? (it.itemType === 'PRODUCT' ? (it.product?.shippingCents ?? 0) : 0)
                    const shipName = sm?.name ?? (it.itemType === 'PRODUCT' ? 'Standard Shipping' : null)
                    const shipDays = sm?.estimatedDays ?? null
                    if (!shipName && shipCents === 0) return null
                    return (
                      <div key={it.id} className="rounded-control border border-accent bg-soft p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent text-[11px] font-bold">✓</span>
                          <div className="min-w-0">
                            <div className="font-sans text-[14px] font-semibold text-ink capitalize">{shipName ?? 'Free Shipping'}</div>
                            <div className="text-[12px] text-muted truncate">
                              {it.title}
                              {shipDays && ` · ${shipDays}`}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[13.5px] font-bold shrink-0 ${shipCents === 0 ? 'text-[#17683f]' : 'text-ink'}`}>
                          {shipCents === 0 ? 'FREE' : `₹${(shipCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-control border border-accent bg-soft p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent text-[11px] font-bold">✓</span>
                    <div className="font-sans text-[14.5px] font-semibold text-ink">Standard Dispatch</div>
                  </div>
                  <span className="text-[13.5px] font-bold text-[#17683f]">FREE</span>
                </div>
              )}
            </section>

            {/* Payment method card */}
            <section className="rounded-card border border-line bg-surface p-6">
              <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-4">
                3. Payment
              </h3>
              <div className="rounded-control border border-line bg-alt p-4 flex items-center gap-3 text-[14px] text-muted">
                <svg className="w-5 h-5 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                <span>Direct secure checkout. UPI, Cards & Netbanking options provided upon placement.</span>
              </div>
            </section>
          </div>

          {/* Right Column: Review & Confirmation */}
          <div className="space-y-5">
            {/* Order Note */}
            <section className="rounded-card border border-line bg-surface p-6">
              <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-3">
                4. Order Note <span className="text-muted font-normal normal-case tracking-normal text-[11px]">(optional)</span>
              </h3>
              <textarea
                rows={3}
                maxLength={1000}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Any special instructions? e.g. I also need this in blue, or can you add a heart shape on the left side…"
                className="w-full rounded-control border border-line bg-alt px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-muted focus:border-accent focus:outline-none resize-none"
              />
              <p className="mt-1 text-[11.5px] text-muted text-right">{customerNote.length}/1000</p>
            </section>

            <div className="rounded-card border border-line bg-surface p-7 min-[1041px]:sticky min-[1041px]:top-24">
            <h3 className="font-sans text-[19px] font-bold text-ink pb-4 border-b border-line m-0">
              Order Review
            </h3>

            {review.isLoading && <p className="py-6 text-sm text-muted">Checking your items…</p>}

            {review.error && !cartIsEmpty && (
              <p className="my-4 rounded-control bg-[#fbe6e2] p-3 text-sm text-danger font-medium">
                {review.error.response?.data?.error ?? 'Something went wrong preparing your checkout. Please try again.'}
              </p>
            )}

            {cartIsEmpty && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted">Your cart is empty.</p>
                <Link to="/products" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">Browse products</Button>
                </Link>
              </div>
            )}

            {review.data && (
              <>
                <div className="divide-y divide-line my-4 max-h-[300px] overflow-y-auto">
                  {review.data.items.map((item) => {
                    const issue = review.data.issues.find((i) => i.itemId === item.id)
                    return (
                      <div key={item.id} className="py-3 flex gap-3 text-[13.5px]">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-control bg-soft border border-line flex items-center justify-center">
                          {item.itemType === 'CUSTOM_DESIGN' ? (
                            <DesignPreviewImage designId={item.design.id} hasPreview={item.design.hasPreview} alt={item.title} />
                          ) : item.product.images?.[0] ? (
                            <img src={resolveImageUrl(item.product.images[0])} alt={item.product.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs text-muted">3D</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink truncate m-0">{item.title}</p>
                          <p className="text-[12px] text-muted m-0">Qty {item.quantity}</p>
                          {issue && <p className={`text-[11.5px] mt-1 ${issue.blocking ? 'text-danger font-semibold' : 'text-accent'}`}>{issue.message}</p>}
                        </div>
                        <div className="text-right font-semibold text-ink">
                          {item.available ? formatPrice(item.lineTotalCents) : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2.5 py-4 border-t border-b border-line text-[14px]">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span className="text-ink font-semibold">{formatPrice(review.data.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Shipping</span>
                    <span className="text-[#17683f] font-semibold">
                      {review.data.shippingCents === 0 ? 'FREE' : formatPrice(review.data.shippingCents)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex justify-between items-baseline font-sans">
                  <span className="text-[16px] font-semibold text-ink">Total to Pay</span>
                  <span className="text-[22px] font-bold text-accent">{formatPrice(review.data.totalCents)}</span>
                </div>

                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full text-base font-semibold"
                    disabled={!review.data.canConfirm || confirmState.submitting}
                    onClick={handlePlaceOrder}
                  >
                    {confirmState.submitting ? 'Placing order…' : 'Place Order'}
                  </Button>
                </div>

                {!review.data.canConfirm && (
                  <p className="mt-3 text-center text-xs text-danger font-medium">Please resolve the issues above to proceed.</p>
                )}

                {confirmState.error && (
                  <p className="mt-3 rounded-control bg-[#fbe6e2] p-3 text-xs text-danger font-medium">{confirmState.error}</p>
                )}
              </>
            )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
