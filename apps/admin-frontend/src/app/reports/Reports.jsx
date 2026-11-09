import { useEffect, useState } from 'react'
import SalesReportTab from './SalesReportTab.jsx'
import OrdersReportTab from './OrdersReportTab.jsx'
import ProductsReportTab from './ProductsReportTab.jsx'
import CustomersReportTab from './CustomersReportTab.jsx'
import StatCard from '../../components/StatCard.jsx'
import Banner from '../../components/Banner.jsx'
import { fetchDashboard } from '../../features/reports/reportsApi.js'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

const TABS = [
  { id: 'sales', label: 'Sales & Revenue', Component: SalesReportTab },
  { id: 'orders', label: 'Orders & Fulfillment', Component: OrdersReportTab },
  { id: 'products', label: 'Best-Selling Products', Component: ProductsReportTab },
  { id: 'customers', label: 'Customer Growth', Component: CustomersReportTab },
]

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales')
  const [summary, setSummary] = useState(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState(null)

  useEffect(() => {
    fetchDashboard()
      .then(setSummary)
      .catch((err) => setSummaryError(err.response?.data?.error ?? err.message ?? 'Failed to load report summary.'))
      .finally(() => setIsLoadingSummary(false))
  }, [])

  const Active = TABS.find((t) => t.id === activeTab)?.Component ?? SalesReportTab

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-line">
        <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
          Analytics & Intelligence
        </span>
        <h1 className="font-display text-[28px] font-semibold text-ink leading-tight mt-1 m-0">
          Executive Reports
        </h1>
        <p className="mt-1 text-xs text-muted">
          Real-time metrics, revenue recognition, sales trends, and order fulfillment breakdown across the platform.
        </p>
      </div>

      <Banner tone="error">{summaryError}</Banner>

      {/* Top Level Summary KPIs from actual backend data */}
      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value={formatPrice(summary.totalRevenueCents)}
              hint={`Collected via ${summary.revenueStatuses?.length ?? 4} paid states`}
            />
            <StatCard
              label="Total Orders"
              value={summary.totalOrders}
              hint="All-time created orders"
            />
            <StatCard
              label="Active Customers"
              value={summary.totalCustomers}
              hint="Registered accounts"
            />
            <StatCard
              label="Catalog Products"
              value={summary.totalProducts}
              hint="Available designs"
            />
          </div>

          {/* Real-time Order Status Breakdown */}
          {summary.ordersByStatus && (
            <div className="rounded-lg border border-line bg-surface p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase mb-3">
                Order Status Breakdown (All Time)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {Object.entries(summary.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="rounded border border-line bg-alt/50 p-2 text-center">
                    <span className="text-[11px] font-mono text-muted block truncate">{status}</span>
                    <span className="font-semibold text-ink text-base mt-0.5 block">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-line pt-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Panel */}
      <div className="pt-2">
        <Active />
      </div>
    </div>
  )
}
