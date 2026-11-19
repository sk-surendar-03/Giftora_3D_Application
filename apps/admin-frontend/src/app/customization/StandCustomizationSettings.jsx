import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import {
  fetchStandPricing,
  updateStandPricing,
  fetchCustomizerShipping,
  updateCustomizerShipping,
} from '../../features/settings/settingsApi.js'

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

// ─── Shipping Manager (Matching Name Keychain) ─────────────────────────────────
function ShippingManager({ methods, onChange, onAutoSave }) {
  const [draft, setDraft] = useState({ name: '', price: '', days: '' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [autoStatus, setAutoStatus] = useState(null)

  async function commit(newMethods) {
    onChange(newMethods)
    if (!onAutoSave) return
    setAutoSaving(true)
    setAutoStatus(null)
    try {
      await onAutoSave(newMethods)
      setAutoStatus('ok')
      setTimeout(() => setAutoStatus(null), 2000)
    } catch {
      setAutoStatus('err')
      setTimeout(() => setAutoStatus(null), 3000)
    }
    setAutoSaving(false)
  }

  function add() {
    const name = draft.name.trim()
    const price = parseFloat(draft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    commit([...methods, { name, priceCents: Math.round(price * 100), estimatedDays: draft.days.trim() || undefined }])
    setDraft({ name: '', price: '', days: '' })
  }

  function remove(i) {
    commit(methods.filter((_, idx) => idx !== i))
  }

  function startEdit(i) {
    setEditIndex(i)
    setEditDraft({
      name: methods[i].name,
      price: String(methods[i].priceCents / 100),
      days: methods[i].estimatedDays || '',
    })
  }

  function saveEdit() {
    const name = editDraft.name.trim()
    const price = parseFloat(editDraft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    commit(
      methods.map((m, i) =>
        i === editIndex
          ? { name, priceCents: Math.round(price * 100), estimatedDays: editDraft.days.trim() || undefined }
          : m
      )
    )
    setEditIndex(null)
    setEditDraft(null)
  }

  return (
    <div className="space-y-3">
      {methods.length > 0 && (
        <div className="space-y-2">
          {methods.map((m, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-control border border-line bg-alt p-3">
              {editIndex === i ? (
                <>
                  <input
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                    placeholder="Method name"
                    autoFocus
                  />
                  <div className="relative w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editDraft.price}
                      onChange={(e) => setEditDraft((p) => ({ ...p, price: e.target.value }))}
                      className="w-full pl-6 pr-2 py-1.5 rounded-control border border-line bg-surface text-xs font-mono text-ink focus:border-accent focus:outline-none"
                    />
                  </div>
                  <input
                    value={editDraft.days}
                    onChange={(e) => setEditDraft((p) => ({ ...p, days: e.target.value }))}
                    className="w-28 rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                    placeholder="e.g. 3-5 days"
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={autoSaving}
                    className="rounded-control bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent hover:bg-accent-dark transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {autoSaving ? '…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIndex(null)}
                    className="text-xs text-muted hover:text-ink px-1.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-ink">{m.name}</span>
                    {m.estimatedDays && (
                      <span className="ml-2 text-[11px] text-muted font-medium">({m.estimatedDays})</span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-accent font-mono mr-2">
                    {m.priceCents === 0 ? 'FREE' : `₹${(m.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="rounded border border-line bg-surface px-2 py-1 text-xs text-muted hover:text-accent hover:border-accent cursor-pointer"
                    title="Edit method"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={autoSaving}
                    className="rounded border border-line bg-surface px-2 py-1 text-xs text-muted hover:text-danger hover:border-danger cursor-pointer disabled:opacity-50"
                    title="Delete method"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new method input row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
        <input
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Method name (e.g. Express Courier)"
          className="flex-1 min-w-[160px] rounded-control border border-line bg-alt px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <div className="relative w-28">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">₹</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.price}
            onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
            placeholder="0.00"
            className="w-full pl-6 pr-2.5 py-2 rounded-control border border-line bg-alt text-xs font-mono text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <input
          value={draft.days}
          onChange={(e) => setDraft((p) => ({ ...p, days: e.target.value }))}
          placeholder="Delivery time (e.g. 2-3 days)"
          className="w-36 rounded-control border border-line bg-alt px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.name.trim() || draft.price === '' || autoSaving}
          className="rounded-control bg-accent px-4 py-2 text-xs font-semibold text-on-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0 shadow-xs"
        >
          {autoSaving ? 'Adding…' : '+ Add Method'}
        </button>
      </div>

      {autoStatus && (
        <p className={`text-[11px] font-medium pt-1 ${autoStatus === 'ok' ? 'text-emerald-500' : 'text-danger'}`}>
          {autoStatus === 'ok' ? '✓ Shipping settings saved to database' : '✗ Save failed — please try again'}
        </p>
      )}
    </div>
  )
}

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

  // Shipping Methods State
  const [shippingMethods, setShippingMethods] = useState([])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([
      fetchStandPricing(),
      fetchCustomizerShipping().catch(() => []),
    ])
      .then(([standData, shippingData]) => {
        if (!mounted) return

        // Set Stand Pricing
        if (standData) {
          if (standData.pricePerCm3Cents != null) {
            setPricePerCm3Rupees((standData.pricePerCm3Cents / 100).toFixed(2))
          }
          if (standData.categories) {
            const next = {}
            for (const cat of CATEGORY_METADATA) {
              const rawCents = standData.categories[cat.id]?.basePriceCents
              next[cat.id] = rawCents != null ? Math.round(rawCents / 100) : cat.defaultRupees
            }
            setCategoryPrices(next)
          }
        }

        // Set Shipping Methods
        if (Array.isArray(shippingData)) {
          setShippingMethods(shippingData)
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

      await Promise.all([
        updateStandPricing({
          pricePerCm3Cents,
          categories: categoriesPayload,
        }),
        updateCustomizerShipping(shippingMethods),
      ])

      setBanner({ type: 'success', message: 'Phone & Pen Stand pricing and shipping settings saved successfully.' })
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
            Configure volume-based pricing rates, category base pricing tiers, and delivery shipping methods.
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

          {/* Section 3: Shipping & Delivery Methods (Replaces old static specs) */}
          <div className="rounded-card border border-line bg-surface p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-line">
              <h2 className="font-display text-base font-semibold text-ink">3. Shipping & Delivery Methods</h2>
              <p className="text-xs text-muted mt-0.5">
                Configure shipping tiers and delivery rates that automatically reflect in the customer 3D customiser.
              </p>
            </div>

            <ShippingManager
              methods={shippingMethods}
              onChange={setShippingMethods}
              onAutoSave={updateCustomizerShipping}
            />
          </div>
        </form>
      )}
    </div>
  )
}
