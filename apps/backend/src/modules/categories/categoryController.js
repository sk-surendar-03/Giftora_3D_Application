import { HttpError } from '../../utils/httpError.js'
import { isValidSlug, isNonEmptyString } from '../../utils/validation.js'
import { listCategories, createCategory, updateCategory, deleteCategory } from './categoryService.js'

export async function list(req, res) {
  res.json({ categories: await listCategories() })
}

export async function create(req, res) {
  const { slug, name } = req.body ?? {}
  if (!isValidSlug(slug)) throw new HttpError(400, 'A valid slug (lowercase letters, numbers, hyphens) is required.')
  if (!isNonEmptyString(name, 100)) throw new HttpError(400, 'Name is required.')

  const category = await createCategory({ slug, name: name.trim() })
  res.status(201).json({ category })
}

export async function update(req, res) {
  const { slug, name } = req.body ?? {}
  if (slug !== undefined && !isValidSlug(slug)) throw new HttpError(400, 'A valid slug (lowercase letters, numbers, hyphens) is required.')
  if (name !== undefined && !isNonEmptyString(name, 100)) throw new HttpError(400, 'Name must be a non-empty string.')

  const category = await updateCategory(req.params.id, { slug, name: name?.trim() })
  res.json({ category })
}

export async function remove(req, res) {
  await deleteCategory(req.params.id)
  res.status(204).end()
}
