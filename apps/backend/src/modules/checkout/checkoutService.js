import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getOrCreateCart } from '../cart/cartService.js'
import { getPricingConfig } from '../settings/settingsService.js'
import { calculateTotalCustomizationPriceCents } from '../settings/pricingCalculator.js'
import { priceForDesign, stlIsAvailable, toPublicDesign } from '../customizer/designService.js'

/**
 * Builds a checkout review purely from the current, authoritative state of
 * the cart/products/address — never from anything the client claims about
 * totals. This performs no writes (no order is created here; that's
 * Phase 9), so it's safe to call both to render the checkout page and
 * again right before a future "place order" action re-validates.
 */
export async function reviewCheckout(userId, addressId) {
  const cart = await getOrCreateCart(userId)

  if (cart.items.length === 0) {
    throw new HttpError(400, 'Your cart is empty.')
  }

  const address = await prisma.address.findUnique({ where: { id: addressId } })
  if (!address || address.userId !== userId) {
    throw new HttpError(404, 'Address not found.')
  }

  const { perCharacterPriceCents, baseCharacters, basePriceCents } = await getPricingConfig()

  let subtotalCents = 0
  const items = []
  for (const item of cart.items) {
    const isCustom = item.itemType === 'CUSTOM_DESIGN'
    const design = item.customDesign
    const product = item.product

    // Catalog lines are available while the product is active; standalone
    // designs while their STL file exists. Customizer lines have no separate
    // base price — the per-character rate (possibly changed by an admin since
    // this item was added) is the only current price source, same as
    // cartService.js.
    const available = isCustom ? await stlIsAvailable(design) : product.isActive
    let currentUnitPriceCents
    if (isCustom) {
      currentUnitPriceCents = priceForDesign(design.params, perCharacterPriceCents)
    } else {
      const matOpts = Array.isArray(product?.materialOptions) ? product.materialOptions : []
      const sizeOpts = Array.isArray(product?.sizeOptions) ? product.sizeOptions : []
      const selMat = matOpts.find((m) => m.name === item.customization?.material)
      if (selMat) {
        currentUnitPriceCents = selMat.priceCents
        const selSize = sizeOpts.find((s) => s.name === item.customization?.size)
        if (selSize) currentUnitPriceCents += (selSize.additionalCents || 0)
      } else if (item.customization?.text) {
        currentUnitPriceCents = calculateTotalCustomizationPriceCents(item.customization.text, item.customization?.subtitle, perCharacterPriceCents, baseCharacters, basePriceCents)
      } else {
        currentUnitPriceCents = product?.priceCents ?? 0
      }
    }
    const priceChanged = currentUnitPriceCents !== item.unitPriceCents
    const lineTotalCents = available ? currentUnitPriceCents * item.quantity : 0
    if (available) subtotalCents += lineTotalCents

    items.push({
      id: item.id,
      itemType: item.itemType,
      productId: item.productId,
      title: isCustom ? design.title : product.name,
      product: isCustom ? null : { id: product.id, slug: product.slug, name: product.name, images: product.images, shippingCents: product.shippingCents ?? 0 },
      design: isCustom ? toPublicDesign(design) : null,
      quantity: item.quantity,
      customization: item.customization,
      cartUnitPriceCents: item.unitPriceCents,
      currentUnitPriceCents,
      lineTotalCents,
      available,
      priceChanged,
    })
  }

  const issues = []
  for (const item of items) {
    if (!item.available) {
      issues.push({ itemId: item.id, code: 'unavailable', blocking: true, message: `${item.title} is no longer available and must be removed from your cart.` })
    } else if (item.priceChanged) {
      issues.push({
        itemId: item.id,
        code: 'price-changed',
        blocking: false,
        message: `${item.title}'s price has changed from ${(item.cartUnitPriceCents / 100).toFixed(2)} to ${(item.currentUnitPriceCents / 100).toFixed(2)}.`,
      })
    }
  }

  const hasBlockingIssues = issues.some((issue) => issue.blocking)

  let shippingCents = 0
  for (const item of cart.items) {
    if (item.itemType === 'PRODUCT' && item.product) {
      // Use the customer's selected shipping method if stored in customization
      const selMethod = item.customization?.shippingMethod
      if (selMethod && typeof selMethod.priceCents === 'number') {
        shippingCents += selMethod.priceCents
      } else if (item.product.shippingCents > 0) {
        shippingCents += item.product.shippingCents
      }
    }
  }
  const totalCents = subtotalCents + shippingCents

  return {
    items,
    address,
    subtotalCents,
    shippingCents,
    totalCents,
    issues,
    canConfirm: !hasBlockingIssues,
  }
}
