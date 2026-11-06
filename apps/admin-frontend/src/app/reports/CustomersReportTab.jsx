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
  return d.toISOString().slice(0, 10)
}

export default function CustomersReportTab() {
  const [from, setFrom] = useState(defaultDate(30))
  const [to, setTo] = useState(defaultDate(0))
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchCustomerReport({ from, to })
        .then(setReport)
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [from, to])

  return (
    <div>
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading customer report…</p>
      ) : report ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Total registered customers" value={report.totalCustomers} />
            <StatCard label="New customers in range" value={report.newCustomers} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Most orders</h2>
              {report.topCustomersByOrderCount.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No orders yet.</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {report.topCustomersByOrderCount.map((c) => (
                      <tr key={c.userId} className="border-t border-line">
                        <td className="py-2">
                          <p className="text-ink">{c.name}</p>
                          <p className="text-xs text-muted">{c.email}</p>
                        </td>
                        <td className="py-2 text-right text-muted">{c.orderCount} orders</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Highest order value</h2>
              {report.topCustomersByOrderValue.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No orders yet.</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {report.topCustomersByOrderValue.map((c) => (
                      <tr key={c.userId} className="border-t border-line">
                        <td className="py-2">
                          <p className="text-ink">{c.name}</p>
                          <p className="text-xs text-muted">{c.email}</p>
                        </td>
                        <td className="py-2 text-right text-muted">{formatPrice(c.totalOrderValueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">Emails are partially masked here to limit personal data shown in aggregate reports.</p>
        </>
      ) : null}
    </div>
  )
}
