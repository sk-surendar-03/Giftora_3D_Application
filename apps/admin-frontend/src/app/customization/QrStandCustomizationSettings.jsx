import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import {
  fetchQrStandPricing,
  updateQrStandPricing,
  fetchCustomizerShipping,
  updateCustomizerShipping,
} from '../../features/settings/settingsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

export const QR_STAND_TEMPLATES_METADATA = [
  { id: 'classic_upright', name: 'Classic Upright QR Stand', category: 'Desk', defaultRupees: 499, desc: 'Single-sided vertical stand with weighted rectangular base.' },
  { id: 'angled_desk', name: 'Angled Desk QR Stand', category: 'Desk', defaultRupees: 549, desc: 'Ergonomic 65° viewing angle for countertops and reception desks.' },
  { id: 'rounded_rect', name: 'Rounded Rectangle QR Stand', category: 'Retail', defaultRupees: 499, desc: 'Smooth rounded border plaque with integrated slot stand.' },
  { id: 'arch_shaped', name: 'Arch QR Stand', category: 'Modern', defaultRupees: 599, desc: 'Contemporary curved top arch silhouette with dual-tone face.' },
  { id: 'circular_display', name: 'Circular QR Plaque', category: 'Creative', defaultRupees: 549, desc: 'Radial disc design with centered QR matrix and circular base.' },
  { id: 'square_block', name: 'Square Block Display', category: 'Minimalist', defaultRupees: 449, desc: 'Compact freestanding solid monolithic block.' },
  { id: 'double_sided', name: 'Double-Sided Tent Stand', category: 'Retail', defaultRupees: 699, desc: 'Dual QR displays front and rear (e.g. Payment + Social).' },
  { id: 'triple_display', name: 'Tri-Panel QR Prism', category: 'Hospitality', defaultRupees: 899, desc: 'Three-sided prism pillar for 360° multi-service access.' },
  { id: 'restaurant_tent', name: 'Restaurant Table Tent', category: 'Hospitality', defaultRupees: 599, desc: 'Angled menu and order-at-table stand with condiment notch.' },
  { id: 'social_media', name: 'Multi-Badge Social Stand', category: 'Creative', defaultRupees: 549, desc: 'Branded layout with social badges, handle, and QR.' },
  { id: 'business_plaque', name: 'Executive Business Plaque', category: 'Modern', defaultRupees: 649, desc: 'Premium wide-format plaque for corporate desks and events.' },
  { id: 'mini_keychain', name: 'Portable QR Keychain', category: 'Compact', defaultRupees: 199, desc: 'Pocket-sized scannable QR fob with keyring loop attachment.' },
]

