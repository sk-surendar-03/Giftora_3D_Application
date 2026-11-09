import { useEffect, useState } from 'react'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import StatCard from '../../components/StatCard.jsx'
import Banner from '../../components/Banner.jsx'
import { fetchSalesReport } from '../../features/reports/reportsApi.js'

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

export default function SalesReportTab() {
  const [from, setFrom] = useState(() => defaultDate(30))
  const [to, setTo] = useState(() => defaultDate(0))
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!from || !to) return
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchSalesReport({ from, to })
        .then(setReport)
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [from, to])

  return (
    <div className="space-y-6">
      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Loading sales metrics…</p>
      ) : report ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={formatPrice(report.totalSalesCents)}
            hint={`Only collected payments (${report.revenueStatuses.join(', ')})`}
          />
          <StatCard label="Paid Orders" value={report.orderCount} />
          <StatCard label="Average Order Value" value={formatPrice(report.averageOrderValueCents)} />
        </div>
      ) : null}
    </div>
  )
}
