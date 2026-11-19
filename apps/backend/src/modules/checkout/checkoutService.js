import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { getOrCreateCart } from '../cart/cartService.js'
import { getPricingConfig, getCustomizerSizes, getCustomizerThicknesses, getCustomizerShipping, getStandPricingConfig, getNameplatePricingConfig } from '../settings/settingsService.js'
import { calculateTotalCustomizationPriceCents } from '../settings/pricingCalculator.js'
import { priceForDesign, stlIsAvailable, toPublicDesign } from '../customizer/designService.js'
import { stlIsAvailable as standStlIsAvailable, toPublicDesign as toPublicStandDesign } from '../standDesigner/standDesignService.js'
import { priceForStand } from '../standDesigner/standDesignOptions.js'
import { stlIsAvailable as nameplateStlIsAvailable, toPublicNameplateDesign } from '../nameplateDesigner/nameplateDesignService.js'
import { priceForNameplate } from '../nameplateDesigner/nameplateDesignOptions.js'

export async function reviewCheckout(userId, addressId) {
  const cart = await getOrCreateCart(userId)

  if (cart.items.length === 0) {
    throw new HttpError(400, 'Your cart is empty.')
  }

  const address = await prisma.address.findUnique({ where: { id: addressId } })
  if (!address || address.userId !== userId) {
    throw new HttpError(404, 'Address not found.')
  }

  const [{ perCharacterPriceCents, baseCharacters, basePriceCents }, { sizes: adminSizes }, { thicknesses: adminThicknesses }, standPricingConfig, nameplatePricingConfig, { methods: shippingMethods }] =
    await Promise.all([getPricingConfig(), getCustomizerSizes(), getCustomizerThicknesses(), getStandPricingConfig(), getNameplatePricingConfig(), getCustomizerShipping()])

  let subtotalCents = 0
  const items = []
  for (const item of cart.items) {
    const isCustom = item.itemType === 'CUSTOM_DESIGN'
    const isStand = item.itemType === 'STAND_DESIGN'
    const isNameplate = item.itemType === 'NAMEPLATE_DESIGN'
    const design = item.customDesign
    const standDesign = item.standDesign
    const nameplateDesign = item.nameplateDesign
    const product = item.product

    let available, currentUnitPriceCents, title, productSnapshot, designSnapshot, standDesignSnapshot, nameplateDesignSnapshot

    if (isNameplate) {
      // ─── NAMEPLATE_DESIGN ─────────────────────────────────────────────
      available = nameplateDesign ? await nameplateStlIsAvailable(nameplateDesign) : false
      currentUnitPriceCents = priceForNameplate(
        nameplateDesign?.nameplateType,
        nameplateDesign?.solidVolumeCm3 ?? 0,
        nameplateDesign?.designConfig ?? {},
        nameplatePricingConfig
      )
      title = nameplateDesign?.title ?? 'Nameplate design'
      productSnapshot = null
      designSnapshot = null
      standDesignSnapshot = null
      nameplateDesignSnapshot = nameplateDesign ? toPublicNameplateDesign(nameplateDesign) : null
    } else if (isStand) {
      // ─── STAND_DESIGN ─────────────────────────────────────────────────
      available = standDesign ? await standStlIsAvailable(standDesign) : false
      const charPrice = priceForStand(standDesign?.category, standDesign?.solidVolumeCm3 ?? 0, standPricingConfig)
      currentUnitPriceCents = charPrice
      title = standDesign?.title ?? 'Stand design'
      productSnapshot = null
      designSnapshot = null
      standDesignSnapshot = standDesign ? toPublicStandDesign(standDesign) : null
      nameplateDesignSnapshot = null
    } else if (isCustom) {
      // ─── CUSTOM_DESIGN ────────────────────────────────────────────────
      available = await stlIsAvailable(design)
      const charPrice = priceForDesign(design.params, perCharacterPriceCents, baseCharacters, basePriceCents)
      const sizePriceCents = adminSizes.find((s) => s.name === design.params.size)?.priceCents ?? 0
      const thicknessPriceCents = adminThicknesses.find((t) => t.name === design.params.thickness)?.priceCents ?? 0
      currentUnitPriceCents = charPrice + sizePriceCents + thicknessPriceCents
      title = design.title
      productSnapshot = null
      designSnapshot = toPublicDesign(design)
      standDesignSnapshot = null
      nameplateDesignSnapshot = null
    } else {
      // ─── PRODUCT ──────────────────────────────────────────────────────
      available = product?.isActive ?? false
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
      title = product?.name ?? 'Product'
      productSnapshot = product
        ? { id: product.id, slug: product.slug, name: product.name, images: product.images, shippingCents: product.shippingCents ?? 0 }
        : null
      designSnapshot = null
      standDesignSnapshot = null
      nameplateDesignSnapshot = null
    }

    const priceChanged = currentUnitPriceCents !== item.unitPriceCents
    const lineTotalCents = available ? currentUnitPriceCents * item.quantity : 0
    if (available) subtotalCents += lineTotalCents

    items.push({
      id: item.id,
      itemType: item.itemType,
      productId: item.productId,
      title,
      product: productSnapshot,
      design: designSnapshot,
      stand: standDesignSnapshot,
      standDesign: standDesignSnapshot,
      nameplate: nameplateDesignSnapshot,
      nameplateDesign: nameplateDesignSnapshot,
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
    const selMethod = item.customization?.shippingMethod
    if (selMethod && typeof selMethod.name === 'string') {
      // Re-resolve against server config ΓÇö never trust stored price
      const serverMethod = shippingMethods.find((m) => m.name === selMethod.name)
      if (serverMethod) {
        shippingCents += serverMethod.priceCents
      } else if (typeof selMethod.priceCents === 'number') {
        shippingCents += selMethod.priceCents
      }
    } else if (item.itemType === 'PRODUCT' && item.product?.shippingCents > 0) {
      shippingCents += item.product.shippingCents
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
