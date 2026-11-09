import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import Pagination from '../../components/Pagination.jsx'
import { fetchOrders } from '../../features/orders/ordersApi.js'

const STATUS_OPTIONS = ['ALL', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All order types' },
  { value: 'PRODUCT', label: 'Catalog / Product orders' },
  { value: 'CUSTOM_DESIGN', label: 'Custom 3D orders' },
]

const STATUS_TONE = {
  PENDING: 'bg-soft text-muted border border-line',
  PAID: 'bg-accent/15 text-accent border border-accent/30',
  PROCESSING: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  SHIPPED: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border border-red-500/30',
  REFUNDED: 'bg-red-500/15 text-red-400 border border-red-500/30',
}

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('ALL')
  const [type, setType] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      fetchOrders({
        page,
        pageSize: 20,
        search: search.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
        type: type === 'ALL' ? undefined : type,
      })
        .then((result) => {
          const list = Array.isArray(result) ? result : result?.orders ?? []
          // Ensure newest orders first (sorted by actual creation date descending)
          const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          setOrders(sorted)
          if (result?.meta) {
            setMeta(result.meta)
            window.dispatchEvent(new CustomEvent('giftora:orders-updated'))
          }
        })
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [search, status, type, page])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-ink">Orders</h1>
            {meta?.total != null && (
              <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-accent border border-line">
                {meta.total}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {meta?.total != null
              ? `Showing ${orders.length} of ${meta.total} order${meta.total === 1 ? '' : 's'} · Sorted newest first.`
              : 'Manage industrial 3D manufacturing orders sorted newest first.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by order number or customer…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="h-9 w-64 rounded-control border border-line bg-surface px-3 text-xs text-ink placeholder:text-muted outline-none focus:border-accent"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-control border border-line bg-surface px-3 text-xs text-ink outline-none focus:border-accent cursor-pointer"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All statuses' : s}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-control border border-line bg-surface px-3 text-xs text-ink outline-none focus:border-accent cursor-pointer"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {(status !== 'ALL' || type !== 'ALL' || search) && (
          <button
            type="button"
            onClick={() => {
              setStatus('ALL')
              setType('ALL')
              setSearch('')
              setPage(1)
            }}
            className="text-xs text-muted hover:text-ink underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-4">
        <Banner tone="error">{error}</Banner>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="mt-4 rounded-lg border border-line bg-surface p-12 text-center text-sm text-muted">
          No orders match these filters.
        </div>
      ) : (
        <table className="mt-4 w-full overflow-hidden rounded-lg border border-line bg-surface text-sm">
          <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Date (Newest First)</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const hasCustom = order.items.some((i) => i.itemType === 'CUSTOM_DESIGN')
              const hasCatalog = order.items.some((i) => i.itemType === 'PRODUCT')
              return (
                <tr key={order.id} className="border-t border-line hover:bg-alt/30 transition-colors">
                  <td className="px-4 py-2">
                    <Link to={`/orders/${order.id}`} className="font-semibold text-accent hover:underline font-mono">
                      {order.orderNumber}
                    </Link>
                    <div className="text-xs text-muted mt-0.5">
                      {order.items.length} item{order.items.length === 1 ? '' : 's'}
                    </div>
                  </td>
                  <td className="px-4 py-2">
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
                  <td className="px-4 py-2 text-muted">
                    <div className="font-medium text-ink">{order.user.name}</div>
                    <div className="text-xs text-muted">{order.user.email}</div>
                  </td>
                  <td className="px-4 py-2 text-muted whitespace-nowrap text-xs font-mono">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-2 font-semibold text-ink whitespace-nowrap font-mono">
                    {formatPrice(order.totalCents)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_TONE[order.status] ?? 'bg-soft text-muted border border-line'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {!isLoading && orders.length > 0 && (
        <Pagination
          page={meta?.page ?? page}
          pageSize={20}
          total={meta?.total ?? orders.length}
          totalPages={meta?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
