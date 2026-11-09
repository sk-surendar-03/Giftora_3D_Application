import { useEffect, useState } from 'react'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import StatCard from '../../components/StatCard.jsx'
import Banner from '../../components/Banner.jsx'
import { fetchCustomerReport } from '../../features/reports/reportsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function defaultDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CustomersReportTab() {
  const [from, setFrom] = useState(() => defaultDate(30))
  const [to, setTo] = useState(() => defaultDate(0))
  const [allTime, setAllTime] = useState(false)
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
    const params = allTime ? { allTime: true } : { from, to }
    fetchCustomerReport(params)
      .then(setReport)
      .catch((err) => setError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [from, to, allTime, refreshKey])

  function handleReset() {
    setFrom(defaultDate(30))
    setTo(defaultDate(0))
    setAllTime(false)
    setRefreshKey((k) => k + 1)
  }

  function handleApply() {
    load()
  }

  return (
    <div className="space-y-6">
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

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Loading customer metrics…</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Total Registered Customers" value={report.totalCustomers} />
            <StatCard label="New Customers (In Date Range)" value={report.newCustomers} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top customers by order count */}
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase mb-3">
                Frequent Buyers (By Order Count)
              </h2>
              {report.topCustomersByOrderCount.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No orders yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2 text-right">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topCustomersByOrderCount.map((c, i) => (
                      <tr key={c.userId || `cust-ord-${i}`} className="border-t border-line hover:bg-alt/30 transition-colors">
                        <td className="px-4 py-2">
                          <p className="text-ink font-medium m-0">{c.name}</p>
                          <p className="text-xs text-muted font-mono m-0">{c.email}</p>
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-muted">{c.orderCount} orders</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Top customers by total spend */}
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase mb-3">
                High-Value Customers (By Spend)
              </h2>
              {report.topCustomersByOrderValue.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No orders yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2 text-right">Lifetime Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topCustomersByOrderValue.map((c, i) => (
                      <tr key={c.userId || `cust-val-${i}`} className="border-t border-line hover:bg-alt/30 transition-colors">
                        <td className="px-4 py-2">
                          <p className="text-ink font-medium m-0">{c.name}</p>
                          <p className="text-xs text-muted font-mono m-0">{c.email}</p>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-ink">{formatPrice(c.totalOrderValueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <p className="text-xs text-muted">
            Customer email addresses are partially masked in aggregate reports to protect customer privacy.
          </p>
        </>
      ) : null}
    </div>
  )
}
