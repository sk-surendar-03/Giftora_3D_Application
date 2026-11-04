import { HttpError } from '../../utils/httpError.js'
import { listCustomers, getCustomer, setCustomerActive } from './customerService.js'

export async function list(req, res) {
  const result = await listCustomers({ page: req.query.page, pageSize: req.query.pageSize, search: req.query.search })
  res.json({ customers: result.customers, meta: result.meta })
}

export async function getById(req, res) {
  const customer = await getCustomer(req.params.id)
  res.json({ customer })
}

export async function updateStatus(req, res) {
  const { isActive } = req.body ?? {}
  if (typeof isActive !== 'boolean') throw new HttpError(400, 'isActive must be a boolean.')

  const customer = await setCustomerActive(req.params.id, isActive)
  res.json({ customer })
}
