import { Link } from 'react-router-dom'

export default function ProductHubCard({ product }) {
  const isActive = product.status === 'active'

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] border transition-all duration-300 ${
        isActive
          ? 'border-line bg-surface hover:border-accent hover:shadow-[0_16px_40px_-12px_rgba(217,174,78,0.22)] hover:-translate-y-1.5'
          : 'border-line/60 bg-surface/60 opacity-85'
      }`}
    >
      <div>
        {/* Visual Preview Container */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />

          {/* Luxury ambient gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

          {/* Badges on Top */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-xs ${
                isActive
                  ? 'bg-black/60 text-emerald-400 border border-emerald-500/30'
                  : 'bg-black/60 text-slate-300 border border-white/10'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-400'
                }`}
              />
              {isActive ? 'Live Studio' : 'Roadmap'}
            </span>

            {product.badge && (
              <span className="inline-flex items-center rounded-full bg-accent/95 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-on-accent shadow-sm backdrop-blur-md">
                {product.badge}
              </span>
            )}
          </div>

          {/* Title & Subtitle Overlay */}
          <div className="absolute bottom-4 inset-x-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                {product.name}
              </h3>
              <span className="font-sans text-xs font-bold text-[#f5d77f] uppercase tracking-wider">
                {product.priceHint}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-amber-100/90 font-medium">{product.subtitle}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm leading-relaxed text-muted font-medium">
            {product.description}
          </p>

          <p className="text-xs text-muted/80 leading-normal">
            {product.longDescription}
          </p>

          {/* Feature Highlights */}
          <div className="pt-2 border-t border-line space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent font-sans block">
              Studio Features
            </span>
            <ul className="space-y-1.5 text-xs text-ink list-none p-0 m-0">
              {product.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5 text-accent shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-6 pt-0">
        {isActive ? (
          <Link
            to={product.route}
            className="flex items-center justify-center gap-2 w-full rounded-control bg-accent py-3 px-6 text-sm font-bold text-on-accent hover:bg-accent-dark transition-all duration-200 shadow-sm group/btn"
          >
            <span>{product.ctaText}</span>
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full rounded-control bg-alt border border-line py-3 px-6 text-xs font-semibold text-muted">
            <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>In Engineering &amp; Prototype Phase</span>
          </div>
        )}
      </div>
    </div>
  )
}
