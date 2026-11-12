import { useEffect, useState } from 'react'
import Banner from '../../components/Banner.jsx'
import {
  fetchPricing,
  updatePricing,
  fetchCustomizerColors,
  updateCustomizerColors,
  fetchCustomizerShipping,
  updateCustomizerShipping,
  fetchCustomizerSizes,
  updateCustomizerSizes,
  fetchCustomizerThicknesses,
  updateCustomizerThicknesses,
} from '../../features/settings/settingsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

const PRESET_COLORS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f0' },
  { name: 'Steel Grey', hex: '#7a8591' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Red', hex: '#e03131' },
  { name: 'Orange', hex: '#e8590c' },
  { name: 'Gold', hex: '#c9930a' },
  { name: 'Yellow', hex: '#f5c518' },
  { name: 'Green', hex: '#2f9e44' },
  { name: 'Teal', hex: '#0c8599' },
  { name: 'Blue', hex: '#1971c2' },
  { name: 'Navy', hex: '#1864ab' },
  { name: 'Purple', hex: '#7048e8' },
  { name: 'Pink', hex: '#e64980' },
  { name: 'Rose Gold', hex: '#b5726a' },
  { name: 'Bronze', hex: '#8b6914' },
]

// ─── Color Manager ────────────────────────────────────────────────────────────
function ColorManager({ colors, onChange }) {
  const [draft, setDraft] = useState({ name: '', hex: '#000000' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  function addPreset(preset) {
    if (colors.some((c) => c.hex === preset.hex)) return
    onChange([...colors, preset])
  }
  function add() {
    if (!draft.name.trim() || !draft.hex) return
    onChange([...colors, { name: draft.name.trim(), hex: draft.hex }])
    setDraft({ name: '', hex: '#000000' })
  }
  function remove(i) { onChange(colors.filter((_, idx) => idx !== i)) }
  function startEdit(i) { setEditIndex(i); setEditDraft({ name: colors[i].name, hex: colors[i].hex }) }
  function saveEdit() {
    if (!editDraft.name.trim() || !editDraft.hex) return
    onChange(colors.map((c, i) => i === editIndex ? { name: editDraft.name.trim(), hex: editDraft.hex } : c))
    setEditIndex(null); setEditDraft(null)
  }

  return (
    <div className="space-y-3">
      {/* Preset swatches */}
      <div>
        <p className="text-[10px] text-muted uppercase tracking-wide mb-1.5">Click to add/remove</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((p) => {
            const active = colors.some((c) => c.hex === p.hex)
            return (
              <button
                key={p.hex}
                type="button"
                title={p.name}
                onClick={() => active ? onChange(colors.filter((c) => c.hex !== p.hex)) : addPreset(p)}
                className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${active ? 'border-accent scale-110 shadow-md' : 'border-transparent hover:border-muted hover:scale-105'}`}
                style={{ background: p.hex }}
              />
            )
          })}
        </div>
      </div>

      {/* Added colors list */}
      {colors.length > 0 && (
        <div className="space-y-1.5">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface/60 px-3 py-1.5">
              {editIndex === i ? (
                <>
                  <input type="color" value={editDraft.hex} onChange={(e) => setEditDraft((p) => ({ ...p, hex: e.target.value }))}
                    className="h-7 w-9 cursor-pointer rounded border border-line" />
                  <input value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 rounded border border-line px-2 py-1 text-xs" placeholder="Color name" autoFocus />
                  <button type="button" onClick={saveEdit} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white cursor-pointer">Save</button>
                  <button type="button" onClick={() => setEditIndex(null)} className="text-xs text-muted hover:text-ink cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <div className="h-5 w-5 shrink-0 rounded-full border border-line" style={{ background: c.hex }} />
                  <span className="flex-1 text-xs font-medium text-ink">{c.name}</span>
                  <span className="text-[10px] text-muted font-mono">{c.hex}</span>
                  <button type="button" onClick={() => startEdit(i)} className="text-xs text-muted hover:text-ink cursor-pointer">✎</button>
                  <button type="button" onClick={() => remove(i)} className="text-xs text-muted hover:text-danger cursor-pointer">✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom color add row */}
      <div className="flex items-center gap-2 pt-1 border-t border-line">
        <input type="color" value={draft.hex} onChange={(e) => setDraft((p) => ({ ...p, hex: e.target.value }))}
          className="h-8 w-9 cursor-pointer rounded border border-line" />
        <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Custom name" className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} disabled={!draft.name.trim()}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          +Add
        </button>
      </div>
    </div>
  )
}

// ─── Shipping Manager ─────────────────────────────────────────────────────────
function ShippingManager({ methods, onChange, onAutoSave }) {
  const [draft, setDraft] = useState({ name: '', price: '', days: '' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [autoStatus, setAutoStatus] = useState(null)

  async function commit(newMethods) {
    onChange(newMethods)
    if (!onAutoSave) return
    setAutoSaving(true); setAutoStatus(null)
    try { await onAutoSave(newMethods); setAutoStatus('ok'); setTimeout(() => setAutoStatus(null), 2000) }
    catch { setAutoStatus('err'); setTimeout(() => setAutoStatus(null), 3000) }
    setAutoSaving(false)
  }

  function add() {
    const name = draft.name.trim(); const price = parseFloat(draft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    commit([...methods, { name, priceCents: Math.round(price * 100), estimatedDays: draft.days.trim() || undefined }])
    setDraft({ name: '', price: '', days: '' })
  }
  function remove(i) { commit(methods.filter((_, idx) => idx !== i)) }
  function startEdit(i) { setEditIndex(i); setEditDraft({ name: methods[i].name, price: String(methods[i].priceCents / 100), days: methods[i].estimatedDays || '' }) }
  function saveEdit() {
    const name = editDraft.name.trim(); const price = parseFloat(editDraft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    commit(methods.map((m, i) => i === editIndex ? { name, priceCents: Math.round(price * 100), estimatedDays: editDraft.days.trim() || undefined } : m))
    setEditIndex(null); setEditDraft(null)
  }

  return (
    <div className="space-y-2">
      {methods.length > 0 && (
        <div className="space-y-1.5">
          {methods.map((m, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface/60 px-3 py-1.5">
              {editIndex === i ? (
                <>
                  <input value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 rounded border border-line px-2 py-1 text-xs" placeholder="Method name" autoFocus />
                  <span className="text-xs text-muted">₹</span>
                  <input type="number" min="0" step="0.01" value={editDraft.price}
                    onChange={(e) => setEditDraft((p) => ({ ...p, price: e.target.value }))}
                    className="w-16 rounded border border-line px-2 py-1 text-xs" />
                  <input value={editDraft.days} onChange={(e) => setEditDraft((p) => ({ ...p, days: e.target.value }))}
                    className="w-20 rounded border border-line px-2 py-1 text-xs" placeholder="3-5 days" />
                  <button type="button" onClick={saveEdit} disabled={autoSaving} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white cursor-pointer disabled:opacity-50">
                    {autoSaving ? '…' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditIndex(null)} className="text-xs text-muted hover:text-ink cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-xs font-medium text-ink">{m.name}</span>
                  {m.estimatedDays && <span className="text-[10px] text-muted">{m.estimatedDays}</span>}
                  <span className="text-xs font-semibold text-accent">{m.priceCents === 0 ? 'Free' : `₹${(m.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}</span>
                  <button type="button" onClick={() => startEdit(i)} className="text-xs text-muted hover:text-ink cursor-pointer">✎</button>
                  <button type="button" onClick={() => remove(i)} disabled={autoSaving} className="text-xs text-muted hover:text-danger cursor-pointer disabled:opacity-50">✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto_60px_80px_auto] items-center gap-1.5 pt-1">
        <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Method (e.g. Standard Delivery)" className="rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <span className="text-xs text-muted">₹</span>
        <input type="number" min="0" step="0.01" value={draft.price} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
          placeholder="0" className="rounded-md border border-line px-2 py-1.5 text-xs" />
        <input value={draft.days} onChange={(e) => setDraft((p) => ({ ...p, days: e.target.value }))}
          placeholder="3-5 days" className="rounded-md border border-line px-2 py-1.5 text-xs" />
        <button type="button" onClick={add} disabled={!draft.name.trim() || draft.price === '' || autoSaving}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          {autoSaving ? '…' : '+ Add'}
        </button>
      </div>
      {autoStatus && (
        <p className={`text-[10px] font-medium ${autoStatus === 'ok' ? 'text-green-500' : 'text-danger'}`}>
          {autoStatus === 'ok' ? '✓ Saved to database' : '✗ Save failed — try again'}
        </p>
      )}
    </div>
  )
}

// ─── Generic price list editor (sizes, thicknesses) ──────────────────────────
function PriceListEditor({ items, onChange, onAutoSave, namePlaceholder = 'Name' }) {
  const [draft, setDraft] = useState({ name: '', price: '' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [autoStatus, setAutoStatus] = useState(null)

  async function commit(newItems) {
    onChange(newItems)
    if (!onAutoSave) return
    setAutoSaving(true); setAutoStatus(null)
    try { await onAutoSave(newItems); setAutoStatus('ok'); setTimeout(() => setAutoStatus(null), 2000) }
    catch { setAutoStatus('err'); setTimeout(() => setAutoStatus(null), 3000) }
    setAutoSaving(false)
  }

  function add() {
    const name = draft.name.trim(); const price = parseFloat(draft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    commit([...items, { name, priceCents: Math.round(price * 100) }])
    setDraft({ name: '', price: '' })
  }
  function remove(i) { commit(items.filter((_, idx) => idx !== i)) }
  function startEdit(i) { setEditIndex(i); setEditDraft({ name: items[i].name, price: String(items[i].priceCents / 100) }) }
  function saveEdit() {
    const name = editDraft.name.trim(); const price = parseFloat(editDraft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    commit(items.map((item, i) => i === editIndex ? { name, priceCents: Math.round(price * 100) } : item))
    setEditIndex(null); setEditDraft(null)
  }

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface/60 px-3 py-1.5">
              {editIndex === i ? (
                <>
                  <input value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 rounded border border-line px-2 py-1 text-xs" placeholder={namePlaceholder} autoFocus />
                  <span className="text-xs text-muted">₹</span>
                  <input type="number" min="0" step="0.01" value={editDraft.price}
                    onChange={(e) => setEditDraft((p) => ({ ...p, price: e.target.value }))}
                    className="w-20 rounded border border-line px-2 py-1 text-xs" />
                  <button type="button" onClick={saveEdit} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white cursor-pointer">Save</button>
                  <button type="button" onClick={() => setEditIndex(null)} className="text-xs text-muted hover:text-ink cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-xs font-medium text-ink">{item.name}</span>
                  <span className="text-xs font-semibold text-accent">
                    {item.priceCents === 0 ? 'Included' : `₹${(item.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                  </span>
                  <button type="button" onClick={() => startEdit(i)} className="text-xs text-muted hover:text-ink cursor-pointer">✎</button>
                  <button type="button" onClick={() => remove(i)} className="text-xs text-muted hover:text-danger cursor-pointer">✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder={namePlaceholder} className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <span className="text-xs text-muted shrink-0">₹</span>
        <input type="number" min="0" step="0.01" value={draft.price}
          onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
          placeholder="0" className="w-20 rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} disabled={!draft.name.trim() || draft.price === '' || autoSaving}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          {autoSaving ? '…' : '+ Add'}
        </button>
      </div>
      {autoStatus && (
        <p className={`text-[10px] font-medium ${autoStatus === 'ok' ? 'text-green-500' : 'text-danger'}`}>
          {autoStatus === 'ok' ? '✓ Saved to database' : '✗ Save failed — try again'}
        </p>
      )}
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Card({ title, description, onSave, saving, saveStatus, children }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {onSave && (
          <button type="button" onClick={onSave} disabled={saving}
            className="shrink-0 rounded-control bg-accent px-3 py-1.5 text-xs font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
            {saving ? 'Saving…' : saveStatus === 'ok' ? '✓ Saved!' : saveStatus === 'err' ? 'Error!' : 'Save'}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomizationSettings() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Pricing
  const [pricePerCharacter, setPricePerCharacter] = useState('')
  const [baseCharacters, setBaseCharacters] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [savingPricing, setSavingPricing] = useState(false)
  const [pricingError, setPricingError] = useState(null)
  const [pricingSuccess, setPricingSuccess] = useState(null)

  // Colors
  const [colors, setColors] = useState([])
  const [savingColors, setSavingColors] = useState(false)
  const [colorsStatus, setColorsStatus] = useState(null)

  // Shipping
  const [shippingMethods, setShippingMethods] = useState([])
  const [savingShipping, setSavingShipping] = useState(false)
  const [shippingStatus, setShippingStatus] = useState(null)

  // Sizes
  const [sizes, setSizes] = useState([])
  const [savingSizes, setSavingSizes] = useState(false)
  const [sizesStatus, setSizesStatus] = useState(null)

  // Thicknesses
  const [thicknesses, setThicknesses] = useState([])
  const [savingThicknesses, setSavingThicknesses] = useState(false)
  const [thicknessesStatus, setThicknessesStatus] = useState(null)

  function load() {
    setIsLoading(true)
    setLoadError(null)
    Promise.all([fetchPricing(), fetchCustomizerColors(), fetchCustomizerShipping(), fetchCustomizerSizes(), fetchCustomizerThicknesses()])
      .then(([pricing, cols, methods, szs, thks]) => {
        setPricePerCharacter((pricing.perCharacterPriceCents / 100).toString())
        setBaseCharacters((pricing.baseCharacters ?? 0).toString())
        setBasePrice(((pricing.basePriceCents ?? 0) / 100).toString())
        setColors(Array.isArray(cols) ? cols : [])
        setShippingMethods(Array.isArray(methods) ? methods : [])
        setSizes(Array.isArray(szs) ? szs : [])
        setThicknesses(Array.isArray(thks) ? thks : [])
      })
      .catch((err) => setLoadError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t) }, [])

  async function handleSavePricing(e) {
    e.preventDefault()
    setPricingError(null); setPricingSuccess(null)
    const rupees = Number(pricePerCharacter)
    const baseChs = Number(baseCharacters)
    const baseRupees = Number(basePrice)
    if (!Number.isFinite(rupees) || rupees < 0) return setPricingError('Enter a valid price per character.')
    if (!Number.isFinite(baseChs) || baseChs < 0 || !Number.isInteger(baseChs)) return setPricingError('Base characters must be a whole number ≥ 0.')
    if (!Number.isFinite(baseRupees) || baseRupees < 0) return setPricingError('Enter a valid base price.')
    setSavingPricing(true)
    try {
      const pricing = await updatePricing({
        perCharacterPriceCents: Math.round(rupees * 100),
        baseCharacters: baseChs,
        basePriceCents: Math.round(baseRupees * 100),
      })
      setPricePerCharacter((pricing.perCharacterPriceCents / 100).toString())
      setBaseCharacters((pricing.baseCharacters ?? 0).toString())
      setBasePrice(((pricing.basePriceCents ?? 0) / 100).toString())
      setPricingSuccess('Pricing updated.')
      setTimeout(() => setPricingSuccess(null), 2500)
    } catch (err) {
      setPricingError(extractError(err))
    }
    setSavingPricing(false)
  }

  async function saveColors() {
    setSavingColors(true); setColorsStatus(null)
    try { const s = await updateCustomizerColors(colors); setColors(s); setColorsStatus('ok'); setTimeout(() => setColorsStatus(null), 2500) }
    catch { setColorsStatus('err'); setTimeout(() => setColorsStatus(null), 3000) }
    setSavingColors(false)
  }

  async function saveShipping() {
    setSavingShipping(true); setShippingStatus(null)
    try { const s = await updateCustomizerShipping(shippingMethods); setShippingMethods(s); setShippingStatus('ok'); setTimeout(() => setShippingStatus(null), 2500) }
    catch { setShippingStatus('err'); setTimeout(() => setShippingStatus(null), 3000) }
    setSavingShipping(false)
  }

  async function saveSizes() {
    setSavingSizes(true); setSizesStatus(null)
    try { const s = await updateCustomizerSizes(sizes); setSizes(s); setSizesStatus('ok'); setTimeout(() => setSizesStatus(null), 2500) }
    catch { setSizesStatus('err'); setTimeout(() => setSizesStatus(null), 3000) }
    setSavingSizes(false)
  }

  async function saveThicknesses() {
    setSavingThicknesses(true); setThicknessesStatus(null)
    try { const s = await updateCustomizerThicknesses(thicknesses); setThicknesses(s); setThicknessesStatus('ok'); setTimeout(() => setThicknessesStatus(null), 2500) }
    catch { setThicknessesStatus('err'); setTimeout(() => setThicknessesStatus(null), 3000) }
    setSavingThicknesses(false)
  }

  return (
    <div className="pb-16">
      <h1 className="text-xl font-semibold text-ink">3D Customization Settings</h1>
      <p className="mt-1 text-sm text-muted">Configure colors, sizes, thickness, and shipping for the 3D customizer.</p>

      {loadError && <div className="mt-4"><Banner tone="error">{loadError}</Banner></div>}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading settings…</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">

            {/* Pricing */}
            <div className="rounded-card border border-line bg-surface p-5 shadow-sm flex flex-col gap-4">
              <div className="border-b border-line pb-3">
                <h2 className="text-sm font-semibold text-ink">3D Customizer Pricing</h2>
                <p className="mt-0.5 text-xs text-muted">Set base price for first N chars, then per-char rate above that.</p>
              </div>
              {pricingError && <Banner tone="error">{pricingError}</Banner>}
              {pricingSuccess && <Banner tone="success">{pricingSuccess}</Banner>}
              <form onSubmit={handleSavePricing} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Minimum Characters</label>
                  <input type="number" min="0" step="1" value={baseCharacters} onChange={(e) => setBaseCharacters(e.target.value)}
                    className="w-full rounded-control border border-line px-3 py-2 text-sm text-ink outline-none focus:border-brand" placeholder="10" />
                  <p className="mt-0.5 text-[10px] text-muted">≤ this many chars → flat base price</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Base Price (₹)</label>
                  <input type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full rounded-control border border-line px-3 py-2 text-sm text-ink outline-none focus:border-brand" placeholder="500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Price per Extra Character (₹)</label>
                  <input type="number" min="0" step="0.01" value={pricePerCharacter} onChange={(e) => setPricePerCharacter(e.target.value)}
                    className="w-full rounded-control border border-line px-3 py-2 text-sm text-ink outline-none focus:border-brand" placeholder="50" />
                </div>
                <button type="submit" disabled={savingPricing}
                  className="rounded-control bg-accent px-4 py-2 text-xs font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                  {savingPricing ? 'Saving…' : 'Save Pricing'}
                </button>
              </form>
            </div>

            {/* Colors */}
            <Card title="Color Options" description="Colors customers can choose in the 3D customizer. These replace the default hardcoded palette."
              onSave={saveColors} saving={savingColors} saveStatus={colorsStatus}>
              <ColorManager colors={colors} onChange={setColors} />
            </Card>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">

            {/* Sizes */}
            <Card title="Size Options" description="Sizes shown in the customizer. Each size adds to the base character price. Set ₹0 for no extra charge."
              onSave={saveSizes} saving={savingSizes} saveStatus={sizesStatus}>
              <PriceListEditor items={sizes} onChange={setSizes}
                onAutoSave={(newSizes) => updateCustomizerSizes(newSizes).then((s) => setSizes(s))}
                namePlaceholder="Size (e.g. Small 4cm, Large 7cm)" />
            </Card>

            {/* Thicknesses */}
            <Card title="Base Thickness Options" description="Thickness choices in the customizer. Each option adds to the total price."
              onSave={saveThicknesses} saving={savingThicknesses} saveStatus={thicknessesStatus}>
              <PriceListEditor items={thicknesses} onChange={setThicknesses}
                onAutoSave={(newThicknesses) => updateCustomizerThicknesses(newThicknesses).then((s) => setThicknesses(s))}
                namePlaceholder="Thickness (e.g. Standard, Premium)" />
            </Card>

            {/* Shipping */}
            <Card title="Shipping Methods" description="Shipping options shown when customers order a customized item."
              onSave={saveShipping} saving={savingShipping} saveStatus={shippingStatus}>
              <ShippingManager methods={shippingMethods} onChange={setShippingMethods}
                onAutoSave={(newMethods) => updateCustomizerShipping(newMethods).then((s) => setShippingMethods(s))} />
            </Card>

          </div>
        </div>
      )}
    </div>
  )
}
