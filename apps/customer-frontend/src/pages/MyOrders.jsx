import { Link, Navigate } from 'react-router-dom'
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
  if (!items || items.length === 0) return 'Custom Order'
  if (items.length === 1) return items[0].productName
  return `${items[0].productName} and ${items.length - 1} more`
}

export default function MyOrders() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: orders, isLoading, error } = useOrders()

  if (authLoading) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-sm text-muted">
        Checking account access…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/my-orders' }} replace />
  }

  if (isLoading) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-sm text-muted">
        Loading your orders…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="rounded-card border border-line bg-surface p-8 text-center max-w-md">
          <p className="text-danger font-semibold mb-2">Could not load orders</p>
          <p className="text-sm text-muted mb-4">{error.message || 'Please try again later.'}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-soft border border-line flex items-center justify-center text-2xl text-accent">
            📦
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink">No orders yet</h2>
          <p className="mt-2 text-sm text-muted">
            You haven't placed any orders with this account yet. Design your personalized 3D keychain or nameplate!
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/customise">
              <Button variant="primary">Design 3D Keepsake</Button>
            </Link>
            <Link to="/products">
              <Button variant="secondary">Browse Catalog</Button>
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
                Customer Account
              </span>
              <h1 className="font-display text-[38px] max-[760px]:text-[28px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-2">
                Track Orders / My Orders
              </h1>
            </div>
            {user && (
              <div className="rounded-card border border-line bg-surface px-4 py-2.5 text-xs text-muted flex flex-wrap items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-ink">{user.name}</span>
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <span className="border-l border-line pl-3 font-mono text-ink">{user.phone}</span>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            Track your manufacturing progress, fulfillment status, and courier tracking in real time.
          </p>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block rounded-card border border-line bg-surface p-6 transition-all hover:border-accent hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-mono text-[15px] font-bold text-accent m-0">{order.orderNumber}</p>
                    <OrderStatusBadge status={order.status} />
                    {order.trackingNumber && (
                      <span className="inline-flex items-center gap-1 rounded bg-soft px-2 py-0.5 text-xs font-mono font-medium text-ink border border-line">
                        <svg className="h-3 w-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="3" width="15" height="13" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        {order.shippingCarrier ? `${order.shippingCarrier}: ` : ''}{order.trackingNumber}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-[15px] font-medium text-ink m-0">
                    {itemSummary(order.items)}
                  </p>
                  <p className="text-xs text-muted m-0">
                    Placed on {formatDate(order.createdAt)} · {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-bold text-ink m-0">{formatPrice(order.totalCents)}</p>
                  <span className="mt-2 inline-flex items-center text-xs font-semibold text-accent">
                    View Tracking Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
