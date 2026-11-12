import { useState, useMemo, useEffect, useCallback } from 'react'
import { resolveImageUrl } from '../../utils/imageUrl.js'

export default function ProductGallery({ product, activeColor, overrideImageUrl }) {
  // Extract all available images (from product.images array or product.image fallback)
  const images = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map((src, idx) => ({
        id: idx,
        src: resolveImageUrl(src),
        label: `Angle ${idx + 1}`,
      }))
    }
    if (product.image) {
      return [{ id: 0, src: resolveImageUrl(product.image), label: 'Primary View' }]
    }
    return []
  }, [product.images, product.image])

  const [selectedIndex, setSelectedIndex] = useState(0)
  // When a color-specific image is provided, show it as the main image
  const resolvedOverride = overrideImageUrl ? resolveImageUrl(overrideImageUrl) : null
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })

  // Ensure selectedIndex is within bounds if images change
  const activeIndex = images.length > 0 ? Math.min(selectedIndex, images.length - 1) : 0
  // Color override takes priority over the gallery selection
  const activeItem = resolvedOverride
    ? { ...images[activeIndex], src: resolvedOverride }
    : images[activeIndex]

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
    setIsZoomed(false)
  }, [images.length])

  const handleNext = useCallback(() => {
    if (images.length <= 1) return
    setSelectedIndex((prev) => (prev + 1) % images.length)
    setIsZoomed(false)
  }, [images.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false)
        setIsZoomed(false)
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    // Lock body scroll while lightbox is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isLightboxOpen, handlePrev, handleNext])

  function handleMouseMoveZoom(e) {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  return (
    <div className="grid grid-cols-1 min-[761px]:grid-cols-[84px_1fr] gap-4 items-start select-none">
      {/* Thumbnails Strip:
          Desktop: Vertical strip on left (84px width, gap 12px)
          Mobile: Horizontal scrollable row below the main image (order-2) */}
      {images.length > 1 && (
        <div className="flex min-[761px]:flex-col gap-3 order-2 min-[761px]:order-1 overflow-x-auto min-[761px]:overflow-y-auto max-h-[540px] pb-2 min-[761px]:pb-0 scrollbar-none">
          {images.map((item, index) => {
            const isSelected = activeIndex === index
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View ${item.label}`}
                className={`relative aspect-square w-16 min-[761px]:w-full shrink-0 rounded-control overflow-hidden border-2 transition-all cursor-pointer bg-soft ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent shadow-sm'
                    : 'border-transparent hover:border-line opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Main Showcase Image / Viewport (.ph): 1:1 aspect ratio beside thumbnails */}
      <div className="relative aspect-square w-full rounded-card overflow-hidden bg-soft border border-line flex items-center justify-center order-1 min-[761px]:order-2 group">
        {activeItem ? (
          <>
            <img
              src={activeItem.src}
              alt={`${product.name} - ${activeItem.label}`}
              onClick={() => setIsLightboxOpen(true)}
              className="h-full w-full object-cover transition-opacity duration-200 cursor-zoom-in"
            />

            {/* Expand / Lightbox Indicator Button (top-right overlay) */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-3.5 right-3.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer shadow-sm"
              title="Click to view full size"
              aria-label="Enlarge image"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>

            {/* Image Counter Badge (bottom-right) */}
            {images.length > 1 && (
              <div className="absolute bottom-3.5 right-3.5 inline-flex items-center px-2.5 py-1 rounded-full bg-black/60 text-white text-[11.5px] font-semibold backdrop-blur-xs pointer-events-none shadow-xs">
                {activeIndex + 1} / {images.length}
              </div>
            )}

            {/* Previous Image Navigation Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrev()
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-md border border-line/60 hover:bg-surface hover:text-accent transition-all cursor-pointer opacity-90 hover:opacity-100"
                aria-label="Previous image"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Next Image Navigation Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-md border border-line/60 hover:bg-surface hover:text-accent transition-all cursor-pointer opacity-90 hover:opacity-100"
                aria-label="Next image"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </>
        ) : (
          /* Fallback when no images exist */
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted">
            <svg className="h-16 w-16 text-muted/60 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm font-medium text-ink">No product images</p>
            <p className="text-xs text-muted mt-0.5">Photos for this item will appear here.</p>
          </div>
        )}

        {/* Material Badge on main image (top 14px, left 14px) */}
        {product.material && (
          <span className="absolute left-3.5 top-3.5 inline-flex items-center h-6 rounded-full px-2.5 text-[11.5px] font-semibold bg-secondary text-on-secondary shadow-sm pointer-events-none">
            {product.material}
          </span>
        )}
      </div>

      {/* Full-size Lightbox Modal */}
      {isLightboxOpen && activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product Image Lightbox"
          onClick={() => {
            setIsLightboxOpen(false)
            setIsZoomed(false)
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/92 backdrop-blur-md p-4 sm:p-6"
        >
          {/* Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm tracking-wide">
                {product.name}
              </span>
              <span className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded-full font-medium">
                {activeIndex + 1} of {images.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Zoom toggle button */}
              <button
                type="button"
                onClick={() => setIsZoomed((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors cursor-pointer"
                title={isZoomed ? 'Zoom out' : 'Zoom in'}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isZoomed ? (
                    <>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </>
                  ) : (
                    <>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </>
                  )}
                </svg>
                {isZoomed ? '1x' : '2x Zoom'}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false)
                  setIsZoomed(false)
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-lg cursor-pointer"
                aria-label="Close fullscreen view"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Center Showcase Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-3"
          >
            {/* Previous Navigation Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:bg-black/90 transition-all cursor-pointer shadow-lg"
                aria-label="Previous photo"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Next Navigation Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:bg-black/90 transition-all cursor-pointer shadow-lg"
                aria-label="Next photo"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}

            {/* Displayed Image */}
            <div
              onMouseMove={handleMouseMoveZoom}
              onClick={() => setIsZoomed((v) => !v)}
              className={`max-h-[75vh] max-w-full flex items-center justify-center overflow-hidden rounded-lg transition-transform ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            >
              <img
                src={activeItem.src}
                alt={`${product.name} - ${activeItem.label}`}
                style={
                  isZoomed
                    ? {
                        transform: 'scale(2.2)',
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        transition: 'transform 0.15s ease-out',
                      }
                    : {
                        transform: 'scale(1)',
                        transition: 'transform 0.2s ease-out',
                      }
                }
                className="max-h-[75vh] max-w-full object-contain rounded-md"
              />
            </div>
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {images.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl flex items-center justify-center gap-2 overflow-x-auto py-2"
            >
              {images.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(idx)
                    setIsZoomed(false)
                  }}
                  className={`h-14 w-14 shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-black/40 ${
                    activeIndex === idx
                      ? 'border-accent ring-2 ring-accent scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={item.src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
