import { OrderStatus } from '@prisma/client'
import { HttpError } from '../../utils/httpError.js'
import { listOrdersForAdmin, getOrderForAdmin, updateOrderStatus } from './orderService.js'

const VALID_STATUSES = Object.values(OrderStatus)

export async function list(req, res) {
  const { status } = req.query
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`)
  }
  const result = await listOrdersForAdmin({ page: req.query.page, pageSize: req.query.pageSize, search: req.query.search, status })
  res.json({ orders: result.orders, meta: result.meta })
}

export async function getById(req, res) {
  const order = await getOrderForAdmin(req.params.id)
  res.json({ order })
}

export async function updateStatus(req, res) {
  const { status } = req.body ?? {}
  if (!VALID_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`)
  }
  const order = await updateOrderStatus(req.params.id, status)
  res.json({ order })
}
