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
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-[32px] font-semibold text-ink">My Orders</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">Sign in to view your orders.</p>
          <div className="mt-6">
            <Link to="/login" state={{ from: '/my-orders' }}>
              <Button variant="primary" size="md">Sign in</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-[15px] text-muted">Loading your orders…</div>
  }

  if (error) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger">
          Something went wrong loading your orders. Please try again.
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-[32px] font-semibold text-ink">My Orders</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">You haven't placed any custom orders yet.</p>
          <div className="mt-6">
            <Link to="/products">
              <Button variant="primary" size="md">Browse products</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[900px] px-10 max-[760px]:px-[18px] py-12">
        <div className="pb-6 border-b border-line mb-8">
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
            Customer Dashboard
          </span>
          <h1 className="font-display text-[38px] max-[760px]:text-[28px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-2">
            My Orders
          </h1>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block rounded-card border border-line bg-surface p-6 transition-colors hover:border-accent"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-[14px] font-bold text-accent m-0">{order.orderNumber}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-muted m-0">{formatDate(order.createdAt)}</p>
                  <p className="mt-3 font-sans text-[15px] font-medium text-ink m-0">{itemSummary(order.items)}</p>
                </div>
                <div className="text-right">
                  <p className="font-sans text-[18px] font-bold text-ink m-0">{formatPrice(order.totalCents)}</p>
                  <span className="text-[12.5px] text-accent mt-1 inline-block font-semibold">View details →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
