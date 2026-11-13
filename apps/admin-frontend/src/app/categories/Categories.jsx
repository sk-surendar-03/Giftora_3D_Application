import { useEffect, useState } from 'react'
import Banner from '../../components/Banner.jsx'
import Pagination from '../../components/Pagination.jsx'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../features/categories/categoriesApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')

  function load() {
    setIsLoading(true)
    setLoadError(null)
    fetchCategories()
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.categories ?? []
        setCategories(list)
      })
      .catch((err) => setLoadError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim() || !newSlug.trim()) {
      setFormError('Name and slug are required.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)
    try {
      await createCategory({ name: newName.trim(), slug: newSlug.trim() })
      setNewName('')
      setNewSlug('')
      setSlugTouched(false)
      setSuccessMessage('Category created.')
      load()
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(category) {
    setEditingId(category.id)
    setEditName(category.name)
    setEditSlug(category.slug)
    setFormError(null)
    setSuccessMessage(null)
  }

  async function handleUpdate(id) {
    if (!editName.trim() || !editSlug.trim()) {
      setFormError('Name and slug are required.')
      return
    }
    setSubmitting(true)
    try {
      await updateCategory(id, { name: editName.trim(), slug: editSlug.trim() })
      setEditingId(null)
      setSuccessMessage('Category updated.')
      load()
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category? This cannot be undone.')) return
    setFormError(null)
    setSuccessMessage(null)
    try {
      await deleteCategory(id)
      setSuccessMessage('Category deleted.')
      if (paginatedCategories.length === 1 && page > 1) {
        setPage((p) => p - 1)
      }
      load()
    } catch (err) {
      setFormError(extractError(err))
    }
  }

  const total = (categories || []).length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginatedCategories = (categories || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Categories</h1>
          <p className="mt-1 text-xs text-muted">Organize catalog designs into customer-navigable categories.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          Category Name
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
              if (!slugTouched) setNewSlug(slugify(e.target.value))
            }}
            className="mt-1 block h-9 w-48 rounded-control border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
            placeholder="e.g. Keychains"
          />
        </label>
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">
          URL Slug
          <input
            value={newSlug}
            onChange={(e) => {
              setNewSlug(e.target.value)
              setSlugTouched(true)
            }}
            className="mt-1 block h-9 w-48 rounded-control border border-line bg-surface px-3 text-sm font-mono text-ink outline-none focus:border-accent"
            placeholder="e.g. keychains"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="h-9 rounded-control bg-accent px-4 text-xs font-bold text-on-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {submitting ? 'Adding…' : 'Add category'}
        </button>
      </form>

      <div className="mt-4">
        <Banner tone="error">{formError ?? loadError}</Banner>
        <Banner tone="success">{successMessage}</Banner>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading categories…</p>
      ) : !categories || categories.length === 0 ? (
        <div className="mt-6 rounded-lg border border-line bg-surface p-12 text-center text-sm text-muted">
          No categories yet. Add one above.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-line">
        <table className="w-full bg-surface text-sm">
          <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCategories.map((category) => (
              <tr key={category.id} className="border-t border-line hover:bg-alt/30 transition-colors">
                {editingId === category.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-full rounded-control border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="h-8 w-full rounded-control border border-line bg-surface px-2 text-sm font-mono text-ink outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleUpdate(category.id)}
                        disabled={submitting}
                        className="mr-2 text-accent hover:underline font-medium text-xs cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-muted hover:underline text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-ink font-medium">{category.name}</td>
                    <td className="px-4 py-2 text-muted font-mono text-xs">{category.slug}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="mr-3 text-accent hover:underline text-xs font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-500 hover:underline text-xs font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {!isLoading && categories.length > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
