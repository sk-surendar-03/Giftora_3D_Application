import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}

export async function createCategory({ slug, name }) {
  try {
    return await prisma.category.create({ data: { slug, name } })
  } catch (err) {
    if (err.code === 'P2002') throw new HttpError(409, 'A category with this slug already exists.')
    throw err
  }
}

export async function updateCategory(id, { slug, name }) {
  try {
    return await prisma.category.update({ where: { id }, data: { slug, name } })
  } catch (err) {
    if (err.code === 'P2002') throw new HttpError(409, 'A category with this slug already exists.')
    if (err.code === 'P2025') throw new HttpError(404, 'Category not found.')
    throw err
  }
}

export async function deleteCategory(id) {
  try {
    await prisma.category.delete({ where: { id } })
  } catch (err) {
    if (err.code === 'P2025') throw new HttpError(404, 'Category not found.')
    if (err.code === 'P2003') throw new HttpError(409, 'Cannot delete a category that still has products assigned to it.')
    throw err
  }
}
