import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { fetchStandPricing, updateStandPricing } from '../../features/settings/settingsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

const CATEGORY_METADATA = [
  { id: 'phone-stand', name: 'Phone Stand Studio', defaultRupees: 500, desc: 'Compact angled cradle designed for smartphones and mini tablets.' },
  { id: 'pen-holder', name: 'Pen Holder Studio', defaultRupees: 600, desc: 'Vertical organizer cylinder for pens, pencils, and styluses.' },
  { id: 'combined', name: 'Combined Phone + Pen Stand', defaultRupees: 900, desc: 'Integrated phone docking angle with rear pen cylinder and front name plinth.' },
  { id: 'desk-organizer', name: 'Desk Organizer Studio', defaultRupees: 1200, desc: 'Multi-compartment tray with phone dock, dual pen slots, and paperclip wells.' },
  { id: 'personalized-gift', name: 'Personalized Gift Stand', defaultRupees: 800, desc: 'Premium branded showcase stand with large personalized relief plaque.' },
]

const FINISHES = ['Matte', 'Satin', 'Metallic Gold', 'Metallic Silver', 'Metallic Copper', 'Two Tone', 'Gradient', 'Wood Grain', 'Marble']
const FONTS = ['Modern Sans', 'Bold', 'Serif', 'Rounded', 'Futuristic', 'Handwritten', 'Cursive', 'Playful']
const MOTIFS = ['None', 'Star', 'Heart', 'Flower', 'Leaf', 'Gear', 'Hexagon', 'Diamond']
const THEMES = ['Minimalist', 'Luxury Executive', 'Gaming RGB', 'Modern Geometric', 'Cute Pastel', 'Industrial', 'Nature Inspired', 'Futuristic', 'Corporate Gift', 'Kids / Student']

