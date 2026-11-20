import { OrderStatus, OrderItemType } from '@prisma/client'
import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { listOrdersForAdmin, getOrderForAdmin, updateOrderStatus } from './orderService.js'
import { getPreviewForOrderItem, getStlForOrderItem, getThreeMfForOrderItem } from '../customizer/designService.js'
import { getStlForStandOrderItem, getPreviewForStandOrderItem, getThreeMfForStandOrderItem } from '../standDesigner/standDesignService.js'
import { getStlForNameplateOrderItem, getPreviewForNameplateOrderItem, getThreeMfForNameplateOrderItem } from '../nameplateDesigner/nameplateDesignService.js'

const VALID_STATUSES = Object.values(OrderStatus)
const VALID_TYPES = Object.values(OrderItemType)

function parseRangePreset(preset) {
  if (!preset) return {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (preset === 'today') return { from: today, to: tomorrow }
  if (preset === '7d') return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), to: tomorrow }
  if (preset === '30d') return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29), to: tomorrow }
  return {}
}

export async function list(req, res) {
  let normalizedType = req.query.type
  if (!normalizedType || normalizedType === 'ALL') {
    normalizedType = undefined
  } else if (normalizedType === 'CUSTOM') {
    normalizedType = OrderItemType.CUSTOM_DESIGN
  } else if (normalizedType === 'CATALOG') {
    normalizedType = OrderItemType.PRODUCT
  } else if (normalizedType === 'STAND') {
    normalizedType = 'STAND_DESIGN'
  } else if (normalizedType === 'NAMEPLATE') {
    normalizedType = 'NAMEPLATE_DESIGN'
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

  const { from, to } = parseRangePreset(req.query.range)

  const result = await listOrdersForAdmin({
    page: req.query.page,
    pageSize: req.query.pageSize,
    search: req.query.search,
    status: normalizedStatus,
    type: normalizedType,
    from,
    to,
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
  const item = await prisma.orderItem.findFirst({
    where: { id: req.params.itemId, orderId: req.params.orderId },
    select: { itemType: true },
  })
  if (!item) throw new HttpError(404, 'Order item not found.')

  let result
  if (item.itemType === 'STAND_DESIGN') {
    result = await getStlForStandOrderItem(req.params.orderId, req.params.itemId)
  } else if (item.itemType === 'NAMEPLATE_DESIGN') {
    result = await getStlForNameplateOrderItem(req.params.orderId, req.params.itemId)
  } else if (item.itemType === 'CUSTOM_DESIGN') {
    result = await getStlForOrderItem(req.params.orderId, req.params.itemId)
  } else {
    throw new HttpError(400, 'This item type does not have a downloadable custom STL.')
  }

  const { buffer, filename } = result
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
  const item = await prisma.orderItem.findFirst({
    where: { id: req.params.itemId, orderId: req.params.orderId },
    select: { itemType: true },
  })
  if (!item) throw new HttpError(404, 'Order item not found.')

  let result
  if (item.itemType === 'STAND_DESIGN') {
    result = await getThreeMfForStandOrderItem(req.params.orderId, req.params.itemId)
  } else if (item.itemType === 'NAMEPLATE_DESIGN') {
    result = await getThreeMfForNameplateOrderItem(req.params.orderId, req.params.itemId)
  } else if (item.itemType === 'CUSTOM_DESIGN') {
    result = await getThreeMfForOrderItem(req.params.orderId, req.params.itemId)
  } else {
    throw new HttpError(400, '3MF export is not available for this item type.')
  }

  const { buffer, filename } = result
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
  const item = await prisma.orderItem.findFirst({
    where: { id: req.params.itemId, orderId: req.params.orderId },
    select: { itemType: true },
  })
  if (!item) throw new HttpError(404, 'Order item not found.')

  let buffer
  if (item.itemType === 'STAND_DESIGN') {
    buffer = await getPreviewForStandOrderItem(req.params.orderId, req.params.itemId)
  } else if (item.itemType === 'NAMEPLATE_DESIGN') {
    buffer = await getPreviewForNameplateOrderItem(req.params.orderId, req.params.itemId)
  } else if (item.itemType === 'CUSTOM_DESIGN') {
    buffer = await getPreviewForOrderItem(req.params.orderId, req.params.itemId)
  } else {
    throw new HttpError(400, 'This item type does not have a 3D preview.')
  }
  res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' }).send(buffer)
}
