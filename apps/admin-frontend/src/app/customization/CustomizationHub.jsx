import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CUSTOMIZATION_PRODUCTS } from '../../features/customization/customizationProducts.js'

export default function CustomizationHub() {
  const [filter, setFilter] = useState('all')

  const filteredProducts = CUSTOMIZATION_PRODUCTS.filter((product) => {
    if (filter === 'active') return product.status === 'active'
    if (filter === 'coming-soon') return product.status === 'coming-soon'
    return true
  })

  const activeCount = CUSTOMIZATION_PRODUCTS.filter((p) => p.status === 'active').length
  const totalCount = CUSTOMIZATION_PRODUCTS.length

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent font-sans">
              Centralized Product Studio
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink tracking-tight">
            3D Customisation Management
          </h1>
          <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
            Manage your independent 3D customisation studios. Configure pricing rules, material palettes, volume fees, dimensions, and manufacturing options for each product.
          </p>
        </div>

        {/* Quick Stats Pill Rail */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="rounded-card border border-line bg-surface px-4 py-2 text-center shadow-xs">
            <span className="block text-[11px] font-medium text-muted uppercase tracking-wider">Active Studios</span>
            <span className="font-display text-xl font-bold text-ink">{activeCount} / {totalCount}</span>
          </div>
          <div className="rounded-card border border-line bg-surface px-4 py-2 text-center shadow-xs">
            <span className="block text-[11px] font-medium text-muted uppercase tracking-wider">STL Export</span>
            <span className="font-display text-xl font-bold text-emerald-500">Live</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-control border border-line bg-surface p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-control px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-accent text-on-accent shadow-xs'
                : 'text-muted hover:text-ink hover:bg-alt'
            }`}
          >
            All Products ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`rounded-control px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              filter === 'active'
                ? 'bg-accent text-on-accent shadow-xs'
                : 'text-muted hover:text-ink hover:bg-alt'
            }`}
          >
            Active Studios ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('coming-soon')}
            className={`rounded-control px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              filter === 'coming-soon'
                ? 'bg-accent text-on-accent shadow-xs'
                : 'text-muted hover:text-ink hover:bg-alt'
            }`}
          >
            Roadmap ({totalCount - activeCount})
          </button>
        </div>

        <span className="hidden sm:inline text-xs text-muted">
          Click any active studio to configure its individual parameters
        </span>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-7">
        {filteredProducts.map((product) => {
          const isActive = product.status === 'active'

          return (
            <div
              key={product.id}
              className={`group relative rounded-card border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                isActive
                  ? 'border-line bg-surface hover:border-accent hover:shadow-lg hover:-translate-y-1'
                  : 'border-line/70 bg-surface/50 opacity-80'
              }`}
            >
              <div>
                {/* Thumbnail / Visual Header */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Badges on top */}
                  <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md shadow-xs ${
                        isActive
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-900/80 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                      {product.statusLabel}
                    </span>

                    <span className="inline-flex items-center rounded-full bg-accent/90 text-on-accent px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider backdrop-blur-md">
                      {product.badge}
                    </span>
                  </div>

                  {/* Bottom title text overlay */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-display text-xl font-bold text-white tracking-tight drop-shadow-sm">
                      {product.name}
                    </h3>
                    <p className="text-xs text-amber-200/90 font-medium">{product.subtitle}</p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4">
                  <p className="text-xs leading-relaxed text-muted min-h-[40px]">
                    {product.description}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-alt px-2 py-0.5 text-[11px] font-medium text-ink border border-line"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats list */}
                  <div className="pt-2 border-t border-line space-y-1.5">
                    {product.stats.map((stat, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted">{stat.label}</span>
                        <span className="font-medium text-ink font-mono">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 pt-0">
                {isActive ? (
                  <div className="flex items-center gap-3">
                    <Link
                      to={product.manageRoute}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-control bg-accent py-2.5 px-4 text-xs font-bold text-on-accent hover:bg-accent-dark transition-all duration-200 shadow-sm group/btn"
                    >
                      <span>Manage Customisation</span>
                      <svg
                        className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>

                    {product.customerRoute && (
                      <a
                        href={product.customerRoute}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-control border border-line bg-alt p-2.5 text-muted hover:text-ink hover:border-accent transition-colors"
                        title="View live customer studio"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-2.5 px-4 rounded-control bg-alt border border-line text-xs font-medium text-muted">
                    <svg className="w-3.5 h-3.5 mr-1.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Studio In Development (Roadmap)
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Extensibility & Developer Note */}
      <div className="rounded-card border border-line bg-alt/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-ink block">Extensible 3D Product Architecture</span>
            <span>New 3D customiser modules can be added by registering them in the product catalog with their own dedicated route.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
