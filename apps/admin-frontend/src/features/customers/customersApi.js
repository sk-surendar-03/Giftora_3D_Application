import api from '../../services/api'

export async function fetchCustomers(params = {}) {
  const { data } = await api.get('/admin/customers', { params: { pageSize: 20, ...params } })
  return data // { customers, meta }
}

export async function fetchCustomer(id) {
  const { data } = await api.get(`/admin/customers/${id}`)
  return data.customer
}

export async function setCustomerActive(id, isActive) {
  const { data } = await api.patch(`/admin/customers/${id}/status`, { isActive })
  return data.customer
}
