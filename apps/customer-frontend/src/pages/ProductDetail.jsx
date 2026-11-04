import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useProduct from '../features/products/useProduct'
import useProducts from '../features/products/useProducts'
import { colorsForMaterial } from '../data/sampleProducts'
import { useCart } from '../features/cart/useCart.js'
import { useAuth } from '../features/auth/useAuth.js'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProductGallery from '../components/product/ProductGallery'
import OptionPicker from '../components/product/OptionPicker'
import ColorSwatchPicker from '../components/product/ColorSwatchPicker'
import QuantitySelector from '../components/product/QuantitySelector'
import ProductSpecs from '../components/product/ProductSpecs'
import ProductSection from '../components/product/ProductSection'
import ProductUnavailable from '../components/product/ProductUnavailable'
import ProductDetailSkeleton from '../components/product/ProductDetailSkeleton'

export default function ProductDetail() {
  const { slug } = useParams()
  // Keyed by slug so the view below remounts whenever the product changes —
  // including navigating from one product's "Related products" to another —
  // resetting option selections instead of carrying stale ones over.
  return <ProductDetailView key={slug} slug={slug} />
}

function ProductDetailView({ slug }) {
  const { data: product, isLoading, error } = useProduct(slug)
  const { data: allProducts } = useProducts()
  const { isAuthenticated } = useAuth()
  const { addToCart, mutating, mutationError } = useCart()
  const navigate = useNavigate()
  const [addedMessage, setAddedMessage] = useState(null)

  const [material, setMaterial] = useState(product?.materials?.[0])
  const [color, setColor] = useState(product ? colorsForMaterial(product, product.materials?.[0])?.[0] : undefined)
  const [size, setSize] = useState(product?.sizes?.[0])
  const [quantity, setQuantity] = useState(1)

  const availableColors = product ? colorsForMaterial(product, material) : undefined

  // Colours can differ per material (e.g. Silk Metallic PLA vs Standard
  // PLA) — if the current colour isn't valid for the newly selected
  // material, fall back to that material's first colour instead of keeping
  // a colour that no longer applies.
  useEffect(() => {
    if (!availableColors?.length) return
    if (availableColors.some((option) => option.label === color?.label)) return
    setColor(availableColors[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the material/product changing, not every colour-array identity change.
  }, [material, product])

  const relatedProducts = useMemo(() => {
    if (!product) return []
    const sameCategory = allProducts.filter((p) => p.id !== product.id && p.category === product.category)
    if (sameCategory.length > 0) return sameCategory
    return allProducts.filter((p) => p.id !== product.id)
  }, [product, allProducts])

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger">
        Something went wrong loading this product. Please try again.
      </div>
    )
  }

  if (!product) {
    return <ProductUnavailable />
  }

  const customiseState = {
    productId: product.id,
    productName: product.name,
    material,
    color,
    size,
    quantity,
  }

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${product.slug}` } })
      return
    }
    setAddedMessage(null)
    try {
      await addToCart({ productId: product.id, quantity, customization: { material, color, size } })
      setAddedMessage('Added to cart.')
    } catch {
      // mutationError (from useCart) already surfaces the real message below.
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <nav className="mb-6 text-sm text-muted">
        <Link to="/products" className="hover:text-ink">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 sm:grid-cols-2">
        <ProductGallery product={product} activeColor={color?.hex} />

        <div>
          {product.category && (
            <Badge tone="accent" className="mb-3">
              {product.category}
            </Badge>
          )}
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-lg font-medium text-ink">₹{product.price}</p>
          <p className="mt-4 text-sm text-muted sm:text-base">{product.description}</p>

          <div className="mt-8 space-y-6">
            <OptionPicker label="Material" options={product.materials} value={material} onChange={setMaterial} />
            <ColorSwatchPicker label="Colour" colors={availableColors} value={color} onChange={setColor} />
            <OptionPicker label="Size" options={product.sizes} value={size} onChange={setSize} />
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={`/customise/${product.id}`} state={customiseState}>
              <Button variant="accent" size="lg">
                Customize This Keychain
              </Button>
            </Link>
            <Button variant="secondary" size="lg" onClick={handleAddToCart} disabled={mutating}>
              {mutating ? 'Adding…' : 'Add to Cart'}
            </Button>
          </div>
          {addedMessage && <p className="mt-2 text-sm text-accent-dark">{addedMessage}</p>}
          {mutationError && <p className="mt-2 text-sm text-danger">{mutationError}</p>}

          <div className="mt-10">
            <ProductSpecs product={product} />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <ProductSection
          eyebrow="You may also like"
          title="Related products"
          products={relatedProducts}
          className="mt-16 !px-0"
        />
      )}
    </div>
  )
}
