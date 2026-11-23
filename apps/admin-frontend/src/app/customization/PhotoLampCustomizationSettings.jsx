import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import {
  fetchPhotoLampPricing,
  updatePhotoLampPricing,
  fetchCustomizerShipping,
  updateCustomizerShipping,
} from '../../features/settings/settingsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

export const PHOTO_LAMP_ARCHETYPES_METADATA = [
  { id: 'cylinder', name: 'Cylindrical Photo Lamp', category: 'Classic', defaultRupees: 450, desc: '360° cylindrical panoramic lithophane shade with weighted base.' },
  { id: 'rectangle', name: 'Rectangular Light Box', category: 'Desk', defaultRupees: 399, desc: 'Flat relief photo panel with beveled frame and desk kickstand.' },
  { id: 'four_sided', name: 'Four-Sided Memory Lamp', category: 'Tower', defaultRupees: 599, desc: 'Four separate photo panels joined at precision 90° mitered vertical seams.' },
  { id: 'heart', name: 'Heart-Shaped Photo Lamp', category: 'Romantic', defaultRupees: 550, desc: 'Curved parametric cardioid profile with glowing center.' },
  { id: 'curved', name: 'Curved Portrait Lamp', category: 'Portrait', defaultRupees: 450, desc: '110° self-standing arc lithophane portrait on curved footplate.' },
  { id: 'moon', name: 'Moon Sphere Lamp', category: 'Spherical', defaultRupees: 650, desc: '360° spherical panoramic textured globe with recessed base cavity.' },
  { id: 'hexagonal', name: 'Hexagonal Lantern', category: 'Lantern', defaultRupees: 699, desc: '6-sided faceted prismatic lantern displaying up to six photos.' },
  { id: 'circular', name: 'Circular Medallion Plaque', category: 'Desk', defaultRupees: 420, desc: 'Concentric circular relief disc with vertical desk slotted base.' },
  { id: 'rotating', name: 'Rotating Carousel Lamp', category: 'Carousel', defaultRupees: 750, desc: 'Triangular curved photo carousel with smooth central pivot bearing.' },
]

