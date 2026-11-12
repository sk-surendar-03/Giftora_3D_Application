import { HttpError } from '../../utils/httpError.js'
import { isNonEmptyString, isPositiveInt } from '../../utils/validation.js'
import { getOrCreateCart, addItem, addCustomItem, updateItemQuantity, removeItem } from './cartService.js'
import { toPublicDesign } from '../customizer/designService.js'

const MAX_QUANTITY = 10

function toCartResponse(cart) {
  const items = cart.items.map((item) => ({
    id: item.id,
    itemType: item.itemType,
    productId: item.productId,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    customization: item.customization,
    lineTotalCents: item.unitPriceCents * item.quantity,
    // Catalog lines carry their product; standalone custom designs have none
    // and carry `design` instead.
    product: item.product
      ? {
          id: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          images: item.product.images,
          isActive: item.product.isActive,
          shippingCents: item.product.shippingCents ?? 0,
          shippingMethods: item.product.shippingMethods ?? null,
          materialOptions: item.product.materialOptions ?? null,
          sizeOptions: item.product.sizeOptions ?? null,
        }
      : null,
    design: item.customDesign ? toPublicDesign(item.customDesign) : null,
  }))
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0)
  return { id: cart.id, items, subtotalCents, totalCents: subtotalCents }
}

function validateCustomization(customization) {
  if (customization === undefined || customization === null) return undefined
  if (typeof customization !== 'object' || Array.isArray(customization)) {
    throw new HttpError(400, 'customization must be an object.')
  }
  if (JSON.stringify(customization).length > 5000) {
    throw new HttpError(400, 'customization payload is too large.')
  }
  return customization
}

export async function getCart(req, res) {
  const cart = await getOrCreateCart(req.user.id)
  res.json({ cart: toCartResponse(cart) })
}

export async function addCartItem(req, res) {
  const { productId, quantity, customization } = req.body ?? {}

  if (!isNonEmptyString(productId, 50)) throw new HttpError(400, 'productId is required.')
  const qty = quantity ?? 1
  if (!isPositiveInt(qty) || qty > MAX_QUANTITY) throw new HttpError(400, `quantity must be a whole number from 1 to ${MAX_QUANTITY}.`)
  const validCustomization = validateCustomization(customization)

  await addItem(req.user.id, { productId, quantity: qty, customization: validCustomization })
  const cart = await getOrCreateCart(req.user.id)
  res.status(201).json({ cart: toCartResponse(cart) })
}

export async function addCustomCartItem(req, res) {
  const { customDesignId, quantity } = req.body ?? {}

  if (!isNonEmptyString(customDesignId, 50)) throw new HttpError(400, 'customDesignId is required.')
  const qty = quantity ?? 1
  if (!isPositiveInt(qty) || qty > MAX_QUANTITY) throw new HttpError(400, `quantity must be a whole number from 1 to ${MAX_QUANTITY}.`)

  await addCustomItem(req.user.id, { customDesignId, quantity: qty })
  const cart = await getOrCreateCart(req.user.id)
  res.status(201).json({ cart: toCartResponse(cart) })
}

export async function updateCartItem(req, res) {
  const { quantity } = req.body ?? {}
  if (!isPositiveInt(quantity) || quantity > MAX_QUANTITY) throw new HttpError(400, `quantity must be a whole number from 1 to ${MAX_QUANTITY}.`)

  await updateItemQuantity(req.user.id, req.params.itemId, quantity)
  const cart = await getOrCreateCart(req.user.id)
  res.json({ cart: toCartResponse(cart) })
}

export async function deleteCartItem(req, res) {
  await removeItem(req.user.id, req.params.itemId)
  const cart = await getOrCreateCart(req.user.id)
  res.json({ cart: toCartResponse(cart) })
}
