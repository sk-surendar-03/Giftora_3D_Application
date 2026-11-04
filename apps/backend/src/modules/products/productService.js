import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { parsePagination, buildMeta } from '../../utils/pagination.js'

const SORT_FIELDS = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  'price-asc': { priceCents: 'asc' },
  'price-desc': { priceCents: 'desc' },
  name: { name: 'asc' },
}

/**
 * @param {object} query - raw req.query
 * @param {boolean} includeInactive - true for admin listing, false for the
 *   public/customer catalog (which must never see unpublished products).
 */
export async function listProducts(query, includeInactive) {
  const pagination = parsePagination(query)
  const where = {
    ...(includeInactive ? {} : { isActive: true }),
    ...(query.category ? { category: { slug: query.category } } : {}),
    // `materials` is a JSON array column (MySQL has no native array type —
    // see Phase 17's migration) — `array_contains` is the JSON-column
    // equivalent of the old scalar-list `has` filter.
    ...(query.material ? { materials: { array_contains: query.material } } : {}),
    // No `mode: 'insensitive'` (Postgres/CockroachDB-only) — MySQL's
    // default collation is already case-insensitive, so a plain `contains`
    // behaves the same way here.
    ...(query.search
      ? {
          OR: [{ name: { contains: query.search } }, { description: { contains: query.search } }],
        }
      : {}),
    ...(query.minPrice || query.maxPrice
      ? {
          priceCents: {
            ...(query.minPrice ? { gte: Number.parseInt(query.minPrice, 10) } : {}),
            ...(query.maxPrice ? { lte: Number.parseInt(query.maxPrice, 10) } : {}),
          },
        }
      : {}),
  }

  const orderBy = SORT_FIELDS[query.sort] ?? SORT_FIELDS.newest

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: pagination.skip, take: pagination.take, include: { category: true } }),
    prisma.product.count({ where }),
  ])

  return { items, meta: buildMeta(pagination, total) }
}

export async function getProductBySlug(slug, includeInactive) {
  const product = await prisma.product.findUnique({ where: { slug }, include: { category: true } })
  if (!product || (!includeInactive && !product.isActive)) {
    throw new HttpError(404, 'Product not found.')
  }
  return product
}

async function assertCategoryExists(categoryId) {
  if (!categoryId) return
  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) throw new HttpError(400, 'categoryId does not reference an existing category.')
}

export async function createProduct(data) {
  await assertCategoryExists(data.categoryId)
  try {
    return await prisma.product.create({ data })
  } catch (err) {
    if (err.code === 'P2002') throw new HttpError(409, 'A product with this slug already exists.')
    throw err
  }
}

export async function updateProduct(id, data) {
  await assertCategoryExists(data.categoryId)
  try {
    return await prisma.product.update({ where: { id }, data })
  } catch (err) {
    if (err.code === 'P2002') throw new HttpError(409, 'A product with this slug already exists.')
    if (err.code === 'P2025') throw new HttpError(404, 'Product not found.')
    throw err
  }
}

export async function deleteProduct(id) {
  try {
    await prisma.product.delete({ where: { id } })
  } catch (err) {
    if (err.code === 'P2025') throw new HttpError(404, 'Product not found.')
    if (err.code === 'P2003') throw new HttpError(409, 'Cannot delete a product that is already referenced by carts or orders.')
    throw err
  }
}
