import { Link } from 'react-router-dom'
import { useCart } from '../features/cart/useCart.js'
import QuantitySelector from '../components/product/QuantitySelector'
import CustomizationDetails from '../components/product/CustomizationDetails.jsx'
import DesignDetails from '../components/design/DesignDetails.jsx'
import DesignPreviewImage from '../components/design/DesignPreviewImage.jsx'
import Button from '../components/ui/Button'
import { resolveImageUrl } from '../utils/imageUrl.js'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

export default function Cart() {
  const { cart, isAuthenticated, isLoading, loadError, mutating, mutationError, updateQuantity, removeItem } = useCart()

  if (!isAuthenticated) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-[500px] px-[18px] py-24 text-center">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-soft text-accent mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
          </span>
          <h1 className="font-display text-[32px] font-semibold text-ink">Your Cart</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">Sign in to view and manage your custom 3D orders.</p>
          <div className="mt-6">
            <Link to="/login" state={{ from: '/cart' }}>
              <Button variant="primary" size="md">Sign in</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-[15px] text-muted">Loading your cart…</div>
  }

  if (loadError) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center text-[14px] text-danger">
          Something went wrong loading your cart. Please try again.
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-[500px] px-[18px] py-24 text-center">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-soft text-muted mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 8h14l-1 12H6L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </span>
          <h1 className="font-display text-[32px] font-semibold text-ink">Your Cart is Empty</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">Explore our catalog or create a custom piece in 3D.</p>
          <div className="mt-6">
            <Link to="/products">
              <Button variant="primary" size="md">Browse products</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalShippingCents = cart.items.reduce((sum, item) => {
    if (item.itemType === 'CUSTOM_DESIGN') {
      return sum + (item.customization?.shippingMethod?.priceCents ?? 0)
    }
    return sum + (item.customization?.shippingMethod?.priceCents ?? item.product?.shippingCents ?? 0)
  }, 0)
  const cartSubtotalCents = cart.items.reduce((sum, item) => sum + (item.lineTotalCents || item.unitPriceCents * item.quantity), 0)
  const cartFinalTotalCents = cartSubtotalCents + totalShippingCents

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-10">
        <div className="pb-6 border-b border-line mb-8">
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
            Review Order
          </span>
          <h1 className="font-display text-[40px] max-[760px]:text-[30px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-2">
            Your Cart
          </h1>
        </div>

        {mutationError && (
          <p className="mb-6 rounded-control bg-[#fbe6e2] px-4 py-2.5 text-[13.5px] font-semibold text-danger">
            {mutationError}
          </p>
        )}

        <div className="grid grid-cols-1 min-[1041px]:grid-cols-[1.6fr_1fr] gap-9 items-start">
          {/* Cart items list */}
          <div className="rounded-card border border-line bg-surface divide-y divide-line p-6">
            {cart.items.map((item) => {
              // A line is either a catalog product or a standalone custom design.
              const isCustom = item.itemType === 'CUSTOM_DESIGN'
              return (
              <div key={item.id} className="grid grid-cols-[80px_1fr] min-[761px]:grid-cols-[104px_1fr_auto] gap-5 py-5 first:pt-0 last:pb-0">
                <div className="h-20 w-20 min-[761px]:h-[104px] min-[761px]:w-[104px] shrink-0 overflow-hidden rounded-control bg-soft border border-line flex items-center justify-center">
                  {isCustom ? (
                    <DesignPreviewImage designId={item.design.id} hasPreview={item.design.hasPreview} alt={item.design.title} />
                  ) : item.product.images?.[0] ? (
                    <img src={resolveImageUrl(item.product.images[0])} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex flex-col justify-between">
                  <div>
                    {isCustom ? (
                      <>
                        <span className="font-sans text-[16px] font-semibold text-ink">{item.design.title}</span>
                        <span className="ml-2 align-middle rounded-full bg-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">Custom design</span>
                        <div className="mt-1 text-[13px] text-muted">
                          <DesignDetails params={item.design.params} />
                        </div>
                        <div className="mt-2 text-xs">
                          {(() => {
                            const sm = item.customization?.shippingMethod
                            const shipCents = sm?.priceCents ?? 0
                            if (shipCents > 0) {
                              return (
                                <span className="font-medium text-muted bg-soft px-2 py-0.5 rounded-full border border-line">
                                  {sm.name}: <span className="font-semibold text-ink">₹{(shipCents / 100).toFixed(2).replace(/\.00$/, '')}</span>
                                  {sm.estimatedDays && <span className="ml-1 text-muted">{sm.estimatedDays}</span>}
                                </span>
                              )
                            }
                            return (
                              <span className="font-semibold text-[#17683f] bg-[#e3f4ea] px-2 py-0.5 rounded-full">
                                Free Shipping
                              </span>
                            )
                          })()}
                        </div>
                      </>
                    ) : (
                      <>
                        <Link to={`/products/${item.product.slug}`} className="font-sans text-[16px] font-semibold text-ink hover:text-accent transition-colors">
                          {item.product.name}
                        </Link>
                        {!item.product.isActive && <p className="mt-0.5 text-xs text-danger">No longer available</p>}
                        <div className="mt-1 text-[13px] text-muted">
                          <CustomizationDetails customization={item.customization} />
                        </div>
                        <div className="mt-2 text-xs">
                          {(() => {
                            const sm = item.customization?.shippingMethod
                            const shipCents = sm?.priceCents ?? item.product.shippingCents ?? 0
                            const shipLabel = sm?.name ?? null
                            if (shipCents > 0) {
                              return (
                                <span className="font-medium text-muted bg-soft px-2 py-0.5 rounded-full border border-line">
                                  {shipLabel ? <>{shipLabel}: </> : 'Shipping: '}
                                  <span className="font-semibold text-ink">₹{(shipCents / 100).toFixed(2).replace(/\.00$/, '')}</span>
                                </span>
                              )
                            }
                            return (
                              <span className="font-semibold text-[#17683f] bg-[#e3f4ea] px-2 py-0.5 rounded-full">
                                Free Shipping
                              </span>
                            )
                          })()}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <QuantitySelector isCart={true} value={item.quantity} onChange={(qty) => updateQuantity(item.id, qty)} />
                    <button
                      type="button"
                      disabled={mutating}
                      onClick={() => removeItem(item.id)}
                      className="text-[13px] text-muted underline hover:text-danger cursor-pointer disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="text-right min-[761px]:self-center col-span-2 min-[761px]:col-span-1 pt-2 min-[761px]:pt-0 border-t min-[761px]:border-0 border-line/50 flex min-[761px]:flex-col justify-between items-center min-[761px]:items-end">
                  <span className="min-[761px]:hidden text-xs text-muted">Price:</span>
                  <div className="font-sans text-[17px] font-bold text-ink">
                    {formatPrice(item.lineTotalCents)}
                  </div>
                  <div className="text-[12px] text-muted">
                    {formatPrice(item.unitPriceCents)} each
                  </div>
                </div>
              </div>
              )
            })}
          </div>

          {/* Sticky Summary Card */}
          <div className="rounded-card border border-line bg-surface p-7 min-[1041px]:sticky min-[1041px]:top-24">
            <h3 className="font-sans text-[19px] font-bold text-ink pb-4 border-b border-line m-0">
              Order Summary
            </h3>

            <div className="space-y-2.5 py-4 border-b border-line text-[14px]">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="text-ink font-semibold">{formatPrice(cartSubtotalCents)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping Charges</span>
                <span className={`font-semibold ${totalShippingCents === 0 ? 'text-[#17683f]' : 'text-ink'}`}>
                  {totalShippingCents === 0 ? 'FREE' : formatPrice(totalShippingCents)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-2 flex justify-between items-baseline font-sans">
              <span className="text-[16px] font-semibold text-ink">Total</span>
              <span className="text-[22px] font-bold text-accent">{formatPrice(cartFinalTotalCents)}</span>
            </div>

            <div className="mt-6">
              <Link to="/checkout" className="block">
                <Button variant="primary" size="lg" className="w-full text-base font-semibold">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>

            <div className="mt-4 text-center text-[12.5px] text-muted">
              Taxes calculated at checkout. Dispatched in 3 working days.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
