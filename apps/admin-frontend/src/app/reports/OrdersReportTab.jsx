import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import Banner from '../../components/Banner.jsx'
import { fetchOrderReport } from '../../features/reports/reportsApi.js'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function defaultDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function OrdersReportTab() {
  const [from, setFrom] = useState(() => defaultDate(30))
  const [to, setTo] = useState(() => defaultDate(0))
  const [allTime, setAllTime] = useState(false)
  const [status, setStatus] = useState('')
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function load() {
    if (!allTime && from && to && from > to) {
      setError('"From" date must not be later than "To" date.')
      return
    }
    setIsLoading(true)
    setError(null)
    const params = {
      ...(allTime ? { allTime: true } : { from, to }),
      status: status || undefined,
    }
    fetchOrderReport(params)
      .then(setReport)
      .catch((err) => setError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [from, to, allTime, status, refreshKey])

  function handleReset() {
    setFrom(defaultDate(30))
    setTo(defaultDate(0))
    setAllTime(false)
    setStatus('')
    setRefreshKey((k) => k + 1)
  }

  function handleApply() {
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          allTime={allTime}
          onAllTimeChange={setAllTime}
          onApply={handleApply}
          onReset={handleReset}
        />
        <label className="text-[13px] font-medium text-muted">
          Filter by Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 block h-9 rounded-control border border-line bg-surface px-3 text-[13px] text-ink focus:border-accent focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Loading order report…</p>
      ) : report ? (
        <>
          {/* Status Breakdown for selected range */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Object.entries(report.ordersByStatus).map(([s, count]) => (
              <div key={s} className="rounded-lg border border-line bg-surface p-3 text-center">
                <p className="text-xs text-muted truncate">{s}</p>
                <p className="mt-1 text-lg font-semibold text-ink">{count}</p>
              </div>
            ))}
          </div>

          {/* Recent Orders in range */}
          <div className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase mb-3">
              Orders In Range (Latest 10)
            </h2>
            {report.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No orders in this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-4 py-2">Order #</th>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-line hover:bg-alt/30 transition-colors">
                        <td className="px-4 py-2">
                          <Link to={`/orders/${order.id}`} className="font-mono text-xs font-bold text-accent hover:underline">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-ink">{order.user?.name ?? 'Guest'}</td>
                        <td className="px-4 py-2 text-xs text-muted">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-2 text-xs">
                          <span className="inline-block px-2 py-0.5 rounded bg-soft text-ink border border-line text-[11px] font-semibold">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-ink">{formatPrice(order.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
