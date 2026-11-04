import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { fetchOrder, updateOrderStatus } from '../../features/orders/ordersApi.js'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString()
}

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusChoice, setStatusChoice] = useState('')
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  function load() {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchOrder(id)
        .then((data) => {
          setOrder(data)
          setStatusChoice(data.status)
        })
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }

  useEffect(load, [id])

  async function handleUpdateStatus() {
    setError(null)
    setSuccessMessage(null)
    setUpdating(true)
    try {
      const updated = await updateOrderStatus(id, statusChoice)
      setOrder(updated)
      setSuccessMessage(`Status updated to ${updated.status}.`)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(false)
    }
  }

  if (isLoading) return <p className="text-sm text-gray-500">Loading order…</p>

  if (error && !order) {
    return (
      <div>
        <Banner tone="error">{error}</Banner>
        <Link to="/orders" className="text-sm text-gray-600 hover:underline">
          ← Back to orders
        </Link>
      </div>
    )
  }

  if (!order) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <Link to="/orders" className="text-sm text-gray-600 hover:underline">
          ← Back to orders
        </Link>
      </div>

      <Banner tone="error">{error}</Banner>
      <Banner tone="success">{successMessage}</Banner>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Items</h2>
            <div className="mt-3 divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                    {item.customization && (
                      <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                        {Object.entries(item.customization).map(([key, value]) =>
                          value ? (
                            <div key={key} className="flex gap-1">
                              <dt className="capitalize">{key}:</dt>
                              <dd>{typeof value === 'object' ? (value.label ?? JSON.stringify(value)) : String(value)}</dd>
                            </div>
                          ) : null,
                        )}
                      </dl>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-gray-900">{formatPrice(item.unitPriceCents * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 ml-auto max-w-xs space-y-1 border-t border-gray-100 pt-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCents)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.totalCents)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Delivery address</h2>
            <div className="mt-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="mt-0.5 text-gray-500">{order.shippingAddress.phone}</p>
              <p className="mt-1">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Customer</h2>
            <p className="mt-2 text-sm font-medium text-gray-900">{order.user.name}</p>
            <p className="text-sm text-gray-500">{order.user.email}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Status</h2>
            <p className="mt-2 text-sm text-gray-500">Current: <span className="font-medium text-gray-900">{order.status}</span></p>
            <select
              value={statusChoice}
              onChange={(e) => setStatusChoice(e.target.value)}
              className="mt-3 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={updating || statusChoice === order.status}
              onClick={handleUpdateStatus}
              className="mt-3 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating ? 'Updating…' : 'Update status'}
            </button>
            <p className="mt-2 text-xs text-gray-400">
              Only valid workflow transitions are accepted (e.g. a cancelled or refunded order can't be reopened).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
