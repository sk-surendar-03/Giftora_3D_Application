import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import SimpleBarChart from '../../components/SimpleBarChart.jsx'
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
  return d.toISOString().slice(0, 10)
}

export default function OrdersReportTab() {
  const [from, setFrom] = useState(defaultDate(30))
  const [to, setTo] = useState(defaultDate(0))
  const [status, setStatus] = useState('')
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchOrderReport({ from, to, status: status || undefined })
        .then(setReport)
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [from, to, status])

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <label className="text-sm text-muted">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block rounded-md border border-line px-3 py-1.5 text-sm">
            <option value="">All</option>
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
        <p className="mt-6 text-sm text-muted">Loading order report…</p>
      ) : report ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Object.entries(report.ordersByStatus).map(([s, count]) => (
              <div key={s} className="rounded-lg border border-line bg-surface p-3 text-center">
                <p className="text-xs text-muted">{s}</p>
                <p className="mt-1 text-lg font-semibold text-ink">{count}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-line bg-surface p-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Orders over time</h2>
            <div className="mt-4">
              <SimpleBarChart data={report.ordersOverTime.map((d) => ({ label: d.date, value: d.orderCount }))} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Recent orders</h2>
              {report.recentOrders.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No orders in this range.</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {report.recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-line">
                        <td className="py-2">
                          <Link to={`/orders/${order.id}`} className="font-medium text-ink hover:underline">
                            {order.orderNumber}
                          </Link>
                          <div className="text-xs text-muted">{order.user.name}</div>
                        </td>
                        <td className="py-2 text-muted">{formatDate(order.createdAt)}</td>
                        <td className="py-2 text-muted">{order.status}</td>
                        <td className="py-2 text-right text-ink">{formatPrice(order.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
                Cancelled orders ({report.cancelledOrders.count})
              </h2>
              {report.cancelledOrders.orders.length === 0 ? (
                <p className="mt-3 text-sm text-muted">None in this range.</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {report.cancelledOrders.orders.map((order) => (
                      <tr key={order.id} className="border-t border-line">
                        <td className="py-2">
                          <Link to={`/orders/${order.id}`} className="font-medium text-ink hover:underline">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-2 text-muted">{formatDate(order.createdAt)}</td>
                        <td className="py-2 text-right text-ink">{formatPrice(order.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm text-muted">
            Order totals in range: <span className="font-medium text-ink">{formatPrice(report.orderTotalsCents)}</span> across{' '}
            {report.orderCount} order{report.orderCount === 1 ? '' : 's'}
          </p>
        </>
      ) : null}
    </div>
  )
}
