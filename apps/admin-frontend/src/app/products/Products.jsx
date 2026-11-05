import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { fetchAdminProducts, updateProduct, deleteProduct } from '../../features/products/productsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

export default function Products() {
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage ?? null)
  const [busyId, setBusyId] = useState(null)

  function load() {
    setIsLoading(true)
    setError(null)
    fetchAdminProducts()
      .then((result) => setProducts(result.products))
      .catch((err) => setError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    if (location.state?.successMessage) {
      // Clear it from history state so a refresh/back doesn't re-show it.
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once on mount to consume the one-shot navigation message.
  }, [])

  async function toggleActive(product) {
    setBusyId(product.id)
    setError(null)
    try {
      await updateProduct(product.id, { isActive: !product.isActive })
      load()
    } catch (err) {
      setError(extractError(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setBusyId(product.id)
    setError(null)
    try {
      await deleteProduct(product.id)
      setSuccessMessage('Product deleted.')
      load()
    } catch (err) {
      setError(extractError(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Products</h1>
        <Link to="/products/new" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          New product
        </Link>
      </div>

      <Banner tone="error">{error}</Banner>
      <Banner tone="success">{successMessage}</Banner>

      {isLoading ? (
        <p className="text-sm text-muted">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted">No products yet. Create one to get started.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-line bg-surface text-sm">
          <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-line">
                <td className="px-4 py-2 text-ink">{product.name}</td>
                <td className="px-4 py-2 text-muted">{product.category?.name ?? '—'}</td>
                <td className="px-4 py-2 text-muted">₹{(product.priceCents / 100).toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-soft text-muted'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => toggleActive(product)}
                    className="mr-3 text-ink hover:underline disabled:opacity-50"
                  >
                    {product.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link to={`/products/${product.id}/edit`} className="mr-3 text-ink hover:underline">
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => handleDelete(product)}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
