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
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchDashboard()
        .then(setSummary)
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <Link to="/reports" className="text-sm font-medium text-gray-600 hover:underline">
          View detailed reports →
        </Link>
      </div>

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="mt-6 text-sm text-gray-500">Loading dashboard…</p>
      ) : summary ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total customers" value={summary.totalCustomers} />
            <StatCard label="Total orders" value={summary.totalOrders} />
            <StatCard
              label="Total revenue"
              value={formatPrice(summary.totalRevenueCents)}
              hint={`Counts: ${summary.revenueStatuses.join(', ')}`}
            />
            <StatCard label="Total products" value={summary.totalProducts} />
            <StatCard label="Pending orders" value={summary.ordersByStatus.PENDING} />
            <StatCard label="Processing orders" value={summary.ordersByStatus.PROCESSING} />
            <StatCard label="Shipped orders" value={summary.ordersByStatus.SHIPPED} />
            <StatCard label="Delivered orders" value={summary.ordersByStatus.DELIVERED} />
            <StatCard label="Cancelled orders" value={summary.ordersByStatus.CANCELLED} />
            <StatCard label="Refunded orders" value={summary.ordersByStatus.REFUNDED} />
            <StatCard
              label="Low-stock products"
              value={summary.inventoryTrackingAvailable ? summary.lowStockProducts : '—'}
              hint={summary.inventoryTrackingAvailable ? undefined : 'Inventory tracking not implemented'}
            />
            <StatCard
              label="Out-of-stock products"
              value={summary.inventoryTrackingAvailable ? summary.outOfStockProducts : '—'}
              hint={summary.inventoryTrackingAvailable ? undefined : 'Inventory tracking not implemented'}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

export default Dashboard
