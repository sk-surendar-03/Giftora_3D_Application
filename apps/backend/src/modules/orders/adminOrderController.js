import { OrderStatus, OrderItemType } from '@prisma/client'
import { HttpError } from '../../utils/httpError.js'
import { listOrdersForAdmin, getOrderForAdmin, updateOrderStatus } from './orderService.js'
import { getPreviewForOrderItem, getStlForOrderItem } from '../customizer/designService.js'

const VALID_STATUSES = Object.values(OrderStatus)
const VALID_TYPES = Object.values(OrderItemType)

export async function list(req, res) {
  const { status, type } = req.query
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`)
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    throw new HttpError(400, `type must be one of: ${VALID_TYPES.join(', ')}`)
  }
  const result = await listOrdersForAdmin({ page: req.query.page, pageSize: req.query.pageSize, search: req.query.search, status, type })
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

// Looked up by BOTH the order id and the item id, so a file can only be
// downloaded through the order it actually belongs to.
export async function downloadItemStl(req, res) {
  const { buffer, filename } = await getStlForOrderItem(req.params.orderId, req.params.itemId)
  res
    .set({
      'Content-Type': 'model/stl',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    .send(buffer)
}

export async function itemPreview(req, res) {
  const buffer = await getPreviewForOrderItem(req.params.orderId, req.params.itemId)
  res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' }).send(buffer)
}
