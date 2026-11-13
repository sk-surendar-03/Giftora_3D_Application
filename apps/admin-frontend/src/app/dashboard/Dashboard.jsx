import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import StatCard from '../../components/StatCard.jsx'
import { fetchDashboard } from '../../features/reports/reportsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function Dashboard() {
  const [filter, setFilter] = useState('today')
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchDashboard({ range: filter })
        .then(setSummary)
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }, [filter])

  const periodLabel = filter === 'today' ? 'Today' : filter === '7d' ? 'Last 7 days' : 'Last 30 days'

  return (
    <div className="space-y-8">
      {/* Page Header with Functional Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line">
        <div>
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
            Metrics & Analytics
          </span>
          <h1 className="font-display text-[30px] font-semibold text-ink leading-tight mt-1 m-0">
            Operations Console
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-control border border-line bg-surface p-1 text-[13px] font-semibold text-muted">
            <button
              type="button"
              onClick={() => setFilter('today')}
              className={`px-3 py-1 rounded-[3px] transition-colors cursor-pointer ${
                filter === 'today' ? 'bg-accent text-on-accent font-bold' : 'hover:text-ink'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setFilter('7d')}
              className={`px-3 py-1 rounded-[3px] transition-colors cursor-pointer ${
                filter === '7d' ? 'bg-accent text-on-accent font-bold' : 'hover:text-ink'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setFilter('30d')}
              className={`px-3 py-1 rounded-[3px] transition-colors cursor-pointer ${
                filter === '30d' ? 'bg-accent text-on-accent font-bold' : 'hover:text-ink'
              }`}
            >
              30 Days
            </button>
          </div>
          <Link to="/reports" className="text-[13.5px] font-semibold text-accent hover:underline">
            Reports →
          </Link>
        </div>
      </div>

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Loading dashboard analytics…</p>
      ) : summary ? (
        <>
          {/* Top 4 Primary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value={formatPrice(summary.totalRevenueCents)}
              hint={periodLabel}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />
            <StatCard
              label="Total Orders"
              value={summary.totalOrders}
              hint={periodLabel}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M5 8h14l-1 12H6L5 8Z" />
                </svg>
              }
            />
            <StatCard
              label="Active Customers"
              value={summary.totalCustomers}
              hint="Registered accounts"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
                </svg>
              }
            />
            <StatCard
              label="Catalog Models"
              value={summary.totalProducts}
              hint="Ready for printing"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
                </svg>
              }
            />
          </div>

          {/* Orders by Status Pipeline Grid */}
          <div className="rounded-card border border-line bg-surface p-6">
            <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-4">
              Manufacturing & Fulfillment Pipeline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-control border border-line bg-alt p-3">
                <span className="text-[11px] font-semibold text-muted uppercase">Pending</span>
                <p className="mt-1 font-mono text-[20px] font-bold text-accent m-0">{summary.ordersByStatus.PENDING}</p>
              </div>
              <div className="rounded-control border border-line bg-alt p-3">
                <span className="text-[11px] font-semibold text-muted uppercase">Processing</span>
                <p className="mt-1 font-mono text-[20px] font-bold text-[#D9AE4E] m-0">{summary.ordersByStatus.PROCESSING}</p>
              </div>
              <div className="rounded-control border border-line bg-alt p-3">
                <span className="text-[11px] font-semibold text-muted uppercase">Shipped</span>
                <p className="mt-1 font-mono text-[20px] font-bold text-secondary m-0">{summary.ordersByStatus.SHIPPED}</p>
              </div>
              <div className="rounded-control border border-line bg-alt p-3">
                <span className="text-[11px] font-semibold text-muted uppercase">Delivered</span>
                <p className="mt-1 font-mono text-[20px] font-bold text-[#17683f] m-0">{summary.ordersByStatus.DELIVERED}</p>
              </div>
              <div className="rounded-control border border-line bg-alt p-3">
                <span className="text-[11px] font-semibold text-muted uppercase">Cancelled</span>
                <p className="mt-1 font-mono text-[20px] font-bold text-muted m-0">{summary.ordersByStatus.CANCELLED}</p>
              </div>
              <div className="rounded-control border border-line bg-alt p-3">
                <span className="text-[11px] font-semibold text-muted uppercase">Refunded</span>
                <p className="mt-1 font-mono text-[20px] font-bold text-danger m-0">{summary.ordersByStatus.REFUNDED}</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default Dashboard
