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
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-muted sm:px-6">Loading your order…</div>
  }

  if (state.error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">Order not found</h1>
        <p className="mt-3 text-sm text-muted">
          We couldn't find that order. If you just placed it, check <Link to="/my-orders" className="font-medium text-ink hover:text-accent-dark">My Orders</Link>.
        </p>
      </div>
    )
  }

  const order = state.data

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark">✓</span>
        <h1 className="mt-4 text-2xl font-semibold text-ink">Order Confirmed</h1>
        <p className="mt-2 text-sm text-muted">
          Thank you — your order <span className="font-medium text-ink">{order.orderNumber}</span> has been placed.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Order summary</h2>
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

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to={`/orders/${order.id}`}>
          <Button variant="secondary">View order details</Button>
        </Link>
        <Link to="/products">
          <Button variant="accent">Continue shopping</Button>
        </Link>
      </div>
    </div>
  )
}
