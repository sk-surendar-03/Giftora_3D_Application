import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { fetchOrders } from '../../features/orders/ordersApi.js'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const STATUS_TONE = {
  PENDING: 'bg-gray-100 text-gray-600',
  PAID: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-red-100 text-red-700',
}

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchOrders({ search: search || undefined, status: status || undefined })
        .then((result) => setOrders(result.orders))
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 300) // small debounce so typing in the search box doesn't fire a request per keystroke
    return () => clearTimeout(timer)
  }, [search, status])

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number, customer name or email"
          className="w-80 max-w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <Banner tone="error">{error}</Banner>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500">No orders match these filters.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link to={`/orders/${order.id}`} className="font-medium text-gray-900 hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {order.user.name}
                  <div className="text-xs text-gray-400">{order.user.email}</div>
                </td>
                <td className="px-4 py-2 text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-2 text-gray-900">{formatPrice(order.totalCents)}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
