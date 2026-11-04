// Translates a Phase 3 backend product (Prisma shape: priceCents, a
// `category` relation object, etc.) into the exact same plain-object shape
// `data/sampleProducts.js` already used — id, slug, name, price (rupees
// number), category (string), material (string), description, image,
// createdAt, materials, colorsByMaterial, colors, sizes. Every existing
// consumer (ProductCard, ProductDetail, Customiser, filters.js, ...)
// keeps working unmodified because it never sees the backend's own shape.
export function mapApiProduct(apiProduct) {
  if (!apiProduct) return null

  const materials = apiProduct.materials ?? []
  const defaultMaterial = materials[0] ?? apiProduct.material ?? ''

  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    price: apiProduct.priceCents / 100,
    category: apiProduct.category?.name ?? '',
    material: defaultMaterial,
    description: apiProduct.description,
    image: apiProduct.images?.[0] ?? null,
    createdAt: apiProduct.createdAt,
    materials,
    colorsByMaterial: apiProduct.colorsByMaterial ?? undefined,
    colors: apiProduct.colorsByMaterial?.[defaultMaterial] ?? [],
    sizes: apiProduct.sizes ?? [],
  }
}
