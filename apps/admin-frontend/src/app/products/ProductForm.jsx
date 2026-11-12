import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { slugify } from '../../utils/slugify.js'
import { fetchCategories } from '../../features/categories/categoriesApi.js'
import { fetchAdminProducts, createProduct, updateProduct, uploadProductModel } from '../../features/products/productsApi.js'
import MaterialOptionsEditor from './MaterialOptionsEditor.jsx'
import SizeOptionsEditor from './SizeOptionsEditor.jsx'
import ShippingMethodsEditor from './ShippingMethodsEditor.jsx'
import ModelUploadSection from './ModelUploadSection.jsx'
import ProductImagesSection from './ProductImagesSection.jsx'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  price: '', // selling price in rupees
  originalPrice: '', // original / strikethrough price in rupees (optional)
  shippingType: 'FREE', // 'FREE' or 'PAID'
  shippingPrice: '0', // in rupees
  categoryId: '',
  materials: '', // comma-separated (legacy fallback)
  sizes: '', // comma-separated (legacy fallback)
  images: [], // array of image URLs
  colorsByMaterial: {}, // object: { [material]: [{ label, hex, imageUrl? }] }
  materialOptions: [], // [{name, priceCents}]
  sizeOptions: [],     // [{name, additionalCents}]
  shippingMethods: [], // [{name, priceCents, estimatedDays?}]
  imageMaterials: {},  // { [imageUrl]: [material, ...] }
  isActive: true,
}

