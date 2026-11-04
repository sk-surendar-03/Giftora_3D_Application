import { useEffect, useState } from 'react'
import Banner from '../../components/Banner.jsx'
import { slugify } from '../../utils/slugify.js'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../features/categories/categoriesApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
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
      .then(setCategories)
      .catch((err) => setLoadError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    if (!newName.trim() || !newSlug.trim()) {
      setFormError('Name and slug are required.')
      return
    }
    setSubmitting(true)
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
      load()
    } catch (err) {
      setFormError(extractError(err))
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Categories</h1>

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <label className="text-sm font-medium text-gray-700">
          Name
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
              if (!slugTouched) setNewSlug(slugify(e.target.value))
            }}
            className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Keychains"
          />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Slug
          <input
            value={newSlug}
            onChange={(e) => {
              setNewSlug(e.target.value)
              setSlugTouched(true)
            }}
            className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="keychains"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add category
        </button>
      </form>

      <div className="mt-4">
        <Banner tone="error">{formError ?? loadError}</Banner>
        <Banner tone="success">{successMessage}</Banner>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-gray-500">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No categories yet. Add one above.</p>
      ) : (
        <table className="mt-6 w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-gray-100">
                {editingId === category.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" />
                    </td>
                    <td className="px-4 py-2">
                      <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="w-full rounded-md border border-gray-300 px-2 py-1" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => handleUpdate(category.id)} disabled={submitting} className="mr-2 text-gray-900 hover:underline">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-gray-900">{category.name}</td>
                    <td className="px-4 py-2 text-gray-500">{category.slug}</td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => startEdit(category)} className="mr-3 text-gray-900 hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(category.id)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
