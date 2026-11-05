import { HttpError } from '../../utils/httpError.js'
import { isValidSlug, isNonEmptyString, isPositiveInt, isStringArray } from '../../utils/validation.js'
import { listProducts, getProductBySlug, createProduct, updateProduct, deleteProduct } from './productService.js'

function isAdmin(req) {
  return req.user?.role === 'ADMIN'
}

export async function list(req, res) {
  const result = await listProducts(req.query, isAdmin(req))
  res.json({ products: result.items, meta: result.meta })
}

export async function getBySlug(req, res) {
  const product = await getProductBySlug(req.params.slug, isAdmin(req))
  res.json({ product })
}

function validateProductInput(body, { partial }) {
  const { slug, name, description, priceCents, images, materials, sizes, colorsByMaterial, categoryId, isActive } = body ?? {}

  if (!partial || slug !== undefined) {
    if (!isValidSlug(slug)) throw new HttpError(400, 'A valid slug (lowercase letters, numbers, hyphens) is required.')
  }
  if (!partial || name !== undefined) {
    if (!isNonEmptyString(name, 150)) throw new HttpError(400, 'Name is required.')
  }
  if (!partial || description !== undefined) {
    if (!isNonEmptyString(description, 2000)) throw new HttpError(400, 'Description is required.')
  }
  if (!partial || priceCents !== undefined) {
    if (!isPositiveInt(priceCents)) throw new HttpError(400, 'priceCents must be a positive integer (price in the smallest currency unit).')
  }
  if (images !== undefined && !isStringArray(images, 20, 2000)) throw new HttpError(400, 'images must be an array of strings.')
  if (materials !== undefined && !isStringArray(materials, 20)) throw new HttpError(400, 'materials must be an array of strings.')
  if (sizes !== undefined && !isStringArray(sizes, 20)) throw new HttpError(400, 'sizes must be an array of strings.')
  if (colorsByMaterial !== undefined && colorsByMaterial !== null && typeof colorsByMaterial !== 'object') {
    throw new HttpError(400, 'colorsByMaterial must be an object.')
  }
  if (categoryId !== undefined && categoryId !== null && !isNonEmptyString(categoryId, 50)) {
    throw new HttpError(400, 'categoryId must be a string id.')
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw new HttpError(400, 'isActive must be a boolean.')
  }

  return {
    ...(slug !== undefined ? { slug } : {}),
    ...(name !== undefined ? { name: name.trim() } : {}),
    ...(description !== undefined ? { description: description.trim() } : {}),
    ...(priceCents !== undefined ? { priceCents } : {}),
    ...(images !== undefined ? { images } : {}),
    ...(materials !== undefined ? { materials } : {}),
    ...(sizes !== undefined ? { sizes } : {}),
    ...(colorsByMaterial !== undefined ? { colorsByMaterial } : {}),
    ...(categoryId !== undefined ? { categoryId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  }
}

export async function create(req, res) {
  const data = validateProductInput(req.body, { partial: false })
  const product = await createProduct(data)
  res.status(201).json({ product })
}

export async function update(req, res) {
  const data = validateProductInput(req.body, { partial: true })
  const product = await updateProduct(req.params.id, data)
  res.json({ product })
}

export async function remove(req, res) {
  await deleteProduct(req.params.id)
  res.status(204).end()
}
