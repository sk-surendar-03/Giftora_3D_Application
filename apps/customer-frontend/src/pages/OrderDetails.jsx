import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchOrder } from '../features/orders/ordersApi.js'
import OrderItemsList from '../components/orders/OrderItemsList.jsx'
import OrderAddressSummary from '../components/orders/OrderAddressSummary.jsx'
import OrderStatusBadge from '../components/orders/OrderStatusBadge.jsx'
import OrderStatusTimeline from '../components/orders/OrderStatusTimeline.jsx'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function OrderDetails() {
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
    return <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-[15px] text-muted">Loading order details…</div>
  }

  if (state.error) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-[32px] font-semibold text-ink">Order not found</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">
            We couldn't find that order, or it doesn't belong to your account.{' '}
            <Link to="/my-orders" className="font-semibold text-accent hover:underline">
              Back to My Orders
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const order = state.data

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[900px] px-10 max-[760px]:px-[18px] py-12">
        <nav className="mb-6 text-[13px] text-muted">
          <Link to="/my-orders" className="hover:text-ink">
            My Orders
          </Link>
          <span className="mx-2 text-muted/60">/</span>
          <span className="text-ink font-semibold">{order.orderNumber}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-line mb-8">
          <div>
            <h1 className="font-mono text-[30px] max-[760px]:text-[24px] font-bold text-accent m-0">
              {order.orderNumber}
            </h1>
            <p className="mt-1 font-sans text-[13.5px] text-muted m-0">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <section className="mb-10 rounded-card border border-line bg-surface p-6">
          <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-6">
            Manufacturing & Dispatch Progress
          </h2>
          <div>
            <OrderStatusTimeline status={order.status} />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-4">
            Items in this order
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
            Delivery destination
          </h2>
          <div>
            <OrderAddressSummary address={order.shippingAddress} />
          </div>
        </section>
      </div>
    </div>
  )
}
