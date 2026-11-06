import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { slugify } from '../../utils/slugify.js'
import { fetchCategories } from '../../features/categories/categoriesApi.js'
import { fetchAdminProducts, createProduct, updateProduct } from '../../features/products/productsApi.js'
import ColorPaletteEditor from './ColorPaletteEditor.jsx'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  price: '', // selling price in rupees
  originalPrice: '', // original / strikethrough price in rupees (optional)
  categoryId: '',
  materials: '', // comma-separated
  sizes: '', // comma-separated
  images: '', // comma-separated URLs
  colorsByMaterial: {}, // object: { [material]: [{ label, hex }] }
  isActive: true,
}

export default function ProductForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(isEditing)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [error, setError] = useState(null)
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
          setForm({
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: String(product.priceCents / 100),
            originalPrice: product.originalPriceCents ? String(product.originalPriceCents / 100) : '',
            categoryId: product.categoryId ?? '',
            materials: (product.materials ?? []).join(', '),
            sizes: (product.sizes ?? []).join(', '),
            images: (product.images ?? []).join(', '),
            colorsByMaterial: product.colorsByMaterial && typeof product.colorsByMaterial === 'object' ? product.colorsByMaterial : {},
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
    return value
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

    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      priceCents: Math.round(priceNumber * 100),
      originalPriceCents,
      categoryId: form.categoryId || null,
      materials: parseListField(form.materials),
      sizes: parseListField(form.sizes),
      images: parseListField(form.images),
      ...(colorsByMaterial !== null ? { colorsByMaterial } : { colorsByMaterial: null }),
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
        await createProduct(payload)
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

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-lg border border-line bg-surface p-6">
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
            onChange={(e) => {
              update('slug', e.target.value)
              setSlugTouched(true)
            }}
            className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm font-medium text-ink">
          Description
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Selling Price (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
              placeholder="e.g. 399"
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            Original Price (₹) <span className="text-xs text-muted">(Optional strikethrough)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.originalPrice}
              onChange={(e) => update('originalPrice', e.target.value)}
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
              placeholder="e.g. 499"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-ink">
          Category
          <select
            value={form.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
            className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-ink">
          Materials (comma-separated)
          <input
            value={form.materials}
            onChange={(e) => update('materials', e.target.value)}
            placeholder="Standard PLA, Silk Metallic PLA"
            className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm font-medium text-ink">
          Sizes (comma-separated)
          <input
            value={form.sizes}
            onChange={(e) => update('sizes', e.target.value)}
            placeholder="Small (4 cm), Medium (5.5 cm)"
            className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm font-medium text-ink">
          Images (comma-separated URLs)
          <input
            value={form.images}
            onChange={(e) => update('images', e.target.value)}
            placeholder="https://.../front.png, https://.../back.png"
            className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <div className="block text-sm font-medium text-ink">
          <span className="block mb-1.5 font-medium">Colors by Material</span>
          <ColorPaletteEditor
            materials={parseListField(form.materials)}
            value={form.colorsByMaterial || {}}
            onChange={(nextPalette) => update('colorsByMaterial', nextPalette)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
          Active (visible to customers)
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}
        </button>
      </form>
    </div>
  )
}
