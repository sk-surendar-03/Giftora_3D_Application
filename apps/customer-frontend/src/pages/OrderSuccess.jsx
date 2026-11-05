import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchOrder } from '../features/orders/ordersApi.js'
import OrderItemsList from '../components/orders/OrderItemsList.jsx'
import OrderAddressSummary from '../components/orders/OrderAddressSummary.jsx'
import Button from '../components/ui/Button'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
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
    return <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-[15px] text-muted">Loading your order confirmation…</div>
  }

  if (state.error) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-[32px] font-semibold text-ink">Order not found</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">
            We couldn't find that order. If you just placed it, check <Link to="/my-orders" className="font-semibold text-accent hover:underline">My Orders</Link>.
          </p>
        </div>
      </div>
    )
  }

  const order = state.data

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[800px] px-10 max-[760px]:px-[18px] py-12">
        <div className="text-center rounded-card border border-line bg-surface p-8 mb-10">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e3f4ea] text-[#17683f] text-2xl font-bold mb-4">
            ✓
          </span>
          <h1 className="font-display text-[36px] max-[760px]:text-[28px] font-semibold text-ink leading-tight m-0">
            Order Confirmed
          </h1>
          <p className="mt-3 font-sans text-[15px] text-muted leading-relaxed">
            Thank you — your custom 3D order <span className="font-mono font-bold text-accent">{order.orderNumber}</span> has been scheduled for manufacturing.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-4">
            Order summary
          </h2>
          <div>
            <OrderItemsList items={order.items} />
          </div>

          <div className="mt-6 ml-auto max-w-xs space-y-2.5 rounded-card border border-line bg-surface p-5 text-[14px]">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="text-ink font-semibold">{formatPrice(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span className="text-[#17683f] font-semibold">{formatPrice(order.shippingCents)}</span>
            </div>
            <div className="pt-2 border-t border-line flex justify-between font-sans">
              <span className="text-[16px] font-semibold text-ink">Total</span>
              <span className="text-[20px] font-bold text-accent">{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-4">
            Shipping address
          </h2>
          <div>
            <OrderAddressSummary address={order.shippingAddress} />
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-line">
          <Link to={`/orders/${order.id}`}>
            <Button variant="primary" size="lg">Track Order Status</Button>
          </Link>
          <Link to="/products">
            <Button variant="secondary" size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
