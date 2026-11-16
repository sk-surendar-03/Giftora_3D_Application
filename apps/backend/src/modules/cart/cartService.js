import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getPricingConfig, getCustomizerSizes, getCustomizerThicknesses, getCustomizerShipping, getStandPricingConfig } from '../settings/settingsService.js'
import { calculateTotalCustomizationPriceCents } from '../settings/pricingCalculator.js'
import { priceForDesign, stlIsAvailable } from '../customizer/designService.js'
import { priceForStand } from '../standDesigner/standDesignOptions.js'

const CART_INCLUDE = { items: { include: { product: true, customDesign: true, standDesign: true }, orderBy: { createdAt: 'asc' } } }

const MAX_CUSTOM_QUANTITY = 10

export async function getOrCreateCart(userId) {
  const existing = await prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE })
  if (existing) return existing
  return prisma.cart.create({ data: { userId }, include: CART_INCLUDE })
}

function sameCustomization(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/**
 * Resolve a client-supplied shipping method against the server's configured
 * list. The price ALWAYS comes from the server — any price sent by the client
 * is ignored. Returns null if no method was requested, the server's method
 * object otherwise. Throws 400 on an unknown name.
 */
async function resolveShippingMethod(clientMethod) {
  if (!clientMethod || typeof clientMethod.name !== 'string' || !clientMethod.name.trim()) return null
  const { methods } = await getCustomizerShipping()
  const serverMethod = methods.find((m) => m.name === clientMethod.name)
  if (!serverMethod) throw new HttpError(400, `Unknown shipping method: ${clientMethod.name}`)
  return serverMethod
}

export async function addItem(userId, { productId, quantity, customization }) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) {
    throw new HttpError(404, 'Product not found or unavailable.')
  }

  const cart = await getOrCreateCart(userId)
  const existingItem = cart.items.find((item) => item.itemType === 'PRODUCT' && item.productId === productId && sameCustomization(item.customization, customization))

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
      include: { product: true, customDesign: true, standDesign: true },
    })
  }

  let unitPriceCents
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

  // Resolve shipping method against server config — never trust client price.
  const resolvedShipping = await resolveShippingMethod(customization?.shippingMethod)
  const safeCustomization = customization ? { ...customization } : {}
  if (resolvedShipping) safeCustomization.shippingMethod = resolvedShipping

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      itemType: 'PRODUCT',
      productId,
      quantity,
      customization: Object.keys(safeCustomization).length > 0 ? safeCustomization : undefined,
      unitPriceCents,
    },
    include: { product: true, customDesign: true, standDesign: true },
  })
}

export async function addCustomItem(userId, { customDesignId, quantity, shippingMethod }) {
  const design = await prisma.customDesign.findUnique({ where: { id: customDesignId } })
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
      include: { product: true, customDesign: true, standDesign: true },
    })
  }

  const [{ perCharacterPriceCents, baseCharacters, basePriceCents }, { sizes: adminSizes }, { thicknesses: adminThicknesses }] =
    await Promise.all([getPricingConfig(), getCustomizerSizes(), getCustomizerThicknesses()])

  const charPrice = priceForDesign(design.params, perCharacterPriceCents, baseCharacters, basePriceCents)
  const sizePriceCents = adminSizes.find((s) => s.name === design.params.size)?.priceCents ?? 0
  const thicknessPriceCents = adminThicknesses.find((t) => t.name === design.params.thickness)?.priceCents ?? 0
  const unitPriceCents = charPrice + sizePriceCents + thicknessPriceCents

  const customizationData = {
    ...(sizePriceCents > 0 ? { sizePriceCents } : {}),
    ...(thicknessPriceCents > 0 ? { thicknessPriceCents } : {}),
  }
  const resolvedShipping = await resolveShippingMethod(shippingMethod)
  if (resolvedShipping) customizationData.shippingMethod = resolvedShipping

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      itemType: 'CUSTOM_DESIGN',
      customDesignId: design.id,
      quantity,
      unitPriceCents,
      ...(Object.keys(customizationData).length > 0 ? { customization: customizationData } : {}),
    },
    include: { product: true, customDesign: true, standDesign: true },
  })
}

export async function addStandItem(userId, { standDesignId, quantity, shippingMethod }) {
  const design = await prisma.standDesign.findUnique({ where: { id: standDesignId } })
  if (!design || design.userId !== userId) throw new HttpError(404, 'Stand design not found.')
  if (design.status !== 'READY') throw new HttpError(409, 'This stand design is not ready yet.')

  const cart = await getOrCreateCart(userId)
  const existingItem = cart.items.find((item) => item.standDesignId === design.id)
  if (existingItem) {
    if (existingItem.quantity + quantity > MAX_CUSTOM_QUANTITY) {
      throw new HttpError(400, `You can order at most ${MAX_CUSTOM_QUANTITY} of the same stand design.`)
    }
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
      include: { product: true, customDesign: true, standDesign: true },
    })
  }

  const customizationData = {}
  const resolvedShipping = await resolveShippingMethod(shippingMethod)
  if (resolvedShipping) customizationData.shippingMethod = resolvedShipping

  // Recompute price server-side from stored volume + current admin config.
  // Never trust design.unitPriceCents (it may be stale).
  const standConfig = await getStandPricingConfig()
  const unitPriceCents = priceForStand(design.category, design.solidVolumeCm3 ?? 0, standConfig)

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      itemType: 'STAND_DESIGN',
      standDesignId: design.id,
      quantity,
      unitPriceCents,
      ...(Object.keys(customizationData).length > 0 ? { customization: customizationData } : {}),
    },
    include: { product: true, customDesign: true, standDesign: true },
  })
}

async function findOwnedItem(userId, itemId) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } })
  if (!item || item.cart.userId !== userId) {
    throw new HttpError(404, 'Cart item not found.')
  }
  return item
}

export async function updateItemQuantity(userId, itemId, quantity) {
  await findOwnedItem(userId, itemId)
  return prisma.cartItem.update({ where: { id: itemId }, data: { quantity }, include: { product: true, customDesign: true, standDesign: true } })
}

export async function removeItem(userId, itemId) {
  await findOwnedItem(userId, itemId)
  await prisma.cartItem.delete({ where: { id: itemId } })
}