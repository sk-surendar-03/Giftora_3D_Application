import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
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

const ProductModelViewer = lazy(() => import('../components/product/ProductModelViewer'))

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

  // Resolve option lists — prefer new structured options over legacy flat arrays
  const materialOptions = Array.isArray(product?.materialOptions) && product.materialOptions.length > 0
    ? product.materialOptions
    : null
  const sizeOptions = Array.isArray(product?.sizeOptions) && product.sizeOptions.length > 0
    ? product.sizeOptions
    : null
  const shippingMethods = Array.isArray(product?.shippingMethods) && product.shippingMethods.length > 0
    ? product.shippingMethods
    : null

  const [material, setMaterial] = useState(null)
  const [color, setColor] = useState(null)
  const [size, setSize] = useState(null)
  const [selectedShipping, setSelectedShipping] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [showModel, setShowModel] = useState(false)

  // Set defaults once product loads (useState initial values run before product is available)
  useEffect(() => {
    if (!product) return
    const matOpts = Array.isArray(product.materialOptions) && product.materialOptions.length > 0 ? product.materialOptions : null
    const sizeOpts = Array.isArray(product.sizeOptions) && product.sizeOptions.length > 0 ? product.sizeOptions : null
    const shipMethods = Array.isArray(product.shippingMethods) && product.shippingMethods.length > 0 ? product.shippingMethods : null
    const defaultMat = matOpts ? matOpts[0].name : product.materials?.[0] ?? null
    setMaterial((prev) => prev ?? defaultMat)
    setSize((prev) => prev ?? (sizeOpts ? sizeOpts[0].name : product.sizes?.[0] ?? null))
    setSelectedShipping((prev) => prev ?? (shipMethods ? shipMethods[0] : null))
    const initColors = colorsForMaterial(product, defaultMat)
    setColor((prev) => prev ?? initColors?.[0] ?? null)
  }, [product])

  // When material changes, reset color to first available for that material
  useEffect(() => {
    if (!product || !material) return
    const cols = colorsForMaterial(product, material)
    if (!cols?.length) { setColor(null); return }
    setColor((prev) => cols.some((c) => c.label === prev?.label) ? prev : cols[0])
  }, [material, product])

  // Dynamic price from selected material + size options
  const selectedMaterialOption = materialOptions?.find((m) => m.name === material)
  const selectedSizeOption = sizeOptions?.find((s) => s.name === size)
  const displayPriceCents = selectedMaterialOption
    ? selectedMaterialOption.priceCents + (selectedSizeOption?.additionalCents || 0)
    : null
  const displayPrice = displayPriceCents !== null
    ? (displayPriceCents / 100)
    : product?.price

  const effectiveShippingCents = selectedShipping
    ? selectedShipping.priceCents
    : (product?.shippingPrice ?? 0) * 100
  const effectiveShippingPrice = effectiveShippingCents / 100
  const isFreeShipping = effectiveShippingCents === 0

  const availableColors = product ? colorsForMaterial(product, material) : []

  // Ensure the viewport is at the top whenever this product is opened or changes
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [slug])

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
      await addToCart({
        productId: product.id,
        quantity,
        customization: {
          material,
          color,
          size,
          ...(selectedShipping ? { shippingMethod: { name: selectedShipping.name, priceCents: selectedShipping.priceCents } } : {}),
        },
      })
      setAddedMessage('Added to cart.')
    } catch {
      // mutationError already handled
    }
  }

  const hasOriginalPrice = typeof product.originalPrice === 'number' && product.originalPrice > (displayPrice ?? product.price)
  const hasDiscount = typeof product.discountPercent === 'number' && product.discountPercent > 0
  const hasRating = typeof product.rating === 'number' && product.rating > 0

  return (
    <div className="bg-bg text-ink pb-20">
      <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <span className="text-muted/60">/</span>
          <Link to="/products" className="hover:text-ink transition-colors">Shop all</Link>
          <span className="text-muted/60">/</span>
          <span className="text-ink font-semibold">{product.name}</span>
        </nav>

        {/* 2-column Product View */}
        <div className="grid gap-12 min-[1041px]:grid-cols-[1.05fr_1fr]">
          <div>
            <ProductGallery product={product} activeColor={color?.hex} overrideImageUrl={color?.imageUrl} activeMaterial={material} />

            {/* Optional interactive 3D preview (uploaded STL / 3MF). Product images stay the primary visuals. */}
            {product.model && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowModel((value) => !value)}
                  aria-expanded={showModel}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-4 text-[14px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
                    <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
                  </svg>
                  {showModel ? 'Hide 3D Preview' : '3D Preview'}
                </button>
                {showModel && (
                  <div className="mt-4">
                    <Suspense fallback={<div className="aspect-square w-full rounded-card border border-line bg-soft" />}>
                      <ProductModelViewer model={product.model} />
                    </Suspense>
                  </div>
                )}
              </div>
            )}
          </div>

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

            {/* Price section */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="font-sans text-[30px] font-bold text-ink">
                ₹{(displayPrice ?? product.price).toFixed(2).replace(/\.00$/, '')}
              </span>
              {hasOriginalPrice && (
                <s className="font-sans text-[18px] text-muted">₹{product.originalPrice}</s>
              )}
              {hasDiscount && (
                <span className="font-sans text-[14px] font-semibold text-[#17683f] bg-[#e3f4ea] px-2.5 py-0.5 rounded-full">
                  {product.discountPercent}% off
                </span>
              )}
              {isFreeShipping ? (
                <span className="font-sans text-[13.5px] font-semibold text-[#17683f] bg-[#e3f4ea] px-2.5 py-0.5 rounded-full">
                  Free shipping
                </span>
              ) : (
                <span className="font-sans text-[13.5px] font-medium text-muted bg-soft px-2.5 py-0.5 rounded-full border border-line">
                  + ₹{effectiveShippingPrice} shipping
                </span>
              )}
            </div>

            {/* Price + Shipping Breakdown */}
            <div className="mt-3 rounded-control border border-line bg-surface/70 px-4 py-2.5 text-[13px] text-muted flex flex-wrap items-center gap-x-5 gap-y-1">
              <div>
                <span>Product Price: </span>
                <span className="font-semibold text-ink">₹{(displayPrice ?? product.price).toFixed(2).replace(/\.00$/, '')}</span>
              </div>
              <span className="text-line hidden min-[761px]:inline">•</span>
              <div>
                <span>Shipping: </span>
                <span className={`font-semibold ${isFreeShipping ? 'text-[#17683f]' : 'text-ink'}`}>
                  {isFreeShipping ? 'Free' : `₹${effectiveShippingPrice}`}
                </span>
              </div>
              <span className="text-line hidden min-[761px]:inline">•</span>
              <div>
                <span>Total: </span>
                <span className="font-bold text-accent text-[14.5px]">
                  ₹{((displayPrice ?? product.price) + effectiveShippingPrice).toFixed(2).replace(/\.00$/, '')}
                </span>
              </div>
            </div>

            <p className="mt-4 text-[15px] leading-relaxed text-muted max-w-[52ch]">
              {product.description}
            </p>

            {/* Options configuration */}
            <div className="mt-8 space-y-6">
              {/* Material picker — with per-material price */}
              {materialOptions ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="block font-sans text-[13px] font-bold tracking-[0.04em] text-ink">Material finish</span>
                    {material && <span className="font-sans text-[13px] text-muted">{material}</span>}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {materialOptions.map((opt) => {
                      const isSelected = material === opt.name
                      return (
                        <button key={opt.name} type="button" onClick={() => setMaterial(opt.name)} aria-pressed={isSelected}
                          className={`flex flex-col items-center px-4 py-2 rounded-control border text-[13px] font-medium transition-colors cursor-pointer ${isSelected ? 'border-accent bg-soft text-accent ring-1 ring-accent' : 'border-line bg-surface text-ink hover:border-accent/40'}`}
                        >
                          <span>{opt.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <OptionPicker label="Material finish" options={product.materials} value={material} onChange={setMaterial} />
              )}

              <ColorSwatchPicker label="Colour palette" colors={availableColors} value={color} onChange={setColor} />

              {/* Size picker — with per-size additional price */}
              {sizeOptions ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="block font-sans text-[13px] font-bold tracking-[0.04em] text-ink">Scale / size</span>
                    {size && <span className="font-sans text-[13px] text-muted">{size}</span>}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {sizeOptions.map((opt) => {
                      const isSelected = size === opt.name
                      return (
                        <button key={opt.name} type="button" onClick={() => setSize(opt.name)} aria-pressed={isSelected}
                          className={`flex flex-col items-center px-4 py-2 rounded-control border text-[13px] font-medium transition-colors cursor-pointer ${isSelected ? 'border-accent bg-soft text-accent ring-1 ring-accent' : 'border-line bg-surface text-ink hover:border-accent/40'}`}
                        >
                          <span>{opt.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <OptionPicker label="Scale / size" options={product.sizes} value={size} onChange={setSize} />
              )}

              {/* Shipping method picker */}
              {shippingMethods && shippingMethods.length > 0 && (
                <div>
                  <span className="block font-sans text-[13px] font-bold tracking-[0.04em] text-ink mb-2.5">Shipping method</span>
                  <div className="space-y-2">
                    {shippingMethods.map((method) => {
                      const isSelected = selectedShipping?.name === method.name
                      return (
                        <button key={method.name} type="button" onClick={() => setSelectedShipping(method)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-control border text-[13px] transition-colors cursor-pointer ${isSelected ? 'border-accent bg-soft text-accent ring-1 ring-accent' : 'border-line bg-surface text-ink hover:border-accent/40'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-3.5 w-3.5 rounded-full border-2 ${isSelected ? 'border-accent bg-accent' : 'border-muted'}`} />
                            <span className="font-medium">{method.name}</span>
                            {method.estimatedDays && <span className="text-muted text-[12px]">({method.estimatedDays})</span>}
                          </div>
                          <span className="font-semibold">
                            {method.priceCents === 0 ? 'Free' : `₹${(method.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

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
