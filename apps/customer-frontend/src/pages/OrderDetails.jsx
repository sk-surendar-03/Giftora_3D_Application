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
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-muted sm:px-6">Loading order…</div>
  }

  if (state.error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">Order not found</h1>
        <p className="mt-3 text-sm text-muted">
          We couldn't find that order, or it doesn't belong to your account.{' '}
          <Link to="/my-orders" className="font-medium text-ink hover:text-accent-dark">
            Back to My Orders
          </Link>
        </p>
      </div>
    )
  }

  const order = state.data

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link to="/my-orders" className="hover:text-ink">
          My Orders
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Tracking</h2>
        <div className="mt-4">
          <OrderStatusTimeline status={order.status} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Items</h2>
        <div className="mt-3">
          <OrderItemsList items={order.items} />
        </div>

        <div className="mt-4 ml-auto max-w-xs space-y-2">
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>Shipping</span>
            <span>{formatPrice(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-ink">
            <span>Total</span>
            <span>{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Delivery address</h2>
        <div className="mt-3">
          <OrderAddressSummary address={order.shippingAddress} />
        </div>
      </section>
    </div>
  )
}
