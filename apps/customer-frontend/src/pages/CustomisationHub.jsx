import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CUSTOMISATION_PRODUCTS } from '../features/customisation/customisationProducts.js'
import ProductHubCard from '../components/customisation/ProductHubCard.jsx'

export default function CustomisationHub() {
  const [activeTab, setActiveTab] = useState('all')

  const displayedProducts = CUSTOMISATION_PRODUCTS.filter((product) => {
    if (activeTab === 'active') return product.status === 'active'
    if (activeTab === 'coming-soon') return product.status === 'coming-soon'
    return true
  })

  return (
    <div className="bg-bg text-ink pb-24">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-surface via-bg to-bg pt-14 pb-16">
        {/* Subtle decorative background blur */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[600px] rounded-full opacity-20 pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(circle, #D9AE4E 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-[1400px] px-6 sm:px-10 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 mb-4 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Giftora 3D Customisation Studio
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink max-w-4xl mx-auto leading-[1.12]">
            Bring Your Ideas to Life in 3D
          </h1>

          {/* Subtitle */}
          <p className="mt-4 font-sans text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Choose a product, customise your design and create something uniquely yours.
          </p>

          {/* Value Props Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-muted">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Real-Time 3D WebGL Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Multi-Color Precision Printing</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>Ships Across India in 3 Days</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-10 inline-flex items-center rounded-full border border-line bg-surface p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-accent text-on-accent shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              All Studios ({CUSTOMISATION_PRODUCTS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-accent text-on-accent shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Ready to Customise ({CUSTOMISATION_PRODUCTS.filter((p) => p.status === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('coming-soon')}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'coming-soon'
                  ? 'bg-accent text-on-accent shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Coming Soon ({CUSTOMISATION_PRODUCTS.filter((p) => p.status === 'coming-soon').length})
            </button>
          </div>
        </div>
      </section>

      {/* Product Cards Grid */}
      <section className="mx-auto max-w-[1400px] px-6 sm:px-10 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-10">
          {displayedProducts.map((product) => (
            <ProductHubCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="mx-auto max-w-[1400px] px-6 sm:px-10 mt-20 pt-16 border-t border-line">
        <div className="text-center mb-12">
          <span className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Simple 3-Step Experience
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-2">
            How 3D Customisation Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-card border border-line bg-surface p-7 text-center space-y-3 relative">
            <div className="h-12 w-12 rounded-full bg-accent/15 text-accent font-display text-lg font-bold flex items-center justify-center mx-auto border border-accent/30">
              1
            </div>
            <h3 className="font-display text-lg font-bold text-ink">Choose Your Product</h3>
            <p className="text-xs text-muted leading-relaxed">
              Select between our Name Keychain or Phone &amp; Pen Stand studios based on what you want to create.
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface p-7 text-center space-y-3 relative">
            <div className="h-12 w-12 rounded-full bg-accent/15 text-accent font-display text-lg font-bold flex items-center justify-center mx-auto border border-accent/30">
              2
            </div>
            <h3 className="font-display text-lg font-bold text-ink">Personalize in 3D</h3>
            <p className="text-xs text-muted leading-relaxed">
              Enter your name, pick typography, choose colors and finishes, and watch your solid 3D model update instantly.
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface p-7 text-center space-y-3 relative">
            <div className="h-12 w-12 rounded-full bg-accent/15 text-accent font-display text-lg font-bold flex items-center justify-center mx-auto border border-accent/30">
              3
            </div>
            <h3 className="font-display text-lg font-bold text-ink">Engineered &amp; Delivered</h3>
            <p className="text-xs text-muted leading-relaxed">
              Our farm of industrial 3D printers slices your design, prints it with premium materials, and ships directly to your doorstep.
            </p>
          </div>
        </div>
      </section>

      {/* Support / Custom Request Banner */}
      <section className="mx-auto max-w-[1400px] px-6 sm:px-10 mt-16">
        <div className="rounded-[24px] border border-accent/40 bg-gradient-to-r from-surface via-alt to-surface p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
              Looking for a custom corporate bulk order or bespoke 3D design?
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              We engineer custom logos, exhibition pieces, and trophies for businesses and creators.
            </p>
          </div>
          <Link
            to="/contact"
            className="rounded-control bg-accent px-6 py-3 text-xs font-bold text-on-accent hover:bg-accent-dark transition-colors shrink-0 shadow-xs"
          >
            Contact 3D Engineering
          </Link>
        </div>
      </section>
    </div>
  )
}
