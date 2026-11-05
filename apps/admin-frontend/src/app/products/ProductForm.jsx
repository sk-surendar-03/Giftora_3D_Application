import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { slugify } from '../../utils/slugify.js'
import { fetchCategories } from '../../features/categories/categoriesApi.js'
import { fetchAdminProducts, createProduct, updateProduct } from '../../features/products/productsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  price: '', // rupees, as the admin types it — converted to priceCents on submit
  categoryId: '',
  materials: '', // comma-separated
  sizes: '', // comma-separated
  images: '', // comma-separated URLs
  colorsByMaterial: '', // JSON text, e.g. {"Standard PLA":[{"label":"White","hex":"#ffffff"}]}
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
      // Admin products are addressed by slug for GET, by id for PATCH/DELETE
      // — the route param here is the product's id (used for the eventual
      // PATCH), so the list is searched for the matching id first.
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
            categoryId: product.categoryId ?? '',
            materials: (product.materials ?? []).join(', '),
            sizes: (product.sizes ?? []).join(', '),
            images: (product.images ?? []).join(', '),
            colorsByMaterial: product.colorsByMaterial ? JSON.stringify(product.colorsByMaterial, null, 2) : '',
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

    let colorsByMaterial
    if (form.colorsByMaterial.trim()) {
      try {
        colorsByMaterial = JSON.parse(form.colorsByMaterial)
      } catch {
        throw new Error('Colors by material must be valid JSON, e.g. {"Standard PLA":[{"label":"White","hex":"#ffffff"}]}')
      }
    }

    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      priceCents: Math.round(priceNumber * 100),
      categoryId: form.categoryId || null,
      materials: parseListField(form.materials),
      sizes: parseListField(form.sizes),
      images: parseListField(form.images),
      ...(colorsByMaterial !== undefined ? { colorsByMaterial } : {}),
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

        <label className="block text-sm font-medium text-ink">
          Price (₹)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

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

        <label className="block text-sm font-medium text-ink">
          Colors by material (JSON)
          <textarea
            value={form.colorsByMaterial}
            onChange={(e) => update('colorsByMaterial', e.target.value)}
            rows={5}
            placeholder={'{\n  "Standard PLA": [{ "label": "White", "hex": "#ffffff" }]\n}'}
            className="mt-1 block w-full rounded-md border border-line px-3 py-2 font-mono text-xs"
          />
          <span className="mt-1 block text-xs text-muted">Optional. Must be valid JSON mapping each material to a list of {'{label, hex}'} colors.</span>
        </label>

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
