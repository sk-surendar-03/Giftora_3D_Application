import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getOrCreateCart } from '../cart/cartService.js'
import { getPricingConfig } from '../settings/settingsService.js'
import { calculateTotalCustomizationPriceCents } from '../settings/pricingCalculator.js'

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

  const { perCharacterPriceCents } = await getPricingConfig()

  let subtotalCents = 0
  const items = cart.items.map((item) => {
    const product = item.product
    const available = product.isActive
    // Customizer products have no separate base price — the per-character
    // rate (possibly changed by an admin since this item was added) is the
    // only current price source, same as cartService.js's addItem.
    const currentUnitPriceCents = calculateTotalCustomizationPriceCents(item.customization?.text, item.customization?.subtitle, perCharacterPriceCents)
    const priceChanged = currentUnitPriceCents !== item.unitPriceCents
    const lineTotalCents = available ? currentUnitPriceCents * item.quantity : 0
    if (available) subtotalCents += lineTotalCents

    return {
      id: item.id,
      productId: item.productId,
      product: { id: product.id, slug: product.slug, name: product.name, images: product.images },
      quantity: item.quantity,
      customization: item.customization,
      cartUnitPriceCents: item.unitPriceCents,
      currentUnitPriceCents,
      lineTotalCents,
      available,
      priceChanged,
    }
  })

  const issues = []
  for (const item of items) {
    if (!item.available) {
      issues.push({ itemId: item.id, code: 'unavailable', blocking: true, message: `${item.product.name} is no longer available and must be removed from your cart.` })
    } else if (item.priceChanged) {
      issues.push({
        itemId: item.id,
        code: 'price-changed',
        blocking: false,
        message: `${item.product.name}'s price has changed from ${(item.cartUnitPriceCents / 100).toFixed(2)} to ${(item.currentUnitPriceCents / 100).toFixed(2)}.`,
      })
    }
  }

  const hasBlockingIssues = issues.some((issue) => issue.blocking)

  return {
    items,
    address,
    subtotalCents,
    shippingCents: 0,
    totalCents: subtotalCents,
    issues,
    canConfirm: !hasBlockingIssues,
  }
}
