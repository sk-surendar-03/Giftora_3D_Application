import { HttpError } from '../../utils/httpError.js'
import { isNonEmptyString } from '../../utils/validation.js'
import { createOrder, listOrders, getOrder } from './orderService.js'

export async function create(req, res) {
  const { addressId, idempotencyKey } = req.body ?? {}
  if (!isNonEmptyString(addressId, 50)) throw new HttpError(400, 'addressId is required.')
  if (idempotencyKey !== undefined && !isNonEmptyString(idempotencyKey, 100)) {
    throw new HttpError(400, 'idempotencyKey must be a non-empty string.')
  }

  const order = await createOrder(req.user.id, { addressId, idempotencyKey })
  res.status(201).json({ order })
}

export async function list(req, res) {
  res.json({ orders: await listOrders(req.user.id) })
}

export async function getById(req, res) {
  const order = await getOrder(req.user.id, req.params.id)
  res.json({ order })
}
