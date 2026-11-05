import { useEffect, useState } from 'react'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import StatCard from '../../components/StatCard.jsx'
import SimpleBarChart from '../../components/SimpleBarChart.jsx'
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
  return d.toISOString().slice(0, 10)
}

export default function SalesReportTab() {
  const [from, setFrom] = useState(defaultDate(30))
  const [to, setTo] = useState(defaultDate(0))
  const [granularity, setGranularity] = useState('day')
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchSalesReport({ from, to, granularity })
        .then(setReport)
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [from, to, granularity])

  return (
    <div>
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} granularity={granularity} onGranularityChange={setGranularity} />

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="mt-6 text-sm text-gray-500">Loading sales report…</p>
      ) : report ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total sales" value={formatPrice(report.totalSalesCents)} hint={`Counts: ${report.revenueStatuses.join(', ')}`} />
            <StatCard label="Order count" value={report.orderCount} />
            <StatCard label="Average order value" value={formatPrice(report.averageOrderValueCents)} />
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Sales by {granularity}</h2>
            <div className="mt-4">
              <SimpleBarChart data={report.salesByDate.map((d) => ({ label: d.date, value: d.totalCents }))} formatValue={formatPrice} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
