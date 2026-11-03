const VIEWS = ['Front', 'Angle', 'Detail']

export default function ProductGallery({ product, activeColor }) {
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-card border border-border bg-surface">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink/5">
            <svg viewBox="0 0 160 160" className="h-2/3 w-2/3" role="img" aria-label={`${product.name} preview`}>
              <rect
                x="30"
                y="30"
                width="100"
                height="100"
                rx="16"
                fill={activeColor ?? '#a8763e'}
                stroke="#1a1712"
                strokeWidth="2.5"
              />
              <circle cx="80" cy="46" r="8" fill="none" stroke="#1a1712" strokeWidth="2.5" />
            </svg>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {VIEWS.map((view, index) => (
          <div
            key={view}
            className={`flex aspect-square items-center justify-center rounded-control border bg-ink/5 text-xs font-medium text-muted ${
              index === 0 ? 'border-accent' : 'border-border'
            }`}
          >
            {view}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        Preview shown in your selected colour. Product photography coming soon.
      </p>
    </div>
  )
}
