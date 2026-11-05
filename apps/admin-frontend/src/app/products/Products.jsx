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
        <h1 className="text-xl font-semibold text-gray-900">Products</h1>
        <Link to="/products/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          New product
        </Link>
      </div>

      <Banner tone="error">{error}</Banner>
      <Banner tone="success">{successMessage}</Banner>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500">No products yet. Create one to get started.</p>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
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
              <tr key={product.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-900">{product.name}</td>
                <td className="px-4 py-2 text-gray-500">{product.category?.name ?? '—'}</td>
                <td className="px-4 py-2 text-gray-500">₹{(product.priceCents / 100).toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => toggleActive(product)}
                    className="mr-3 text-gray-900 hover:underline disabled:opacity-50"
                  >
                    {product.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link to={`/products/${product.id}/edit`} className="mr-3 text-gray-900 hover:underline">
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