export default function StandCustomizationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState(null)

  // Pricing State
  const [pricePerCm3Rupees, setPricePerCm3Rupees] = useState('1.00')
  const [categoryPrices, setCategoryPrices] = useState({
    'phone-stand': 500,
    'pen-holder': 600,
    'combined': 900,
    'desk-organizer': 1200,
    'personalized-gift': 800,
  })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchStandPricing()
      .then((data) => {
        if (!mounted || !data) return
        if (data.pricePerCm3Cents != null) {
          setPricePerCm3Rupees((data.pricePerCm3Cents / 100).toFixed(2))
        }
        if (data.categories) {
          const next = {}
          for (const cat of CATEGORY_METADATA) {
            const rawCents = data.categories[cat.id]?.basePriceCents
            next[cat.id] = rawCents != null ? Math.round(rawCents / 100) : cat.defaultRupees
          }
          setCategoryPrices(next)
        }
      })
      .catch((err) => {
        if (mounted) setBanner({ type: 'error', message: extractError(err) })
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setBanner(null)
    setSaving(true)

    try {
      const pricePerCm3Cents = Math.max(0, Math.round(parseFloat(pricePerCm3Rupees || '0') * 100))
      const categoriesPayload = {}
      for (const [id, priceInRupees] of Object.entries(categoryPrices)) {
        categoriesPayload[id] = {
          basePriceCents: Math.max(0, Math.round(Number(priceInRupees || 0) * 100)),
        }
      }

      await updateStandPricing({
        pricePerCm3Cents,
        categories: categoriesPayload,
      })

      setBanner({ type: 'success', message: 'Phone & Pen Stand configuration saved successfully.' })
    } catch (err) {
      setBanner({ type: 'error', message: extractError(err) })
    } finally {
      setSaving(false)
    }
  }

  function handleCategoryPriceChange(id, value) {
    const num = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)
    setCategoryPrices((prev) => ({ ...prev, [id]: num }))
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <Link
            to="/customization"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-dark transition-colors uppercase tracking-wider mb-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to 3D Customisation Hub
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink">Phone & Pen Stand Studio</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Configure volume-based pricing rates, base category pricing tiers, and review production parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center justify-center gap-2 rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-dark disabled:opacity-50 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          {saving ? 'Saving Changes…' : 'Save Configuration'}
        </button>
      </div>

      {banner && <Banner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />}

      {loading ? (
        <div className="p-12 text-center text-sm text-muted">Loading stand customisation settings…</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Volume Pricing Fee */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">1. Solid Volume Pricing Rate</h2>
                <p className="text-xs text-muted mt-0.5">
                  Customers are charged based on the exact cubic centimeters of material printed from their 3D model.
                </p>
              </div>
              <span className="text-[11px] font-mono text-muted bg-alt px-2.5 py-1 rounded border border-line">
                Formula: Base + (cm³ × Rate)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Rate per Cubic Centimeter (₹ / cm³)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricePerCm3Rupees}
                    onChange={(e) => setPricePerCm3Rupees(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-control border border-line bg-alt text-sm font-medium text-ink focus:border-accent focus:outline-none"
                    placeholder="1.00"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">Default rate is ₹1.00 per cm³ (100 cents).</p>
              </div>

              <div className="p-4 rounded-control bg-alt/60 border border-line text-xs space-y-1.5">
                <div className="font-semibold text-ink">Volume Rate Preview:</div>
                <div className="flex justify-between text-muted">
                  <span>Small Stand (150 cm³):</span>
                  <span className="font-medium text-ink font-mono">
                    +₹{(150 * parseFloat(pricePerCm3Rupees || '0')).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Combined Stand (245 cm³):</span>
                  <span className="font-medium text-ink font-mono">
                    +₹{(245 * parseFloat(pricePerCm3Rupees || '0')).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Category Base Pricing */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs">
            <div className="pb-4 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink">2. Category Base Pricing Tiers</h2>
              <p className="text-xs text-muted mt-0.5">
                Sets the baseline manufacturing and tooling price for each stand design studio type before volume calculation.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
              {CATEGORY_METADATA.map((cat) => (
                <div
                  key={cat.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-control border border-line bg-alt/40 hover:bg-alt/80 transition-colors gap-3"
                >
                  <div className="max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink">{cat.name}</span>
                      <span className="font-mono text-[10px] text-muted bg-surface px-2 py-0.5 rounded border border-line">
                        {cat.id}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{cat.desc}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <label className="text-xs text-muted font-medium">Base Price:</label>
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={categoryPrices[cat.id] ?? ''}
                        onChange={(e) => handleCategoryPriceChange(cat.id, e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-control border border-line bg-surface text-sm font-semibold text-ink focus:border-accent focus:outline-none text-right font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Design & Production Specifications (Informational) */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink">3. Available Finishes & Styles</h2>
              <p className="text-xs text-muted mt-0.5">
                Active options loaded by the client 3D engine for materials, textures, and fonts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-ink block mb-1.5">Surface Finishes ({FINISHES.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {FINISHES.map((f) => (
                    <span key={f} className="px-2 py-1 rounded bg-alt border border-line text-muted font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-ink block mb-1.5">Curated Themes ({THEMES.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {THEMES.map((t) => (
                    <span key={t} className="px-2 py-1 rounded bg-alt border border-line text-muted font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-ink block mb-1.5">Typography Fonts ({FONTS.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {FONTS.map((font) => (
                    <span key={font} className="px-2 py-1 rounded bg-alt border border-line text-muted font-medium">
                      {font}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-ink block mb-1.5">Embossed Motifs ({MOTIFS.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {MOTIFS.map((m) => (
                    <span key={m} className="px-2 py-1 rounded bg-alt border border-line text-muted font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-line flex flex-wrap gap-6 text-xs text-muted">
              <div>
                <span className="font-semibold text-ink">Bed Volume Limit:</span> 220 × 220 × 250 mm
              </div>
              <div>
                <span className="font-semibold text-ink">Max STL Size:</span> 50 MB
              </div>
              <div>
                <span className="font-semibold text-ink">Preview Image Limit:</span> 2 MB (WebP)
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
