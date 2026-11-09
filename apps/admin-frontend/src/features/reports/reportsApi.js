import api from '../../services/api'

export async function fetchDashboard(params) {
  const { data } = await api.get('/admin/reports/dashboard', { params })
  return data
}

export async function fetchSalesReport(params) {
  const { data } = await api.get('/admin/reports/sales', { params })
  return data
}

export async function fetchOrderReport(params) {
  const { data } = await api.get('/admin/reports/orders', { params })
  return data
}

export async function fetchProductReport(params) {
  const { data } = await api.get('/admin/reports/products', { params })
  return data
}

export async function fetchCustomerReport(params) {
  const { data } = await api.get('/admin/reports/customers', { params })
  return data
}
