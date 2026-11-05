import { useState, useMemo } from 'react'

export default function ProductGallery({ product, activeColor }) {
  // Collect images or create angle views if single/no image
  const images = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images.map((src, idx) => ({ id: idx, type: 'img', src, label: `View ${idx + 1}` }))
    }
    if (product.image) {
      return [
        { id: 0, type: 'img', src: product.image, label: 'Front' },
        { id: 1, type: 'svg', angle: 'isometric', label: 'Perspective' },
        { id: 2, type: 'svg', angle: 'detail', label: 'Detail' },
        { id: 3, type: 'svg', angle: 'top', label: 'Top view' },
      ]
    }
    return [
      { id: 0, type: 'svg', angle: 'front', label: 'Front' },
      { id: 1, type: 'svg', angle: 'isometric', label: 'Perspective' },
      { id: 2, type: 'svg', angle: 'detail', label: 'Detail' },
      { id: 3, type: 'svg', angle: 'top', label: 'Top view' },
    ]
  }, [product])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const activeItem = images[selectedIndex] || images[0]

  return (
    /* .gal layout: grid-template-columns: 84px 1fr; gap: 16px;
       Mobile (<=760px): single column with thumbs row underneath or wrap */
    <div className="grid grid-cols-1 min-[761px]:grid-cols-[84px_1fr] gap-4 items-start">
      
      {/* Thumbnails Column:
          Desktop/Tablet: vertical list on left (84px width, gap 12px)
          Mobile (<=760px): horizontal 4-column row underneath main image (order: 2) */}
      <div className="grid grid-cols-4 min-[761px]:grid-cols-1 gap-3 order-2 min-[761px]:order-1">
        {images.map((item, index) => {
          const isSelected = selectedIndex === index
          // Preview tint cycle: '', 'alt1' (bg-alt), 'alt2' (bg-[#1F3046])
          const tintClasses = ['bg-soft', 'bg-alt', 'bg-[#1F3046]', 'bg-soft']
          const tint = tintClasses[index % 4]

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={item.label}
              className={`relative aspect-square w-full rounded-control overflow-hidden border-2 transition-all cursor-pointer ${
                tint
              } ${
                isSelected
                  ? 'border-accent ring-1 ring-accent shadow-sm'
                  : 'border-transparent hover:border-line'
              }`}
            >
              {item.type === 'img' ? (
                <img src={item.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2">
                  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
                    <rect
                      x={item.angle === 'detail' ? '10' : item.angle === 'isometric' ? '25' : '20'}
                      y={item.angle === 'detail' ? '10' : '20'}
                      width={item.angle === 'detail' ? '80' : '60'}
                      height={item.angle === 'detail' ? '80' : '60'}
                      rx="12"
                      fill={activeColor ?? '#D9AE4E'}
                      stroke="#262626"
                      strokeWidth="2.5"
                      transform={item.angle === 'isometric' ? 'rotate(15 50 50)' : undefined}
                    />
                    <circle cx="50" cy="30" r="5" fill="none" stroke="#262626" strokeWidth="2.5" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Main Showcase Image / Viewport (.ph): 1:1 aspect ratio beside thumbnails */}
      <div className="relative aspect-square w-full rounded-card overflow-hidden bg-soft border border-line flex items-center justify-center order-1 min-[761px]:order-2">
        {activeItem?.type === 'img' ? (
          <img
            src={activeItem.src}
            alt={product.name}
            className="h-full w-full object-cover transition-opacity duration-200"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-8">
            <svg viewBox="0 0 200 200" className="h-4/5 w-4/5" role="img" aria-label={`${product.name} preview`}>
              <rect
                x={activeItem?.angle === 'detail' ? '20' : activeItem?.angle === 'isometric' ? '45' : '40'}
                y={activeItem?.angle === 'detail' ? '20' : '40'}
                width={activeItem?.angle === 'detail' ? '160' : '120'}
                height={activeItem?.angle === 'detail' ? '160' : '120'}
                rx="22"
                fill={activeColor ?? '#D9AE4E'}
                stroke="#262626"
                strokeWidth="3.5"
                transform={activeItem?.angle === 'isometric' ? 'rotate(15 100 100)' : undefined}
              />
              <circle cx="100" cy="60" r="10" fill="none" stroke="#262626" strokeWidth="3.5" />
            </svg>
          </div>
        )}

        {/* Badge on main image (top 16px, left 16px as in design preview) */}
        {product.material && (
          <span className="absolute left-4 top-4 inline-flex items-center h-6 rounded-full px-2.5 text-[11.5px] font-semibold bg-secondary text-on-secondary shadow-sm">
            {product.material}
          </span>
        )}
      </div>

    </div>
  )
}
