import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { fetchCustomer, setCustomerActive } from '../../features/customers/customersApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [updating, setUpdating] = useState(false)

  function load() {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchCustomer(id)
        .then(setCustomer)
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }

  useEffect(load, [id])

  async function handleToggleActive() {
    setUpdating(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const updated = await setCustomerActive(id, !customer.isActive)
      setCustomer((prev) => ({ ...prev, isActive: updated.isActive }))
      setSuccessMessage(updated.isActive ? 'Account reactivated.' : 'Account deactivated.')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(false)
    }
  }

  if (isLoading) return <p className="text-sm text-gray-500">Loading customer…</p>

  if (error && !customer) {
    return (
      <div>
        <Banner tone="error">{error}</Banner>
        <Link to="/customers" className="text-sm text-gray-600 hover:underline">
          ← Back to customers
        </Link>
      </div>
    )
  }

  if (!customer) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.email}</p>
        </div>
        <Link to="/customers" className="text-sm text-gray-600 hover:underline">
          ← Back to customers
        </Link>
      </div>

      <Banner tone="error">{error}</Banner>
      <Banner tone="success">{successMessage}</Banner>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Order history</h2>
            {customer.orders.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No orders yet.</p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <thead className="text-left text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="py-1.5">Order</th>
                    <th className="py-1.5">Date</th>
                    <th className="py-1.5">Status</th>
                    <th className="py-1.5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-100">
                      <td className="py-2">
                        <Link to={`/orders/${order.id}`} className="font-medium text-gray-900 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="py-2 text-gray-500">{order.status}</td>
                      <td className="py-2 text-gray-900">{formatPrice(order.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Saved addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No saved addresses.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="rounded-md border border-gray-100 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{address.fullName}</p>
                      {address.isDefault && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Default</span>}
                    </div>
                    <p className="mt-0.5 text-gray-500">{address.phone}</p>
                    <p className="mt-1 text-gray-700">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}, {address.country}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Joined</dt>
                <dd className="text-gray-900">{formatDate(customer.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total orders</dt>
                <dd className="text-gray-900">{customer.orderCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total order value</dt>
                <dd className="text-gray-900">{formatPrice(customer.totalOrderValueCents)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Account status</h2>
            <p className="mt-2 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {customer.isActive ? 'Active' : 'Deactivated'}
              </span>
            </p>
            <button
              type="button"
              disabled={updating}
              onClick={handleToggleActive}
              className="mt-3 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating ? 'Updating…' : customer.isActive ? 'Deactivate account' : 'Reactivate account'}
            </button>
            {!customer.isActive && (
              <p className="mt-2 text-xs text-gray-400">A deactivated customer can't log in or place orders until reactivated.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