export default function ProductForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(isEditing)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [error, setError] = useState(location.state?.modelError ?? null)
  const [model, setModel] = useState(null) // saved STL/3MF summary from the API
  const [stagedModel, setStagedModel] = useState(null) // File chosen before the product exists
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories().then(setCategories).catch((err) => setError(extractError(err)))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    const timer = setTimeout(() => {
      setIsLoading(true)
      fetchAdminProducts()
        .then((result) => {
          const product = result.products.find((p) => p.id === id)
          if (!product) {
            setError('Product not found.')
            return
          }
          setModel(product.model ?? null)
          const shippingCents = product.shippingCents || 0
          setForm({
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: String(product.priceCents / 100),
            originalPrice: product.originalPriceCents ? String(product.originalPriceCents / 100) : '',
            shippingType: shippingCents > 0 ? 'PAID' : 'FREE',
            shippingPrice: shippingCents > 0 ? String(shippingCents / 100) : '0',
            categoryId: product.categoryId ?? '',
            materials: (product.materials ?? []).join(', '),
            sizes: (product.sizes ?? []).join(', '),
            images: Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []),
            colorsByMaterial: product.colorsByMaterial && typeof product.colorsByMaterial === 'object' ? product.colorsByMaterial : {},
            materialOptions: Array.isArray(product.materialOptions) ? product.materialOptions : [],
            sizeOptions: Array.isArray(product.sizeOptions) ? product.sizeOptions : [],
            shippingMethods: Array.isArray(product.shippingMethods) ? product.shippingMethods : [],
            imageMaterials: product.imageMaterials && typeof product.imageMaterials === 'object' ? product.imageMaterials : {},
            isActive: product.isActive,
          })
        })
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }, [id, isEditing])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function parseListField(value) {
    if (Array.isArray(value)) return value
    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function buildPayload() {
    const priceNumber = Number(form.price)
    if (!form.name.trim()) throw new Error('Name is required.')
    if (!form.slug.trim()) throw new Error('Slug is required.')
    if (!form.description.trim()) throw new Error('Description is required.')
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) throw new Error('Price must be a positive number.')

    let originalPriceCents = null
    if (form.originalPrice && form.originalPrice.trim() !== '') {
      const origNumber = Number(form.originalPrice)
      if (!Number.isFinite(origNumber) || origNumber <= 0) {
        throw new Error('Original price must be a positive number if provided.')
      }
      originalPriceCents = Math.round(origNumber * 100)
    }

    let colorsByMaterial = form.colorsByMaterial
    if (typeof colorsByMaterial === 'string') {
      if (colorsByMaterial.trim()) {
        try {
          colorsByMaterial = JSON.parse(colorsByMaterial)
        } catch {
          throw new Error('Colors by material must be valid JSON or configured via color editor.')
        }
      } else {
        colorsByMaterial = null
      }
    } else if (colorsByMaterial && typeof colorsByMaterial === 'object') {
      // Clean up empty material arrays if needed or preserve configured structure
      const cleaned = {}
      for (const [mat, cols] of Object.entries(colorsByMaterial)) {
        if (Array.isArray(cols) && cols.length > 0) {
          cleaned[mat] = cols
        }
      }
      colorsByMaterial = Object.keys(cleaned).length > 0 ? cleaned : null
    } else {
      colorsByMaterial = null
    }

    let shippingCents = 0
    if (form.shippingType === 'PAID') {
      const shipNumber = Number(form.shippingPrice)
      if (!Number.isFinite(shipNumber) || shipNumber < 0) {
        throw new Error('Shipping charge must be a valid number of ₹0 or more.')
      }
      shippingCents = Math.round(shipNumber * 100)
    }

    const resolvedImages = Array.isArray(form.images)
      ? form.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
      : parseListField(form.images)

    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      priceCents: Math.round(priceNumber * 100),
      originalPriceCents,
      shippingCents,
      categoryId: form.categoryId || null,
      materials: parseListField(form.materials),
      sizes: parseListField(form.sizes),
      images: resolvedImages,
      ...(colorsByMaterial !== null ? { colorsByMaterial } : { colorsByMaterial: null }),
      materialOptions: form.materialOptions.length > 0 ? form.materialOptions : null,
      sizeOptions: form.sizeOptions.length > 0 ? form.sizeOptions : null,
      shippingMethods: form.shippingMethods.length > 0 ? form.shippingMethods : null,
      imageMaterials: Object.keys(form.imageMaterials).length > 0 ? form.imageMaterials : null,
      isActive: form.isActive,
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    let payload
    try {
      payload = buildPayload()
    } catch (err) {
      setError(err.message)
      return
    }

    setSubmitting(true)
    try {
      if (isEditing) {
        await updateProduct(id, payload)
      } else {
        const created = await createProduct(payload)
        if (stagedModel) {
          try {
            await uploadProductModel(created.id, stagedModel)
          } catch (uploadErr) {
            // The product exists now; continue on its edit page so the model can be retried.
            navigate(`/products/${created.id}/edit`, { replace: true, state: { modelError: `Product created, but the 3D model upload failed: ${extractError(uploadErr)}` } })
            return
          }
        }
      }
      navigate('/products', { replace: true, state: { successMessage: isEditing ? 'Product updated.' : 'Product created.' } })
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{isEditing ? 'Edit product' : 'New product'}</h1>
        <Link to="/products" className="text-sm text-muted hover:underline">
          ← Back to products
        </Link>
      </div>

      <Banner tone="error">{error}</Banner>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── LEFT COLUMN: Basic Info + Media ── */}
          <div className="flex flex-col gap-5">
            <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider border-b border-line pb-2">Basic Info</h2>

              <label className="block text-sm font-medium text-ink">
                Name
                <input
                  value={form.name}
                  onChange={(e) => {
                    update('name', e.target.value)
                    if (!slugTouched) update('slug', slugify(e.target.value))
                  }}
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Slug
                <input
                  value={form.slug}
                  onChange={(e) => { update('slug', e.target.value); setSlugTouched(true) }}
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-ink">
                  Selling Price (₹)
                  <input type="number" min="0" step="0.01" value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="e.g. 399" />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Original Price (₹) <span className="text-xs text-muted">(strikethrough)</span>
                  <input type="number" min="0" step="0.01" value={form.originalPrice}
                    onChange={(e) => update('originalPrice', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="e.g. 499" />
                </label>
              </div>

              <label className="block text-sm font-medium text-ink">
                Category
                <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>

            <div className="rounded-lg border border-line bg-surface p-6 space-y-5">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider border-b border-line pb-2">Media</h2>
              <ProductImagesSection
                images={form.images}
                onChange={(v) => update('images', v)}
                materials={form.materialOptions.length > 0 ? form.materialOptions.map((m) => m.name) : []}
                colorsByMaterial={form.colorsByMaterial || {}}
                onColorsByMaterialChange={(v) => update('colorsByMaterial', v)}
                imageMaterials={form.imageMaterials}
                onImageMaterialsChange={(v) => update('imageMaterials', v)}
                productId={isEditing ? id : null}
              />
            </div>
          </div>

          {/* ── RIGHT COLUMN: Options + Save ── */}
          <div className="flex flex-col gap-5">
            <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider border-b border-line pb-2">Options</h2>

              <MaterialOptionsEditor value={form.materialOptions} onChange={(v) => update('materialOptions', v)}
                onDirectSave={isEditing ? (v) => updateProduct(id, { materialOptions: v }).catch(() => {}) : undefined} />
              <SizeOptionsEditor value={form.sizeOptions} onChange={(v) => update('sizeOptions', v)}
                onDirectSave={isEditing ? (v) => updateProduct(id, { sizeOptions: v }).catch(() => {}) : undefined} />
              <ShippingMethodsEditor value={form.shippingMethods} onChange={(v) => update('shippingMethods', v)}
                onDirectSave={isEditing ? (v) => updateProduct(id, { shippingMethods: v }).catch(() => {}) : undefined} />

              {form.shippingMethods.length === 0 && (
                <div className="rounded-lg border border-line bg-surface/40 p-4 space-y-3">
                  <div className="border-b border-line pb-2">
                    <h3 className="text-sm font-semibold text-ink">Fallback Shipping</h3>
                    <p className="text-xs text-muted">Used when no shipping methods above are configured.</p>
                  </div>
                  <div className="flex gap-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="shippingType" value="FREE" checked={form.shippingType === 'FREE'}
                        onChange={() => { update('shippingType', 'FREE'); update('shippingPrice', '0') }}
                        className="h-4 w-4" />
                      <span className="text-sm text-ink">Free (₹0)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="shippingType" value="PAID" checked={form.shippingType === 'PAID'}
                        onChange={() => update('shippingType', 'PAID')} className="h-4 w-4" />
                      <span className="text-sm text-ink">Paid</span>
                    </label>
                  </div>
                  {form.shippingType === 'PAID' && (
                    <label className="block text-sm font-medium text-ink">
                      Charge (₹)
                      <input type="number" min="0" step="0.01" value={form.shippingPrice}
                        onChange={(e) => update('shippingPrice', e.target.value)}
                        className="mt-1 block w-32 rounded-md border border-line px-3 py-2 text-sm" placeholder="50" />
                    </label>
                  )}
                  {form.shippingType === 'FREE' && <p className="text-xs text-[#17683f] font-medium">✓ Free Shipping enabled.</p>}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-line bg-surface p-6 space-y-5">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider border-b border-line pb-2">3D Model</h2>
              <ModelUploadSection
                productId={isEditing ? id : null}
                model={model} onModelChange={setModel}
                stagedFile={stagedModel} onStage={setStagedModel}
              />
            </div>

            <div className="rounded-lg border border-line bg-surface p-6 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
                Active (visible to customers)
              </label>
              <button type="submit" disabled={submitting}
                className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