const DEFAULT_ADDONS = {
  pricePerCm3Rupees: '0.40',
  basePuckKitRupees: '99.00',
  engravedPlinthRupees: '35.00',
  extraPhotoSlotRupees: '25.00',
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
      setAutoStatus('saved')
      setTimeout(() => setAutoStatus(null), 2500)
    } catch {
      setAutoStatus('error')
      setTimeout(() => setAutoStatus(null), 3500)
    } finally {
      setAutoSaving(false)
    }
  }

  function add() {
    const name = draft.name.trim()
    const price = parseFloat(draft.price)
    if (!name || isNaN(price) || price < 0) return
    const priceCents = Math.round(price * 100)
    const newMethods = [...methods, { name, priceCents, estimatedDays: draft.days.trim() || undefined }]
    setDraft({ name: '', price: '', days: '' })
    commit(newMethods)
  }

  function remove(index) {
    commit(methods.filter((_, i) => i !== index))
  }

  function startEdit(i) {
    setEditIndex(i)
    setEditDraft({
      name: methods[i].name,
      price: (methods[i].priceCents / 100).toFixed(2),
      days: methods[i].estimatedDays ?? '',
    })
  }

  function saveEdit() {
    const name = editDraft.name.trim()
    const price = parseFloat(editDraft.price)
    if (!name || isNaN(price) || price < 0) return
    const updated = methods.map((m, i) =>
      i === editIndex ? { name, priceCents: Math.round(price * 100), estimatedDays: editDraft.days.trim() || undefined } : m
    )
    setEditIndex(null)
    setEditDraft(null)
    commit(updated)
  }

  function cancelEdit() {
    setEditIndex(null)
    setEditDraft(null)
  }

  return (
    <div className="space-y-4">
      {methods.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-2.5">Method Name</th>
                <th className="px-4 py-2.5">Est. Delivery</th>
                <th className="px-4 py-2.5 text-right">Fee (₹)</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 bg-slate-900/60">
              {methods.map((m, i) => (
                <tr key={i}>
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
                          value={editDraft.days}
                          onChange={(e) => setEditDraft({ ...editDraft, days: e.target.value })}
                          className="w-full rounded bg-slate-800 border border-slate-600 px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
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
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">No customizer shipping methods defined. Customers will see free shipping.</p>
      )}

      {/* Add shipping form */}
      <div className="flex flex-wrap gap-2 items-end pt-1">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-400 mb-1">Method Name</label>
          <input
            type="text"
            placeholder="e.g. Express Courier"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="w-28 min-w-[100px]">
          <label className="block text-xs font-medium text-slate-400 mb-1">Fee (₹)</label>
          <div className="flex items-center rounded bg-slate-800 border border-slate-700 px-2 focus-within:border-amber-400">
            <span className="text-slate-400 text-xs mr-1">₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              className="w-full bg-transparent py-1.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>
        <div className="w-32 min-w-[110px]">
          <label className="block text-xs font-medium text-slate-400 mb-1">Est. Days</label>
          <input
            type="text"
            placeholder="e.g. 2-3 days"
            value={draft.days}
            onChange={(e) => setDraft({ ...draft, days: e.target.value })}
            className="w-full rounded bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs font-medium text-white transition-colors h-[34px]"
        >
          Add Method
        </button>
      </div>

      {autoSaving && <p className="text-xs text-amber-300">Saving shipping methods...</p>}
      {autoStatus === 'saved' && <p className="text-xs text-emerald-400">Shipping methods saved.</p>}
      {autoStatus === 'error' && <p className="text-xs text-rose-400">Failed to save shipping methods.</p>}
    </div>
  )
}

export default function PhotoLampCustomizationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState(null)

  // 9 Archetype Base Prices in Rupees
  const [archetypePrices, setArchetypePrices] = useState(() => {
    const initial = {}
    for (const t of PHOTO_LAMP_ARCHETYPES_METADATA) {
      initial[t.id] = String(t.defaultRupees)
    }
    return initial
  })

  // Volumetric and Add-on rates
  const [pricePerCm3Rupees, setPricePerCm3Rupees] = useState(DEFAULT_ADDONS.pricePerCm3Rupees)
  const [basePuckKitRupees, setBasePuckKitRupees] = useState(DEFAULT_ADDONS.basePuckKitRupees)
  const [engravedPlinthRupees, setEngravedPlinthRupees] = useState(DEFAULT_ADDONS.engravedPlinthRupees)
  const [extraPhotoSlotRupees, setExtraPhotoSlotRupees] = useState(DEFAULT_ADDONS.extraPhotoSlotRupees)

  // Shipping methods
  const [shippingMethods, setShippingMethods] = useState([])

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const [pricingRes, shippingRes] = await Promise.all([
          fetchPhotoLampPricing().catch(() => null),
          fetchCustomizerShipping().catch(() => []),
        ])

        if (cancelled) return

        if (pricingRes) {
          if (pricingRes.pricePerCm3Cents !== undefined) {
            setPricePerCm3Rupees((pricingRes.pricePerCm3Cents / 100).toFixed(2))
          }
          if (pricingRes.templates) {
            setArchetypePrices((prev) => {
              const updated = { ...prev }
              for (const [id, t] of Object.entries(pricingRes.templates)) {
                if (t?.basePriceCents !== undefined) {
                  updated[id] = (t.basePriceCents / 100).toFixed(2).replace(/\.00$/, '')
                }
              }
              return updated
            })
          }
          if (pricingRes.addOns) {
            if (pricingRes.addOns.basePuckKitSurchargeCents !== undefined) {
              setBasePuckKitRupees((pricingRes.addOns.basePuckKitSurchargeCents / 100).toFixed(2))
            }
            if (pricingRes.addOns.engravedPlinthSurchargeCents !== undefined) {
              setEngravedPlinthRupees((pricingRes.addOns.engravedPlinthSurchargeCents / 100).toFixed(2))
            }
            if (pricingRes.addOns.extraPhotoSlotSurchargeCents !== undefined) {
              setExtraPhotoSlotRupees((pricingRes.addOns.extraPhotoSlotSurchargeCents / 100).toFixed(2))
            }
          }
        }

        if (Array.isArray(shippingRes)) {
          setShippingMethods(shippingRes)
        }
      } catch (err) {
        if (!cancelled) setBanner({ type: 'error', message: extractError(err) })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  function handlePriceChange(id, value) {
    setArchetypePrices((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSavePricing(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)

    try {
      const volRate = parseFloat(pricePerCm3Rupees)
      if (isNaN(volRate) || volRate < 0) {
        throw new Error('Price per cm³ must be a non-negative number.')
      }

      const templatesPayload = {}
      for (const t of PHOTO_LAMP_ARCHETYPES_METADATA) {
        const val = parseFloat(archetypePrices[t.id])
        if (isNaN(val) || val < 0) {
          throw new Error(`Base price for "${t.name}" must be a non-negative number.`)
        }
        templatesPayload[t.id] = { basePriceCents: Math.round(val * 100) }
      }

      const puckFee = parseFloat(basePuckKitRupees)
      const engraveFee = parseFloat(engravedPlinthRupees)
      const extraPhotoFee = parseFloat(extraPhotoSlotRupees)

      const addOnsPayload = {
        basePuckKitSurchargeCents: Math.round((isNaN(puckFee) || puckFee < 0 ? 99 : puckFee) * 100),
        engravedPlinthSurchargeCents: Math.round((isNaN(engraveFee) || engraveFee < 0 ? 35 : engraveFee) * 100),
        extraPhotoSlotSurchargeCents: Math.round((isNaN(extraPhotoFee) || extraPhotoFee < 0 ? 25 : extraPhotoFee) * 100),
      }

      await updatePhotoLampPricing({
        pricePerCm3Cents: Math.round(volRate * 100),
        templates: templatesPayload,
        addOns: addOnsPayload,
      })

      setBanner({ type: 'success', message: 'Photo Lamp pricing settings saved successfully.' })
    } catch (err) {
      setBanner({ type: 'error', message: extractError(err) })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Loading Photo Lamp customization settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link to="/customization" className="hover:text-amber-400 transition-colors">
            Customization Hub
          </Link>
          <span>/</span>
          <span className="text-white font-medium">3D Lithophane Photo Lamp</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              3D Lithophane Photo Lamp Settings
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Configure archetype base pricing, volumetric resin/filament rates, LED base kits, and customization surcharges.
            </p>
          </div>
          <a
            href="https://www.jasvel3dmakers.co.in/customise/photo-lamp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
          >
            <span>Open Customer Studio</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>

      {banner && <Banner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />}

      <form onSubmit={handleSavePricing} className="space-y-6">
        {/* Archetype Base Prices Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">1. Lamp Archetype Base Prices</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set the starting base price for each of the 9 high-resolution lithophane lamp geometries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHOTO_LAMP_ARCHETYPES_METADATA.map((arch) => (
              <div
                key={arch.id}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{arch.name}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                      {arch.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{arch.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Base Price:</span>
                  <div className="flex items-center rounded bg-slate-800 border border-slate-700 px-2 focus-within:border-amber-400">
                    <span className="text-slate-400 text-xs mr-1">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={archetypePrices[arch.id] ?? ''}
                      onChange={(e) => handlePriceChange(arch.id, e.target.value)}
                      className="w-20 bg-transparent py-1 text-sm font-mono text-white text-right focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volumetric & Add-on Pricing Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">2. Material & Add-on Surcharges</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative formula: Total = Base Price + (Solid Volume × Rate/cm³) + Add-ons.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Volumetric Rate (₹/cm³)
              </label>
              <p className="text-[11px] text-slate-500">Material density fee per solid cm³</p>
              <div className="flex items-center rounded bg-slate-800 border border-slate-700 px-2 mt-2 focus-within:border-amber-400">
                <span className="text-slate-400 text-xs mr-1">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  value={pricePerCm3Rupees}
                  onChange={(e) => setPricePerCm3Rupees(e.target.value)}
                  className="w-full bg-transparent py-1.5 text-sm font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                LED Puck Base Kit (₹)
              </label>
              <p className="text-[11px] text-slate-500">3D printed base + USB LED puck</p>
              <div className="flex items-center rounded bg-slate-800 border border-slate-700 px-2 mt-2 focus-within:border-amber-400">
                <span className="text-slate-400 text-xs mr-1">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={basePuckKitRupees}
                  onChange={(e) => setBasePuckKitRupees(e.target.value)}
                  className="w-full bg-transparent py-1.5 text-sm font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Plinth Text Engraving (₹)
              </label>
              <p className="text-[11px] text-slate-500">Custom message plaque on base</p>
              <div className="flex items-center rounded bg-slate-800 border border-slate-700 px-2 mt-2 focus-within:border-amber-400">
                <span className="text-slate-400 text-xs mr-1">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={engravedPlinthRupees}
                  onChange={(e) => setEngravedPlinthRupees(e.target.value)}
                  className="w-full bg-transparent py-1.5 text-sm font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Extra Photo Slot (₹)
              </label>
              <p className="text-[11px] text-slate-500">Multi-panel fee beyond slot 1</p>
              <div className="flex items-center rounded bg-slate-800 border border-slate-700 px-2 mt-2 focus-within:border-amber-400">
                <span className="text-slate-400 text-xs mr-1">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={extraPhotoSlotRupees}
                  onChange={(e) => setExtraPhotoSlotRupees(e.target.value)}
                  className="w-full bg-transparent py-1.5 text-sm font-mono text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 py-2 text-sm font-bold text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            {saving ? 'Saving Settings...' : 'Save Photo Lamp Pricing'}
          </button>
        </div>
      </form>

      {/* Shipping Methods Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">3. Customizer Shipping Methods</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure delivery tiers available in the 3D customizer checkout drawer.
          </p>
        </div>
        <ShippingManager
          methods={shippingMethods}
          onChange={setShippingMethods}
          onAutoSave={updateCustomizerShipping}
        />
      </div>
    </div>
  )
}
