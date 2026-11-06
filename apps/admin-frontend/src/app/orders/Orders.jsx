import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { fetchOrders } from '../../features/orders/ordersApi.js'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'PRODUCT', label: 'Catalog products' },
  { value: 'CUSTOM_DESIGN', label: 'Custom 3D designs' },
]

const STATUS_TONE = {
  PENDING: 'bg-soft text-muted border border-line',
  PAID: 'bg-blue-950/40 text-blue-400 border border-blue-800/40',
  PROCESSING: 'bg-blue-950/40 text-blue-400 border border-blue-800/40',
  SHIPPED: 'bg-blue-950/40 text-blue-400 border border-blue-800/40',
  DELIVERED: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40',
  CANCELLED: 'bg-red-950/40 text-red-400 border border-red-800/40',
  REFUNDED: 'bg-red-950/40 text-red-400 border border-red-800/40',
}

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchOrders({ search: search || undefined, status: status || undefined, type: type || undefined })
        .then((result) => setOrders(result.orders))
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 300) // small debounce so typing in the search box doesn't fire a request per keystroke
    return () => clearTimeout(timer)
  }, [search, status, type])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight m-0">Orders</h1>
          <p className="mt-1 text-sm text-muted">Monitor and fulfill customer orders and manufactured custom 3D prints.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order #, customer name, email or design"
          className="w-80 max-w-full rounded-control border border-line bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-brand"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <Banner tone="error">{error}</Banner>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-12 text-center text-sm text-muted">
          No orders match these filters.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-alt text-xs font-semibold tracking-wider text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => {
                const hasCustom = order.items.some((i) => i.itemType === 'CUSTOM_DESIGN')
                const hasCatalog = order.items.some((i) => i.itemType === 'PRODUCT')
                return (
                  <tr key={order.id} className="hover:bg-soft/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/orders/${order.id}`} className="font-semibold text-brand hover:underline">
                        {order.orderNumber}
                      </Link>
                      <div className="text-xs text-muted mt-0.5">
                        {order.items.length} item{order.items.length === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {hasCustom && (
                          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30">
                            <svg className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
                            </svg>
                            Custom Design
                          </span>
                        )}
                        {hasCatalog && (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-soft text-muted border border-line">
                            Catalog
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div className="font-medium text-ink">{order.user.name}</div>
                      <div className="text-xs text-muted">{order.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{formatPrice(order.totalCents)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[order.status] ?? 'bg-soft text-muted'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
