import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useProduct from '../features/products/useProduct'
import useProducts from '../features/products/useProducts'
import { colorsForMaterial } from '../data/sampleProducts'
import { useCart } from '../features/cart/useCart.js'
import { useAuth } from '../features/auth/useAuth.js'
import Button from '../components/ui/Button'
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

  useEffect(() => {
    if (!availableColors?.length) return
    if (availableColors.some((option) => option.label === color?.label)) return
    setColor(availableColors[0])
  }, [material, product])

  const relatedProducts = useMemo(() => {
    if (!product || !allProducts) return []
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
      // mutationError already handled
    }
  }

  const hasOriginalPrice = typeof product.originalPrice === 'number' && product.originalPrice > product.price
  const hasDiscount = typeof product.discountPercent === 'number' && product.discountPercent > 0
  const hasRating = typeof product.rating === 'number' && product.rating > 0

  return (
    <div className="bg-bg text-ink pb-20">
      <div className="mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 flex items-center gap-2 text-[13px] text-muted">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span className="text-muted/60">/</span>
          <Link to="/products" className="hover:text-ink transition-colors">Shop all</Link>
          <span className="text-muted/60">/</span>
          <span className="text-ink font-semibold">{product.name}</span>
        </nav>

        {/* 2-column Product View */}
        <div className="grid gap-12 min-[1041px]:grid-cols-[1.05fr_1fr]">
          <ProductGallery product={product} activeColor={color?.hex} />

          <div className="flex flex-col justify-start">
            {product.category && (
              <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent mb-2">
                {product.category}
              </span>
            )}

            <h1 className="font-display text-[38px] max-[760px]:text-[30px] font-semibold text-ink leading-[1.15] tracking-[-0.02em] m-0">
              {product.name}
            </h1>

            {/* Dynamic Rating row — only shown if actual rating data exists */}
            {hasRating && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex text-accent">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-accent' : 'fill-line text-line'}`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" stroke="none" />
                    </svg>
                  ))}
                </div>
                <span className="text-[13px] text-muted">
                  {product.rating} {product.reviewsCount ? `(${product.reviewsCount} reviews)` : ''}
                </span>
              </div>
            )}

            {/* Price section with selling price and optional original strikethrough price & discount */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="font-sans text-[30px] font-bold text-ink">
                ₹{product.price}
              </span>
              {hasOriginalPrice && (
                <s className="font-sans text-[18px] text-muted">
                  ₹{product.originalPrice}
                </s>
              )}
              {hasDiscount && (
                <span className="font-sans text-[14px] font-semibold text-[#17683f] bg-[#e3f4ea] px-2.5 py-0.5 rounded-full">
                  {product.discountPercent}% off
                </span>
              )}
              <span className="font-sans text-[13.5px] font-semibold text-[#17683f] bg-[#e3f4ea] px-2 py-0.5 rounded-full">
                Free shipping
              </span>
            </div>

            <p className="mt-4 text-[15px] leading-relaxed text-muted max-w-[52ch]">
              {product.description}
            </p>

            {/* Options configuration */}
            <div className="mt-8 space-y-6">
              <OptionPicker label="Material finish" options={product.materials} value={material} onChange={setMaterial} />
              <ColorSwatchPicker label="Colour palette" colors={availableColors} value={color} onChange={setColor} />
              <OptionPicker label="Scale / size" options={product.sizes} value={size} onChange={setSize} />
              <QuantitySelector value={quantity} onChange={setQuantity} />
            </div>

            {/* Buy / Add to Cart Action */}
            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={mutating}
                className="w-full text-base font-semibold"
              >
                {mutating ? 'Processing…' : 'Add to Cart'}
              </Button>
            </div>

            {addedMessage && (
              <p className="mt-3 text-[13.5px] font-semibold text-[#17683f] bg-[#e3f4ea] px-3.5 py-2 rounded-control">
                ✓ {addedMessage}
              </p>
            )}
            {mutationError && (
              <p className="mt-3 text-[13.5px] font-semibold text-danger bg-[#fbe6e2] px-3.5 py-2 rounded-control">
                {mutationError}
              </p>
            )}

            {/* Assurance Card */}
            <div className="mt-8 rounded-card border border-line bg-alt p-5 flex items-center gap-3 text-[14px] text-muted">
              <svg className="w-5 h-5 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Manufactured with industrial precision. Guaranteed free of manifold errors and defects.</span>
            </div>

            <div className="mt-8">
              <ProductSpecs product={product} />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-line">
            <ProductSection
              eyebrow="You may also like"
              title="Pairs well with"
              products={relatedProducts.slice(0, 4)}
              className="!py-0"
            />
          </div>
        )}

      </div>
    </div>
  )
}