const DEFAULT_SURCHARGES = {
  pricePerCm3Rupees: '1.20',
  centerLogoRupees: '150.00',
  inlayModeRupees: '100.00',
  multiQrRupees: '150.00',
}

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
          Configure delivery tiers for QR Stand orders. Saved methods appear in the customizer checkout card.
        </p>
        {autoSaving && <span className="text-xs text-amber-400 animate-pulse font-medium">Saving shipping…</span>}
        {autoStatus === 'ok' && <span className="text-xs text-emerald-400 font-medium">✓ Shipping saved</span>}
        {autoStatus === 'err' && <span className="text-xs text-rose-400 font-medium">Failed to save shipping</span>}
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        {methods.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No shipping methods configured. Add one below.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left">Method Name</th>
                <th className="px-4 py-2.5 text-left">Estimated Days</th>
                <th className="px-4 py-2.5 text-right">Price (₹)</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 bg-slate-900/40">
              {methods.map((m, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  {editIndex === i ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editDraft.name}
                          onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                          className="w-full rounded bg-slate-800 border border-slate-600 px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="e.g. 3-5 days"
                          value={editDraft.days}
                          onChange={(e) => setEditDraft({ ...editDraft, days: e.target.value })}
                          className="w-full rounded bg-slate-800 border border-slate-600 px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editDraft.price}
                            onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
                            className="w-20 rounded bg-slate-800 border border-slate-600 px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-xs text-slate-400 hover:text-slate-300 font-medium"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 font-medium text-white">{m.name}</td>
                      <td className="px-4 py-2.5 text-slate-400">{m.estimatedDays ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-amber-300">
                        ₹{(m.priceCents / 100).toFixed(2).replace(/\.00$/, '')}
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => startEdit(i)}
                          className="text-xs text-slate-400 hover:text-amber-400 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add new shipping method */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="New method name (e.g. Express Delivery)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="flex-1 min-w-[200px] rounded bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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

export default function QrStandCustomizationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [pricePerCm3Rupees, setPricePerCm3Rupees] = useState(DEFAULT_SURCHARGES.pricePerCm3Rupees)
  const [centerLogoRupees, setCenterLogoRupees] = useState(DEFAULT_SURCHARGES.centerLogoRupees)
  const [inlayModeRupees, setInlayModeRupees] = useState(DEFAULT_SURCHARGES.inlayModeRupees)
  const [multiQrRupees, setMultiQrRupees] = useState(DEFAULT_SURCHARGES.multiQrRupees)
  const [templateBasePrices, setTemplateBasePrices] = useState({})
  const [shippingMethods, setShippingMethods] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchQrStandPricing(), fetchCustomizerShipping()])
      .then(([pricing, methods]) => {
        if (cancelled) return
        if (pricing) {
          setPricePerCm3Rupees(((pricing.pricePerCm3Cents ?? 120) / 100).toFixed(2))
          setCenterLogoRupees(((pricing.addOns?.centerLogoSurchargeCents ?? 15000) / 100).toFixed(2))
          setInlayModeRupees(((pricing.addOns?.inlayModeSurchargeCents ?? 10000) / 100).toFixed(2))
          setMultiQrRupees(((pricing.addOns?.multiQrSurchargeCents ?? 15000) / 100).toFixed(2))

          const bases = {}
          for (const t of QR_STAND_TEMPLATES_METADATA) {
            const cents = pricing.templates?.[t.id]?.basePriceCents ?? t.defaultRupees * 100
            bases[t.id] = (cents / 100).toFixed(2).replace(/\.00$/, '')
          }
          setTemplateBasePrices(bases)
        }
        if (Array.isArray(methods)) setShippingMethods(methods)
      })
      .catch((err) => {
        if (!cancelled) setError(extractError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleTemplateBasePriceChange(id, val) {
    setTemplateBasePrices((prev) => ({ ...prev, [id]: val }))
  }

  function handleResetDefaults() {
    setPricePerCm3Rupees(DEFAULT_SURCHARGES.pricePerCm3Rupees)
    setCenterLogoRupees(DEFAULT_SURCHARGES.centerLogoRupees)
    setInlayModeRupees(DEFAULT_SURCHARGES.inlayModeRupees)
    setMultiQrRupees(DEFAULT_SURCHARGES.multiQrRupees)
    const bases = {}
    for (const t of QR_STAND_TEMPLATES_METADATA) {
      bases[t.id] = String(t.defaultRupees)
    }
    setTemplateBasePrices(bases)
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

    const centerLogo = parseFloat(centerLogoRupees)
    if (!Number.isFinite(centerLogo) || centerLogo < 0) {
      setError('Center logo surcharge must be a non-negative number.')
      setSaving(false)
      return
    }

    const inlayMode = parseFloat(inlayModeRupees)
    if (!Number.isFinite(inlayMode) || inlayMode < 0) {
      setError('Inlay mode surcharge must be a non-negative number.')
      setSaving(false)
      return
    }

    const multiQr = parseFloat(multiQrRupees)
    if (!Number.isFinite(multiQr) || multiQr < 0) {
      setError('Double-sided / multi-QR surcharge must be a non-negative number.')
      setSaving(false)
      return
    }

    const templatesPayload = {}
    for (const t of QR_STAND_TEMPLATES_METADATA) {
      const val = parseFloat(templateBasePrices[t.id])
      if (!Number.isFinite(val) || val < 0) {
        setError(`Base price for ${t.name} must be a valid non-negative number.`)
        setSaving(false)
        return
      }
      templatesPayload[t.id] = { basePriceCents: Math.round(val * 100) }
    }

    try {
      await updateQrStandPricing({
        pricePerCm3Cents: Math.round(pricePerCm3 * 100),
        templates: templatesPayload,
        addOns: {
          centerLogoSurchargeCents: Math.round(centerLogo * 100),
          inlayModeSurchargeCents: Math.round(inlayMode * 100),
          multiQrSurchargeCents: Math.round(multiQr * 100),
        },
      })
      await updateCustomizerShipping(shippingMethods)
      setSuccess('QR Stand pricing configuration and shipping rates saved successfully.')
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
      {/* Header & Studio Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/customization" className="text-xs text-slate-400 hover:text-amber-400 transition-colors">
              ← Customization Hub
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Custom QR Stand Studio Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure base prices for 12 QR stand templates, volumetric PLA material rate, add-on feature surcharges, and delivery tiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            Reset Defaults
          </button>
          <a
            href="https://www.jasvel3dmakers.co.in/customise/qr-stand"
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

      {/* Navigation Switcher Pills (Keychain, Nameplate, QR Stand — NO Phone & Pen Stand) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Link
          to="/customization/name-keychain"
          className="rounded-full px-3.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Name Keychain
        </Link>
        <Link
          to="/customization/nameplate"
          className="rounded-full px-3.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Custom Nameplate
        </Link>
        <span className="rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3.5 py-1 text-xs font-semibold">
          QR Stand
        </span>
      </div>

      {error && <Banner type="error">{error}</Banner>}
      {success && <Banner type="success">{success}</Banner>}

      {/* Section 1: Volumetric & Add-on Surcharges */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">1. Volumetric & Feature Surcharges</h2>
          <p className="text-xs text-slate-400 mt-1">
            Volumetric material rate is calculated authoritatively on the server from the uploaded binary STL volume.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-1">
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
              Center Logo Surcharge (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={centerLogoRupees}
                onChange={(e) => setCenterLogoRupees(e.target.value)}
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">Added when custom brand logo is embedded inside QR matrix.</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4 space-y-2">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">
              Multi-Color Inlay Surcharge (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={inlayModeRupees}
                onChange={(e) => setInlayModeRupees(e.target.value)}
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">Added when dual-extrusion flush inlay print mode is selected.</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-4 space-y-2">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block">
              Double-Sided / Multi-QR Surcharge (₹)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={multiQrRupees}
                onChange={(e) => setMultiQrRupees(e.target.value)}
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400">Added for secondary QR displays (e.g. tent stands and prism displays).</p>
          </div>
        </div>
      </div>

      {/* Section 2: Template Base Pricing (12 Templates) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">2. Template Base Pricing (12 Templates)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Starting base price for each of the 12 QR Stand templates before volumetric displacement and add-on surcharges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {QR_STAND_TEMPLATES_METADATA.map((t) => (
            <div
              key={t.id}
              className="flex flex-col justify-between p-4 rounded-lg border border-slate-800 bg-slate-800/30 hover:border-slate-700 transition-colors space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-white truncate">{t.name}</span>
                  <span className="rounded bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase tracking-wider shrink-0">
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{t.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono">Def: ₹{t.defaultRupees}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-400 font-semibold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={templateBasePrices[t.id] ?? ''}
                    onChange={(e) => handleTemplateBasePriceChange(t.id, e.target.value)}
                    className="w-24 rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-sm text-white font-mono text-right focus:border-amber-400 focus:outline-none"
                  />
                </div>
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
            Shipping options reflect dynamically in the QR Stand customizer and are verified at checkout.
          </p>
        </div>

        <ShippingManager
          methods={shippingMethods}
          onChange={setShippingMethods}
          onAutoSave={updateCustomizerShipping}
        />
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          Reset Defaults
        </button>
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
