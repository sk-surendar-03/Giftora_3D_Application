import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import { useOrders } from '../features/orders/useOrders.js'
import OrderStatusBadge from '../components/orders/OrderStatusBadge.jsx'
import Button from '../components/ui/Button'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function itemSummary(items) {
  if (items.length === 1) return items[0].productName
  return `${items[0].productName} and ${items.length - 1} more`
}

export default function MyOrders() {
  const { isAuthenticated } = useAuth()
  const { data: orders, isLoading, error } = useOrders()

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">My Orders</h1>
        <p className="mt-3 text-sm text-muted">Sign in to view your orders.</p>
        <Link to="/login" state={{ from: '/my-orders' }} className="mt-6 inline-block">
          <Button variant="accent">Sign in</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-muted sm:px-6">Loading your orders…</div>
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger sm:px-6">
        Something went wrong loading your orders. Please try again.
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">My Orders</h1>
        <p className="mt-3 text-sm text-muted">You haven't placed any orders yet.</p>
        <Link to="/products" className="mt-6 inline-block">
          <Button variant="accent">Browse products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">My Orders</h1>

      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block rounded-card border border-border bg-surface p-5 transition-colors hover:border-ink/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{order.orderNumber}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-xs text-muted">{formatDate(order.createdAt)}</p>
                <p className="mt-2 text-sm text-ink">{itemSummary(order.items)}</p>
              </div>
              <p className="text-sm font-semibold text-ink">{formatPrice(order.totalCents)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
