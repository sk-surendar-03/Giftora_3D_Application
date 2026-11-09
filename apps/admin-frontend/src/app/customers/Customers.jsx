import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import Pagination from '../../components/Pagination.jsx'
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
      fetchCustomers({ search: search || undefined, page, pageSize: 20 })
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
      <h1 className="text-xl font-semibold text-ink">Customers</h1>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Search by name or email"
        className="mt-6 w-80 max-w-full rounded-md border border-line px-3 py-2 text-sm"
      />

      <div className="mt-4">
        <Banner tone="error">{error}</Banner>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading customers…</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-muted">No customers match this search.</p>
      ) : (
        <>
          <table className="w-full overflow-hidden rounded-lg border border-line bg-surface text-sm">
            <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
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
                <tr key={customer.id} className="border-t border-line">
                  <td className="px-4 py-2">
                    <Link to={`/customers/${customer.id}`} className="font-medium text-ink hover:underline">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted">{customer.email}</td>
                  <td className="px-4 py-2 text-muted">{customer.phone ?? '—'}</td>
                  <td className="px-4 py-2 text-muted">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-2 text-muted">
                    {customer.orderCount} ({formatPrice(customer.totalOrderValueCents)})
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-soft text-muted'}`}>
                      {customer.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            page={meta?.page ?? page}
            pageSize={20}
            total={meta?.total ?? customers.length}
            totalPages={meta?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
