import api from '../../services/api'

export async function fetchCategories() {
  const { data } = await api.get('/categories')
  return data.categories
}

export async function createCategory(payload) {
  const { data } = await api.post('/categories', payload)
  return data.category
}

export async function updateCategory(id, payload) {
  const { data } = await api.patch(`/categories/${id}`, payload)
  return data.category
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`)
}
