import api from '../../services/api'

export async function fetchAddresses(signal) {
  const { data } = await api.get('/addresses', { signal })
  return data.addresses
}

export async function createAddress(payload) {
  const { data } = await api.post('/addresses', payload)
  return data.address
}

export async function updateAddress(id, payload) {
  const { data } = await api.patch(`/addresses/${id}`, payload)
  return data.address
}

export async function deleteAddress(id) {
  await api.delete(`/addresses/${id}`)
}
