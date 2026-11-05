import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { fetchCustomers } from '../../features/customers/customersApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchCustomers({ search: search || undefined, page })
        .then((result) => {
          setCustomers(result.customers)
          setMeta(result.meta)
        })
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search, page])

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Customers</h1>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Search by name or email"
        className="mt-6 w-80 max-w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="mt-4">
        <Banner tone="error">{error}</Banner>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading customers…</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-gray-500">No customers match this search.</p>
      ) : (
        <>
          <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Joined</th>
                <th className="px-4 py-2">Orders</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <Link to={`/customers/${customer.id}`} className="font-medium text-gray-900 hover:underline">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{customer.email}</td>
                  <td className="px-4 py-2 text-gray-500">{customer.phone ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {customer.orderCount} ({formatPrice(customer.totalOrderValueCents)})
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {customer.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
