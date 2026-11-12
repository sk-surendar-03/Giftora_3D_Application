import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getPricingConfig, getCustomizerSizes, getCustomizerThicknesses } from '../settings/settingsService.js'
import { calculateTotalCustomizationPriceCents } from '../settings/pricingCalculator.js'
import { priceForDesign, stlIsAvailable } from '../customizer/designService.js'

const CART_INCLUDE = { items: { include: { product: true, customDesign: true }, orderBy: { createdAt: 'asc' } } }

// Same per-line cap the cart controller enforces on each request.
const MAX_CUSTOM_QUANTITY = 10

export async function getOrCreateCart(userId) {
  const existing = await prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE })
  if (existing) return existing
  return prisma.cart.create({ data: { userId }, include: CART_INCLUDE })
}

function sameCustomization(a, b) {
  // Both are plain JSON values (or null/undefined) — a stable string
  // comparison is enough since the frontend always sends the same key
  // order for a given selection set.
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

export async function addItem(userId, { productId, quantity, customization }) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) {
    throw new HttpError(404, 'Product not found or unavailable.')
  }

  const cart = await getOrCreateCart(userId)
  const existingItem = cart.items.find((item) => item.itemType === 'PRODUCT' && item.productId === productId && sameCustomization(item.customization, customization))

  if (existingItem) {
    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
      include: { product: true, customDesign: true },
    })
    return updated
  }

  // The admin-configured per-character rate is the ONLY price source for
  // customizer products — there is no separate base/product price added on
  // top. Both the main name and the optional subtitle are billed per
  // character at the same rate (subtitle contributes 0 when empty).
  // Recomputed here (never trusting a client-sent price) so the live
  // preview price and the actual cart price always agree, and a later rate
  // change doesn't retroactively alter what's already in a customer's cart
  // (see the price-snapshot note below).
  let unitPriceCents
  // If the product has per-material pricing and a material was selected, use it
  const matOpts = Array.isArray(product.materialOptions) ? product.materialOptions : []
  const sizeOpts = Array.isArray(product.sizeOptions) ? product.sizeOptions : []
  const selMat = matOpts.find((m) => m.name === customization?.material)
  if (selMat) {
    unitPriceCents = selMat.priceCents
    const selSize = sizeOpts.find((s) => s.name === customization?.size)
    if (selSize) unitPriceCents += (selSize.additionalCents || 0)
  } else if (customization?.text) {
    const { perCharacterPriceCents, baseCharacters, basePriceCents } = await getPricingConfig()
    unitPriceCents = calculateTotalCustomizationPriceCents(customization.text, customization?.subtitle, perCharacterPriceCents, baseCharacters, basePriceCents)
  } else {
    unitPriceCents = product.priceCents
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      itemType: 'PRODUCT',
      productId,
      quantity,
      customization: customization ?? undefined,
      unitPriceCents,
    },
    include: { product: true, customDesign: true },
  })
}

/**
 * Adds a standalone custom design (no catalog product) to the cart. The
 * design must belong to this customer and have its STL stored. The price is
 * recomputed here from the design's validated parameters, never taken from
 * the client, and snapshotted on the line like catalog items.
 */
export async function addCustomItem(userId, { customDesignId, quantity, shippingMethod }) {
  const design = await prisma.customDesign.findUnique({ where: { id: customDesignId } })
  // Same 404 whether it doesn't exist or belongs to someone else.
  if (!design || design.userId !== userId) throw new HttpError(404, 'Design not found.')
  if (design.status !== 'READY') throw new HttpError(409, 'This design is not ready yet — its STL file has not been uploaded.')
  if (!(await stlIsAvailable(design))) throw new HttpError(409, 'This design\'s file is missing. Please recreate the design.')

  const cart = await getOrCreateCart(userId)
  const existingItem = cart.items.find((item) => item.customDesignId === design.id)
  if (existingItem) {
    if (existingItem.quantity + quantity > MAX_CUSTOM_QUANTITY) {
      throw new HttpError(400, `You can order at most ${MAX_CUSTOM_QUANTITY} of the same design.`)
    }
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
      include: { product: true, customDesign: true },
    })
  }

  const [{ perCharacterPriceCents, baseCharacters, basePriceCents }, { sizes: adminSizes }, { thicknesses: adminThicknesses }] =
    await Promise.all([getPricingConfig(), getCustomizerSizes(), getCustomizerThicknesses()])

  const charPrice = priceForDesign(design.params, perCharacterPriceCents, baseCharacters, basePriceCents)
  const sizePriceCents = adminSizes.find((s) => s.name === design.params.size)?.priceCents ?? 0
  const thicknessPriceCents = adminThicknesses.find((t) => t.name === design.params.thickness)?.priceCents ?? 0
  const unitPriceCents = charPrice + sizePriceCents + thicknessPriceCents

  const customizationData = {
    ...(shippingMethod && typeof shippingMethod.name === 'string' ? { shippingMethod } : {}),
    ...(sizePriceCents > 0 ? { sizePriceCents } : {}),
    ...(thicknessPriceCents > 0 ? { thicknessPriceCents } : {}),
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      itemType: 'CUSTOM_DESIGN',
      customDesignId: design.id,
      quantity,
      unitPriceCents,
      ...(Object.keys(customizationData).length > 0 ? { customization: customizationData } : {}),
    },
    include: { product: true, customDesign: true },
  })
}

async function findOwnedItem(userId, itemId) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } })
  if (!item || item.cart.userId !== userId) {
    // Same 404 whether the item doesn't exist or belongs to someone else —
    // never reveal that a given cart-item id belongs to another account.
    throw new HttpError(404, 'Cart item not found.')
  }
  return item
}

export async function updateItemQuantity(userId, itemId, quantity) {
  await findOwnedItem(userId, itemId)
  return prisma.cartItem.update({ where: { id: itemId }, data: { quantity }, include: { product: true, customDesign: true } })
}

export async function removeItem(userId, itemId) {
  await findOwnedItem(userId, itemId)
  await prisma.cartItem.delete({ where: { id: itemId } })
}
