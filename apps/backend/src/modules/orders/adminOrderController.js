import { OrderStatus, OrderItemType } from '@prisma/client'
import { HttpError } from '../../utils/httpError.js'
import { listOrdersForAdmin, getOrderForAdmin, updateOrderStatus } from './orderService.js'
import { getPreviewForOrderItem, getStlForOrderItem, getThreeMfForOrderItem } from '../customizer/designService.js'

const VALID_STATUSES = Object.values(OrderStatus)
const VALID_TYPES = Object.values(OrderItemType)

export async function list(req, res) {
  let normalizedType = req.query.type
  if (!normalizedType || normalizedType === 'ALL') {
    normalizedType = undefined
  } else if (normalizedType === 'CUSTOM') {
    normalizedType = OrderItemType.CUSTOM_DESIGN
  } else if (normalizedType === 'CATALOG') {
    normalizedType = OrderItemType.PRODUCT
  }

  let normalizedStatus = req.query.status
  if (!normalizedStatus || normalizedStatus === 'ALL') {
    normalizedStatus = undefined
  }

  if (normalizedStatus !== undefined && !VALID_STATUSES.includes(normalizedStatus)) {
    throw new HttpError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`)
  }
  if (normalizedType !== undefined && !VALID_TYPES.includes(normalizedType)) {
    throw new HttpError(400, `type must be one of: ${VALID_TYPES.join(', ')}`)
  }
  const result = await listOrdersForAdmin({
    page: req.query.page,
    pageSize: req.query.pageSize,
    search: req.query.search,
    status: normalizedStatus,
    type: normalizedType,
  })
  res.json({ orders: result.orders, meta: result.meta })
}

export async function getById(req, res) {
  const order = await getOrderForAdmin(req.params.id)
  res.json({ order })
}

export async function updateStatus(req, res) {
  const { status, shippingCarrier, trackingNumber, trackingUrl } = req.body ?? {}
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`)
  }
  const order = await updateOrderStatus(req.params.id, {
    status,
    shippingCarrier,
    trackingNumber,
    trackingUrl,
  })
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

export async function downloadItem3mf(req, res) {
  const { buffer, filename } = await getThreeMfForOrderItem(req.params.orderId, req.params.itemId)
  res
    .set({
      'Content-Type': 'model/3mf',
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
