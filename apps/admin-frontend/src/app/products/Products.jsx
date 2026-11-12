import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import Pagination from '../../components/Pagination.jsx'
import { fetchAdminProducts, updateProduct, deleteProduct } from '../../features/products/productsApi.js'
import { resolveImageUrl } from '../../utils/imageUrl.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(cents) {
  if (typeof cents !== 'number') return '—'
  return `₹${(cents / 100).toFixed(2)}`
}

export default function Products() {
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage ?? null)
  const [busyId, setBusyId] = useState(null)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  function load(targetPage = page) {
    setIsLoading(true)
    setError(null)
    fetchAdminProducts({ page: targetPage, pageSize: 20 })
      .then((result) => {
        setProducts(result.products || [])
        if (result?.meta) {
          setMeta(result.meta)
        }
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load(page)
  }, [page])

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [])

  async function toggleActive(product) {
    setBusyId(product.id)
    setError(null)
    try {
      await updateProduct(product.id, { isActive: !product.isActive })
      load(page)
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
      if (viewingProduct?.id === product.id) setViewingProduct(null)
      if (products.length === 1 && page > 1) {
        setPage((p) => p - 1)
      } else {
        load(page)
      }
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
        <div className="rounded-lg border border-line bg-surface p-12 text-center text-sm text-muted">
          No products yet. Create one to get started.
        </div>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-line bg-surface text-sm">
          <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-line hover:bg-alt/30 transition-colors">
                <td className="px-4 py-2 text-ink font-medium">{product.name}</td>
                <td className="px-4 py-2 text-muted">{product.category?.name ?? '—'}</td>
                <td className="px-4 py-2 text-muted font-mono">{formatPrice(product.priceCents)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.isActive ? 'bg-green-100 text-green-700' : 'bg-soft text-muted'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setViewingProduct(product)}
                    className="mr-3 text-accent hover:underline font-medium cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => toggleActive(product)}
                    className="mr-3 text-ink hover:underline disabled:opacity-50 cursor-pointer"
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
                    className="text-red-500 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isLoading && products.length > 0 && (
        <Pagination
          page={meta?.page ?? page}
          pageSize={20}
          total={meta?.total ?? products.length}
          totalPages={meta?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}

      {/* Product Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card border border-line bg-surface p-6 shadow-xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-accent">
                  PRODUCT DETAILS
                </span>
                <h2 className="font-display text-2xl font-semibold text-ink mt-1 m-0">
                  {viewingProduct.name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted">
                    Category: <span className="text-ink font-medium">{viewingProduct.category?.name ?? '—'}</span>
                  </span>
                  <span className="text-line">|</span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      viewingProduct.isActive ? 'bg-green-100 text-green-700' : 'bg-soft text-muted'
                    }`}
                  >
                    {viewingProduct.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="text-muted hover:text-ink text-lg px-2 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Product Image and Pricing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              {/* Product Images Preview */}
              <div>
                {viewingProduct.images && viewingProduct.images.length > 0 ? (
                  <div className="space-y-2">
                    <img
                      src={resolveImageUrl(viewingProduct.images[0])}
                      alt={viewingProduct.name}
                      className="w-full h-52 object-cover rounded-control border border-line bg-soft"
                    />
                    {viewingProduct.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {viewingProduct.images.slice(1).map((img, idx) => (
                          <img
                            key={idx}
                            src={resolveImageUrl(img)}
                            alt=""
                            className="h-14 w-14 object-cover rounded-control border border-line shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-52 rounded-control border border-line bg-soft flex items-center justify-center text-xs text-muted">
                    No image uploaded
                  </div>
                )}
              </div>

              {/* Pricing & Shipping Cards */}
              <div className="space-y-3">
                <div className="rounded-control border border-line bg-alt/60 p-3.5 space-y-2">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                    Pricing & Valuation
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-accent font-mono">
                      {formatPrice(viewingProduct.priceCents)}
                    </span>
                    {viewingProduct.originalPriceCents && viewingProduct.originalPriceCents > viewingProduct.priceCents && (
                      <span className="text-sm text-muted line-through font-mono">
                        {formatPrice(viewingProduct.originalPriceCents)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-control border border-line bg-alt/60 p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                    Shipping Configuration
                  </span>
                  <div className="text-sm font-medium text-ink">
                    {viewingProduct.shippingCents === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#34d399]">
                        <span>✓</span> Free Shipping for this product
                      </span>
                    ) : (
                      <span>Flat Rate: <span className="font-mono text-accent">{formatPrice(viewingProduct.shippingCents)}</span></span>
                    )}
                  </div>
                </div>

                <div className="rounded-control border border-line bg-alt/60 p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
                    Slug / SKU Reference
                  </span>
                  <span className="font-mono text-xs text-ink break-all">
                    {viewingProduct.slug}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                Description
              </span>
              <p className="text-sm text-ink bg-alt/40 border border-line rounded-control p-3.5 leading-relaxed m-0">
                {viewingProduct.description || 'No description provided.'}
              </p>
            </div>

            {/* Materials, Sizes, Shipping */}
            <div className="space-y-3 text-xs">
              {/* Material Options (structured with price) */}
              {Array.isArray(viewingProduct.materialOptions) && viewingProduct.materialOptions.length > 0 ? (
                <div className="rounded-control border border-line bg-alt/50 p-3 space-y-1.5">
                  <span className="font-semibold text-muted uppercase tracking-wider block">Materials & Pricing</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingProduct.materialOptions.map((m) => (
                      <span key={m.name} className="rounded bg-soft border border-line px-2 py-0.5 text-ink">
                        {m.name} — ₹{(m.priceCents / 100).toFixed(0)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-control border border-line bg-alt/50 p-3 space-y-1.5">
                  <span className="font-semibold text-muted uppercase tracking-wider block">Supported Materials</span>
                  {Array.isArray(viewingProduct.materials) && viewingProduct.materials.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProduct.materials.map((mat) => (
                        <span key={mat} className="rounded bg-soft border border-line px-2 py-0.5 text-ink">{mat}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">Standard</span>
                  )}
                </div>
              )}

              {/* Size Options (structured with addon price) */}
              {Array.isArray(viewingProduct.sizeOptions) && viewingProduct.sizeOptions.length > 0 ? (
                <div className="rounded-control border border-line bg-alt/50 p-3 space-y-1.5">
                  <span className="font-semibold text-muted uppercase tracking-wider block">Sizes & Additional Pricing</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingProduct.sizeOptions.map((s) => (
                      <span key={s.name} className="rounded bg-soft border border-line px-2 py-0.5 text-ink">
                        {s.name}{s.additionalCents > 0 ? ` +₹${(s.additionalCents / 100).toFixed(0)}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-control border border-line bg-alt/50 p-3 space-y-1.5">
                  <span className="font-semibold text-muted uppercase tracking-wider block">Available Sizes</span>
                  {Array.isArray(viewingProduct.sizes) && viewingProduct.sizes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProduct.sizes.map((sz) => (
                        <span key={sz} className="rounded bg-soft border border-line px-2 py-0.5 text-ink">{sz}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">One Size</span>
                  )}
                </div>
              )}

              {/* Shipping Methods */}
              {Array.isArray(viewingProduct.shippingMethods) && viewingProduct.shippingMethods.length > 0 && (
                <div className="rounded-control border border-line bg-alt/50 p-3 space-y-1.5">
                  <span className="font-semibold text-muted uppercase tracking-wider block">Shipping Methods</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingProduct.shippingMethods.map((m) => (
                      <span key={m.name} className="rounded bg-soft border border-line px-2 py-0.5 text-ink">
                        {m.name}{m.estimatedDays ? ` (${m.estimatedDays})` : ''} — {m.priceCents === 0 ? 'Free' : `₹${(m.priceCents / 100).toFixed(0)}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colors by Material Swatches */}
            {viewingProduct.colorsByMaterial && typeof viewingProduct.colorsByMaterial === 'object' && Object.keys(viewingProduct.colorsByMaterial).length > 0 && (
              <div className="rounded-control border border-line bg-alt/50 p-3 text-xs space-y-2">
                <span className="font-semibold text-muted uppercase tracking-wider block">Configured Colors</span>
                <div className="space-y-2">
                  {Object.entries(viewingProduct.colorsByMaterial).map(([mat, colors]) => (
                    <div key={mat} className="space-y-1">
                      <span className="text-[11px] font-bold text-accent">{mat}:</span>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(colors) && colors.map((col, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-surface border border-line px-2 py-1 rounded">
                            <span
                              className="h-3 w-3 rounded-full border border-line"
                              style={{ backgroundColor: typeof col === 'string' ? col : col.hex }}
                            />
                            <span className="text-[11px] text-ink">{typeof col === 'string' ? col : col.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex flex-wrap items-center justify-between text-xs text-muted pt-2 border-t border-line">
              <span>Created: {formatDate(viewingProduct.createdAt)}</span>
              <span>Last Updated: {formatDate(viewingProduct.updatedAt)}</span>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
              <Link
                to={`/products/${viewingProduct.id}/edit`}
                className="rounded-control bg-accent px-4 py-2 text-xs font-bold text-on-accent hover:opacity-90 transition-opacity"
              >
                Edit Product
              </Link>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="rounded-control border border-line bg-alt px-4 py-2 text-xs font-medium text-ink hover:bg-soft cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
