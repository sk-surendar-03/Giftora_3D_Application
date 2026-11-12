import { resolveImageUrl } from '../../utils/imageUrl.js'

// Translates a backend product (Prisma shape: priceCents, originalPriceCents,
// a `category` relation object, etc.) into the exact plain-object shape used
// across the customer frontend.
export function mapApiProduct(apiProduct) {
  if (!apiProduct) return null

  const materials = apiProduct.materials ?? []
  const defaultMaterial = materials[0] ?? apiProduct.material ?? ''

  const price = typeof apiProduct.priceCents === 'number' ? apiProduct.priceCents / 100 : apiProduct.price
  const originalPrice = typeof apiProduct.originalPriceCents === 'number' && apiProduct.originalPriceCents > 0
    ? apiProduct.originalPriceCents / 100
    : null

  let discountPercent = null
  if (originalPrice && price && originalPrice > price) {
    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  const shippingCents = typeof apiProduct.shippingCents === 'number' ? apiProduct.shippingCents : 0
  const shippingPrice = shippingCents / 100
  const isFreeShipping = shippingCents === 0

  const resolvedImages = Array.isArray(apiProduct.images) && apiProduct.images.length > 0
    ? apiProduct.images.map(resolveImageUrl)
    : apiProduct.image
    ? [resolveImageUrl(apiProduct.image)]
    : []

  return {
    shippingCents,
    shippingPrice,
    isFreeShipping,
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    price,
    originalPrice,
    discountPercent,
    category: apiProduct.category?.name ?? '',
    material: defaultMaterial,
    description: apiProduct.description,
    image: resolvedImages[0] ?? null,
    images: resolvedImages,
    createdAt: apiProduct.createdAt,
    materials,
    colorsByMaterial: apiProduct.colorsByMaterial ?? undefined,
    colors: apiProduct.colorsByMaterial?.[defaultMaterial] ?? Object.values(apiProduct.colorsByMaterial ?? {})[0] ?? [],
    sizes: apiProduct.sizes ?? [],
    // STL/3MF preview model summary ({ format, sizeBytes, url }) or null.
    model: apiProduct.model ?? null,
    // Structured pricing options added in Nov 2026
    materialOptions: Array.isArray(apiProduct.materialOptions) ? apiProduct.materialOptions : null,
    sizeOptions: Array.isArray(apiProduct.sizeOptions) ? apiProduct.sizeOptions : null,
    shippingMethods: Array.isArray(apiProduct.shippingMethods) ? apiProduct.shippingMethods : null,
    imageMaterials: apiProduct.imageMaterials && typeof apiProduct.imageMaterials === 'object' ? apiProduct.imageMaterials : null,
  }
}
