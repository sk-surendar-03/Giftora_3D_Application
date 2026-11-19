import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import {
  fetchNameplatePricing,
  updateNameplatePricing,
  fetchCustomizerShipping,
  updateCustomizerShipping,
} from '../../features/settings/settingsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

const TYPE_METADATA = [
  { id: 'desk', name: 'Desk Nameplates', defaultRupees: 550, desc: 'Freestanding angled executive and office blocks.' },
  { id: 'door', name: 'Door Nameplates', defaultRupees: 650, desc: 'Flush-mount plaques for apartments and studios.' },
  { id: 'wall', name: 'Wall-Mounted Signs', defaultRupees: 750, desc: 'Keyhole and screw-mounted architectural signs.' },
  { id: 'kids', name: "Kids' Room Nameplates", defaultRupees: 600, desc: 'Playful cloud and star plaques with thick 3D letters.' },
  { id: 'business', name: 'Business Signs', defaultRupees: 850, desc: 'Dual-color corporate and reception desk signage.' },
  { id: 'led', name: 'LED-Style Signs', defaultRupees: 950, desc: 'Translucent diffuser rim with glowing channel.' },
  { id: 'decorative-3d', name: 'Decorative 3D Text', defaultRupees: 500, desc: 'Bold self-supporting extruded letter sculptures.' },
  { id: 'wedding', name: 'Wedding & Event', defaultRupees: 700, desc: 'Script monograms and sweetheart table plaques.' },
  { id: 'house-number', name: 'House Number Plates', defaultRupees: 650, desc: 'High-contrast weather-ready address plates.' },
  { id: 'gaming', name: 'Gaming Desk Tags', defaultRupees: 600, desc: 'Angular chamfered tags with esports accents.' },
]

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
      price: (methods[i].priceCents / 100).toFixed(2).replace(/\.00$/, ''),
      days: methods[i].estimatedDays ?? '',
    })
  }

  function saveEdit() {
    if (editIndex === null || !editDraft) return
    const name = editDraft.name.trim()
    const price = parseFloat(editDraft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    const next = [...methods]
    next[editIndex] = { name, priceCents: Math.round(price * 100), estimatedDays: editDraft.days.trim() || undefined }
    commit(next)
    setEditIndex(null)
    setEditDraft(null)
  }

  function cancelEdit() {
    setEditIndex(null)
    setEditDraft(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Configure delivery tiers for Nameplate orders. Saved methods appear in the customizer checkout card.
        </p>
        {autoSaving && <span className="text-xs text-amber-400 animate-pulse font-medium">Saving shipping…</span>}
        {autoStatus === 'ok' && <span className="text-xs text-emerald-400 font-medium">✓ Shipping saved</span>}
        {autoStatus === 'err' && <span className="text-xs text-rose-400 font-medium">Failed to save shipping</span>}
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Method Name</th>
              <th className="px-4 py-3 text-left">Delivery Time</th>
              <th className="px-4 py-3 text-right">Price (₹)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 bg-slate-900/40">
            {methods.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500 italic">
                  No shipping methods defined. Free standard delivery will apply by default.
                </td>
              </tr>
            )}
            {methods.map((m, i) => (
              <tr key={m.name || i} className="hover:bg-slate-800/30 transition-colors">
                {editIndex === i ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editDraft.name}
                        onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                        className="w-full rounded bg-slate-800 border border-slate-600 px-2.5 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editDraft.days}
                        onChange={(e) => setEditDraft({ ...editDraft, days: e.target.value })}
                        className="w-full rounded bg-slate-800 border border-slate-600 px-2.5 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                        placeholder="e.g. 2-3 business days"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editDraft.price}
                        onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
                        className="w-24 text-right rounded bg-slate-800 border border-slate-600 px-2.5 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button type="button" onClick={saveEdit} className="text-xs text-amber-400 hover:text-amber-300 font-medium">Save</button>
                      <button type="button" onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-300">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-white">{m.name}</td>
                    <td className="px-4 py-3 text-slate-400">{m.estimatedDays || <span className="text-slate-600 italic">—</span>}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-amber-300">
                      {m.priceCents === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `₹${(m.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button type="button" onClick={() => startEdit(i)} className="text-xs text-slate-400 hover:text-amber-300 transition-colors">Edit</button>
                      <button type="button" onClick={() => remove(i)} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">Remove</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-lg border border-dashed border-slate-700 bg-slate-800/20">
        <input
          type="text"
          placeholder="Method name (e.g. Quick Delivery)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="flex-1 min-w-[160px] rounded bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <input
          type="text"
          placeholder="Delivery time (optional)"
          value={draft.days}
          onChange={(e) => setDraft({ ...draft, days: e.target.value })}
          className="flex-1 min-w-[140px] rounded bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-sm font-semibold">₹</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            className="w-24 rounded bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-amber-400"
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors"
        >
          Add Method
        </button>
      </div>
    </div>
  )
}

export default function NameplateCustomizationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [pricePerCm3Rupees, setPricePerCm3Rupees] = useState('1.20')
  const [ledGlowSurchargeRupees, setLedGlowSurchargeRupees] = useState('150.00')
  const [layeredBackingSurchargeRupees, setLayeredBackingSurchargeRupees] = useState('100.00')
  const [typeBasePrices, setTypeBasePrices] = useState({})
  const [shippingMethods, setShippingMethods] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchNameplatePricing(), fetchCustomizerShipping()])
      .then(([pricing, methods]) => {
        if (cancelled) return
        if (pricing) {
          setPricePerCm3Rupees(((pricing.pricePerCm3Cents ?? 120) / 100).toFixed(2))
          setLedGlowSurchargeRupees(((pricing.ledGlowSurchargeCents ?? 15000) / 100).toFixed(2))
          setLayeredBackingSurchargeRupees(((pricing.layeredBackingSurchargeCents ?? 10000) / 100).toFixed(2))
          const bases = {}
          for (const t of TYPE_METADATA) {
            const cents = pricing.types?.[t.id]?.basePriceCents ?? t.defaultRupees * 100
            bases[t.id] = (cents / 100).toFixed(2).replace(/\.00$/, '')
          }
          setTypeBasePrices(bases)
        }
        if (Array.isArray(methods)) setShippingMethods(methods)
      })
      .catch((err) => {
        if (!cancelled) setError(extractError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  function handleTypeBasePriceChange(id, val) {
    setTypeBasePrices((prev) => ({ ...prev, [id]: val }))
  }

  async function handleSave(e) {
    e?.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const pricePerCm3 = parseFloat(pricePerCm3Rupees)
    if (!Number.isFinite(pricePerCm3) || pricePerCm3 < 0) {
      setError('Material rate per cm³ must be a non-negative number.')
      setSaving(false)
      return
    }

    const ledGlow = parseFloat(ledGlowSurchargeRupees)
    const layeredBacking = parseFloat(layeredBackingSurchargeRupees)

    const typesPayload = {}
    for (const t of TYPE_METADATA) {
      const val = parseFloat(typeBasePrices[t.id])
      if (!Number.isFinite(val) || val < 0) {
        setError(`Base price for ${t.name} must be a valid non-negative number.`)
        setSaving(false)
        return
      }
      typesPayload[t.id] = { basePriceCents: Math.round(val * 100) }
    }

    try {
      await updateNameplatePricing({
        pricePerCm3Cents: Math.round(pricePerCm3 * 100),
        ledGlowSurchargeCents: Math.round(ledGlow * 100),
        layeredBackingSurchargeCents: Math.round(layeredBacking * 100),
        types: typesPayload,
      })
      await updateCustomizerShipping(shippingMethods)
      setSuccess('Nameplate pricing configuration and shipping rates saved successfully.')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/customization" className="text-xs text-slate-400 hover:text-amber-400 transition-colors">
              ← Customization Hub
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Custom Nameplate Studio Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage archetype base prices, volumetric PLA material rates, feature surcharges, and shipping tiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.jasvel3dmakers.co.in/customise/nameplate"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-amber-400 hover:text-amber-300 transition-colors"
          >
            Open Live Studio ↗
          </a>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {error && <Banner type="error">{error}</Banner>}
      {success && <Banner type="success">{success}</Banner>}

      {/* Section 1: Volumetric & Feature Rates */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">1. Volumetric & Feature Surcharges</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pricing is calculated on the server from measured 3D mesh volume plus optional feature add-ons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4 space-y-2">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">
              PLA Rate per cm³ (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={pricePerCm3Rupees}
                onChange={(e) => setPricePerCm3Rupees(e.target.value)}
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">Default: ₹1.20/cm³. Evaluated server-side on stored binary STL.</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4 space-y-2">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">
              LED Glow Channel Surcharge (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={ledGlowSurchargeRupees}
                onChange={(e) => setLedGlowSurchargeRupees(e.target.value)}
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">Added when customer enables translucent diffuser rim.</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4 space-y-2">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">
              Layered Backing Surcharge (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={layeredBackingSurchargeRupees}
                onChange={(e) => setLayeredBackingSurchargeRupees(e.target.value)}
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">Added when layered background plate is selected.</p>
          </div>
        </div>
      </div>

      {/* Section 2: Plate Archetype Base Pricing */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">2. Archetype Base Pricing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Starting price for each of the 10 Nameplate archetypes before volumetric material displacement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {TYPE_METADATA.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-4 p-4 rounded-lg border border-slate-800 bg-slate-800/30 hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{t.name}</div>
                <div className="text-xs text-slate-400 truncate">{t.desc}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={typeBasePrices[t.id] ?? ''}
                  onChange={(e) => handleTypeBasePriceChange(t.id, e.target.value)}
                  className="w-24 rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-sm text-white font-mono text-right focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Shipping & Delivery Tiers */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">3. Shipping & Delivery Tiers</h2>
          <p className="text-xs text-slate-400 mt-1">
            Shipping options reflect dynamically in the Nameplate customizer and are verified at checkout.
          </p>
        </div>

        <ShippingManager
          methods={shippingMethods}
          onChange={setShippingMethods}
          onAutoSave={updateCustomizerShipping}
        />
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
