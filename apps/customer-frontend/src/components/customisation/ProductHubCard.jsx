import { Link } from 'react-router-dom'

export default function ProductHubCard({ product }) {
  const isActive = product.status === 'active'

  return (
    <div
      className={`group relative flex flex-col justify-between h-full overflow-hidden rounded-[24px] border transition-all duration-300 ease-out ${
        isActive
          ? 'border-stone-800 bg-stone-900/50 hover:border-amber-500/50 hover:shadow-[0_20px_50px_-10px_rgba(217,174,78,0.22),0_8px_20px_rgba(0,0,0,0.4)] hover:-translate-y-2'
          : 'border-stone-800/60 bg-stone-900/30 opacity-80'
      }`}
    >
      <div className="flex flex-col flex-1">
        {/* Visual Preview Container */}
        <Link
          to={product.route}
          className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden bg-stone-950 block focus:outline-none"
          tabIndex={-1}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />

          {/* Luxury ambient gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none" />

          {/* Badges on Top */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-md ${
                isActive
                  ? 'bg-stone-950/75 text-emerald-400 border border-emerald-500/30'
                  : 'bg-stone-950/75 text-stone-300 border border-white/10'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-stone-400'
                }`}
              />
              {isActive ? 'Live Studio' : 'Roadmap'}
            </span>

            {product.badge && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-950 shadow-md backdrop-blur-md">
                {product.badge}
              </span>
            )}
          </div>

          {/* Title & Subtitle Overlay */}
          <div className="absolute bottom-4 inset-x-5 pointer-events-none z-10">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-md">
                {product.name}
              </h3>
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                {product.priceHint}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-stone-300/90 font-medium line-clamp-1">{product.subtitle}</p>
          </div>
        </Link>

        {/* Content Body */}
        <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-stone-200 font-medium">
              {product.description}
            </p>

            <p className="text-xs text-stone-400 leading-relaxed">
              {product.longDescription}
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="pt-3 border-t border-stone-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-sans block">
              Studio Features
            </span>
            <ul className="space-y-2 text-xs text-stone-200 list-none p-0 m-0">
              {product.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2.5">
                  <span className="h-4 w-4 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
                    <svg
                      className="w-2.5 h-2.5 text-amber-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-6 sm:p-7 pt-0">
        {isActive ? (
          <Link
            to={product.route}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 py-3.5 px-6 text-sm font-extrabold text-stone-950 transition-all duration-200 shadow-md shadow-amber-500/20 active:scale-[0.99] group/btn"
          >
            <span>{product.ctaText}</span>
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-stone-900 border border-stone-800 py-3.5 px-6 text-xs font-semibold text-stone-400">
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
