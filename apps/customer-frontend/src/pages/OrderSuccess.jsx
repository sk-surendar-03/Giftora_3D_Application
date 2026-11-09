import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchOrder } from '../features/orders/ordersApi.js'
import OrderItemsList from '../components/orders/OrderItemsList.jsx'
import OrderAddressSummary from '../components/orders/OrderAddressSummary.jsx'
import Button from '../components/ui/Button'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function CelebrationAnimation() {
  return (
    <div className="relative mx-auto w-24 h-24 mb-5 flex items-center justify-center">
      {/* Soft pulse glow background */}
      <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping opacity-60 pointer-events-none" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/30 to-amber-300/10 blur-md pointer-events-none" />

      {/* Confetti particles */}
      <span className="absolute -top-1 left-3 h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.1s' }} />
      <span className="absolute top-2 -right-1 h-2 w-2 rounded-sm bg-amber-400 rotate-45 animate-bounce" style={{ animationDelay: '0.3s' }} />
      <span className="absolute -bottom-1 -left-1 h-2.5 w-1.5 rounded-full bg-emerald-400 rotate-12 animate-bounce" style={{ animationDelay: '0.5s' }} />
      <span className="absolute bottom-2 -right-2 h-2 w-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
      <span className="absolute top-0 right-7 h-1.5 w-3 rounded-full bg-rose-400 rotate-45 animate-pulse" />

      {/* Main checkmark celebratory badge */}
      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-on-accent shadow-lg shadow-accent/25 border-2 border-accent">
        <svg
          className="h-10 w-10 text-on-accent animate-in zoom-in-75 duration-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </div>
  )
}

export default function OrderSuccess() {
  const { orderId } = useParams()
  const [state, setState] = useState({ data: null, isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setState({ data: null, isLoading: true, error: null })
      fetchOrder(orderId, controller.signal)
        .then((order) => setState({ data: order, isLoading: false, error: null }))
        .catch((err) => {
          if (controller.signal.aborted) return
          setState({ data: null, isLoading: false, error: err })
        })
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [orderId])

  if (state.isLoading) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex flex-col items-center justify-center gap-3 text-sm text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
        <span>Confirming your order details…</span>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-[32px] font-semibold text-ink">Order not found</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">
            We couldn't find that order. If you just placed it, check{' '}
            <Link to="/my-orders" className="font-semibold text-accent hover:underline">
              My Orders
            </Link>
            .
          </p>
          <div className="mt-6">
            <Link to="/products">
              <Button variant="primary">Return to Shop</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const order = state.data

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[800px] px-10 max-[760px]:px-[18px] py-12">
        {/* Celebration Success Hero Banner */}
        <div className="text-center rounded-card border border-accent/40 bg-surface/90 backdrop-blur-sm p-8 sm:p-10 mb-10 shadow-sm relative overflow-hidden">
          {/* Subtle decorative top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />

          {/* Celebration Animation */}
          <CelebrationAnimation />

          <h1 className="font-display text-[36px] max-[760px]:text-[28px] font-bold text-ink leading-tight m-0">
            Order Placed Successfully!
          </h1>
          <p className="mt-3 font-sans text-base text-muted max-w-lg mx-auto leading-relaxed">
            Thank you for your order. Your personalized gift is now being prepared.
          </p>

          {/* Order Metadata Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-control bg-soft border border-line px-3.5 py-1.5 text-xs text-muted">
              <span>Order Number:</span>
              <span className="font-mono font-bold text-accent text-sm">{order.orderNumber}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-control bg-[#17683f]/20 border border-[#17683f]/40 px-3.5 py-1.5 text-xs font-semibold text-[#34d399]">
              <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" />
              <span>Confirmed · Manufacturing Scheduled</span>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to={`/orders/${order.id}`}>
              <Button variant="primary" size="lg" className="font-semibold">
                View Order Details
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="secondary" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <section className="mb-10">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0">
              Ordered Items
            </h2>
            <span className="text-xs text-muted">
              {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? '' : 's'}
            </span>
          </div>

          <OrderItemsList items={order.items} />

          {/* Cost breakdown */}
          <div className="mt-6 ml-auto max-w-xs space-y-2.5 rounded-card border border-line bg-surface p-5 text-[14px]">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="text-ink font-semibold">{formatPrice(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span className="text-[#34d399] font-semibold">{formatPrice(order.shippingCents)}</span>
            </div>
            <div className="pt-2 border-t border-line flex justify-between font-sans">
              <span className="text-[16px] font-semibold text-ink">Total</span>
              <span className="text-[20px] font-bold text-accent">{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </section>

        {/* Delivery Address */}
        <section className="mb-10">
          <div className="pb-3 border-b border-line mb-4">
            <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0">
              Shipping Destination
            </h2>
          </div>
          <OrderAddressSummary address={order.shippingAddress} />
        </section>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-line">
          <Link to={`/orders/${order.id}`}>
            <Button variant="primary" size="lg">
              View Order Details
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="secondary" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
