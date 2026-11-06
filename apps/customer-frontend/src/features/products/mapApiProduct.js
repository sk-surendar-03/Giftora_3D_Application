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

  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    price,
    originalPrice,
    discountPercent,
    category: apiProduct.category?.name ?? '',
    material: defaultMaterial,
    description: apiProduct.description,
    image: apiProduct.images?.[0] ?? null,
    images: apiProduct.images ?? [],
    createdAt: apiProduct.createdAt,
    materials,
    colorsByMaterial: apiProduct.colorsByMaterial ?? undefined,
    colors: apiProduct.colorsByMaterial?.[defaultMaterial] ?? Object.values(apiProduct.colorsByMaterial ?? {})[0] ?? [],
    sizes: apiProduct.sizes ?? [],
  }
}
