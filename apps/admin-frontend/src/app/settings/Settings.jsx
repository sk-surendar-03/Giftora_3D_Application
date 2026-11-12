import { useEffect, useState } from 'react'
import Banner from '../../components/Banner.jsx'
import {
  fetchPricing,
  updatePricing,
  fetchAnnouncement,
  updateAnnouncement,
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

// ─── Color Manager ───────────────────────────────────────────────────────────
function ColorManager({ colors, onChange }) {
  const [draft, setDraft] = useState({ name: '', hex: '#000000' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  function add() {
    if (!draft.name.trim() || !draft.hex) return
    onChange([...colors, { name: draft.name.trim(), hex: draft.hex }])
    setDraft({ name: '', hex: '#000000' })
  }

  function remove(i) {
    onChange(colors.filter((_, idx) => idx !== i))
  }

  function startEdit(i) {
    setEditIndex(i)
    setEditDraft({ name: colors[i].name, hex: colors[i].hex })
  }

  function saveEdit() {
    if (!editDraft.name.trim() || !editDraft.hex) return
    onChange(colors.map((c, i) => i === editIndex ? { name: editDraft.name.trim(), hex: editDraft.hex } : c))
    setEditIndex(null)
    setEditDraft(null)
  }

  return (
    <div className="space-y-3">
      {colors.length > 0 && (
        <div className="space-y-2">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
              {editIndex === i ? (
                <>
                  <input
                    type="color"
                    value={editDraft.hex}
                    onChange={(e) => setEditDraft((p) => ({ ...p, hex: e.target.value }))}
                    className="h-8 w-10 cursor-pointer rounded border border-line"
                  />
                  <input
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 rounded border border-line px-2 py-1 text-xs"
                    placeholder="Color name"
                    autoFocus
                  />
                  <button type="button" onClick={saveEdit} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white cursor-pointer">Save</button>
                  <button type="button" onClick={() => setEditIndex(null)} className="text-xs text-muted hover:text-ink cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <div className="h-6 w-6 shrink-0 rounded-full border border-line" style={{ background: c.hex }} />
                  <span className="flex-1 text-sm font-medium text-ink">{c.name}</span>
                  <span className="text-xs text-muted font-mono">{c.hex}</span>
                  <button type="button" onClick={() => startEdit(i)} className="text-xs text-muted hover:text-ink cursor-pointer">✎</button>
                  <button type="button" onClick={() => remove(i)} className="text-xs text-muted hover:text-danger cursor-pointer">✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="color"
          value={draft.hex}
          onChange={(e) => setDraft((p) => ({ ...p, hex: e.target.value }))}
          className="h-8 w-10 cursor-pointer rounded border border-line"
        />
        <input
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Color name (e.g. Red, Blue, Gold)"
          className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button
          type="button" onClick={add}
          disabled={!draft.name.trim()}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          + Add
        </button>
      </div>
    </div>
  )
}

// ─── Shipping Manager ─────────────────────────────────────────────────────────
function ShippingManager({ methods, onChange }) {
  const [draft, setDraft] = useState({ name: '', price: '', days: '' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  function add() {
    const name = draft.name.trim()
    const price = parseFloat(draft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    onChange([...methods, { name, priceCents: Math.round(price * 100), estimatedDays: draft.days.trim() || undefined }])
    setDraft({ name: '', price: '', days: '' })
  }

  function remove(i) {
    onChange(methods.filter((_, idx) => idx !== i))
  }

  function startEdit(i) {
    setEditIndex(i)
    setEditDraft({ name: methods[i].name, price: String(methods[i].priceCents / 100), days: methods[i].estimatedDays || '' })
  }

  function saveEdit() {
    const name = editDraft.name.trim()
    const price = parseFloat(editDraft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    onChange(methods.map((m, i) => i === editIndex ? { name, priceCents: Math.round(price * 100), estimatedDays: editDraft.days.trim() || undefined } : m))
    setEditIndex(null)
    setEditDraft(null)
  }

  return (
    <div className="space-y-3">
      {methods.length > 0 && (
        <div className="space-y-2">
          {methods.map((m, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
              {editIndex === i ? (
                <>
                  <input
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 rounded border border-line px-2 py-1 text-xs"
                    placeholder="Method name"
                    autoFocus
                  />
                  <span className="text-xs text-muted">₹</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={editDraft.price}
                    onChange={(e) => setEditDraft((p) => ({ ...p, price: e.target.value }))}
                    className="w-20 rounded border border-line px-2 py-1 text-xs"
                    placeholder="Price"
                  />
                  <input
                    value={editDraft.days}
                    onChange={(e) => setEditDraft((p) => ({ ...p, days: e.target.value }))}
                    className="w-24 rounded border border-line px-2 py-1 text-xs"
                    placeholder="3-5 days"
                  />
                  <button type="button" onClick={saveEdit} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white cursor-pointer">Save</button>
                  <button type="button" onClick={() => setEditIndex(null)} className="text-xs text-muted hover:text-ink cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-ink">{m.name}</span>
                  {m.estimatedDays && <span className="text-xs text-muted">{m.estimatedDays}</span>}
                  <span className="text-sm font-semibold text-accent">
                    {m.priceCents === 0 ? 'Free' : `₹${(m.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                  </span>
                  <button type="button" onClick={() => startEdit(i)} className="text-xs text-muted hover:text-ink cursor-pointer">✎</button>
                  <button type="button" onClick={() => remove(i)} className="text-xs text-muted hover:text-danger cursor-pointer">✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto_72px_96px_auto] items-center gap-2 pt-1">
        <input
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Method (e.g. Standard Delivery)"
          className="rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <span className="text-xs text-muted">₹</span>
        <input
          type="number" min="0" step="0.01"
          value={draft.price}
          onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
          placeholder="0"
          className="rounded-md border border-line px-3 py-1.5 text-xs"
        />
        <input
          value={draft.days}
          onChange={(e) => setDraft((p) => ({ ...p, days: e.target.value }))}
          placeholder="3-5 days"
          className="rounded-md border border-line px-3 py-1.5 text-xs"
        />
        <button
          type="button" onClick={add}
          disabled={!draft.name.trim() || draft.price === ''}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          + Add
        </button>
      </div>
    </div>
  )
}

// ─── Size & Thickness Manager (shared pattern) ───────────────────────────────
function PriceListEditor({ items, onChange, namePlaceholder = 'Name', pricePlaceholder = '0' }) {
  const [draft, setDraft] = useState({ name: '', price: '' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  function add() {
    const name = draft.name.trim()
    const price = parseFloat(draft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    onChange([...items, { name, priceCents: Math.round(price * 100) }])
    setDraft({ name: '', price: '' })
  }

  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  function startEdit(i) {
    setEditIndex(i)
    setEditDraft({ name: items[i].name, price: String(items[i].priceCents / 100) })
  }

  function saveEdit() {
    const name = editDraft.name.trim()
    const price = parseFloat(editDraft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    onChange(items.map((item, i) => i === editIndex ? { name, priceCents: Math.round(price * 100) } : item))
    setEditIndex(null)
    setEditDraft(null)
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
              {editIndex === i ? (
                <>
                  <input value={editDraft.name} onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 rounded border border-line px-2 py-1 text-xs" placeholder={namePlaceholder} autoFocus />
                  <span className="text-xs text-muted">₹</span>
                  <input type="number" min="0" step="0.01" value={editDraft.price}
                    onChange={(e) => setEditDraft((p) => ({ ...p, price: e.target.value }))}
                    className="w-24 rounded border border-line px-2 py-1 text-xs" placeholder="Price" />
                  <button type="button" onClick={saveEdit} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white cursor-pointer">Save</button>
                  <button type="button" onClick={() => setEditIndex(null)} className="text-xs text-muted hover:text-ink cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-ink">{item.name}</span>
                  <span className="text-sm font-semibold text-accent">
                    {item.priceCents === 0 ? 'Free' : `₹${(item.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}
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
          placeholder={namePlaceholder}
          className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <span className="text-xs text-muted shrink-0">₹</span>
        <input type="number" min="0" step="0.01" value={draft.price}
          onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
          placeholder={pricePlaceholder}
          className="w-24 rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} disabled={!draft.name.trim() || draft.price === ''}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          + Add
        </button>
      </div>
    </div>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Pricing
  const [pricePerCharacter, setPricePerCharacter] = useState('')
  const [baseCharacters, setBaseCharacters] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [savingPricing, setSavingPricing] = useState(false)
  const [pricingError, setPricingError] = useState(null)
  const [pricingSuccess, setPricingSuccess] = useState(null)

  // Announcement
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [announcementError, setAnnouncementError] = useState(null)
  const [announcementSuccess, setAnnouncementSuccess] = useState(null)

  // Colors
  const [colors, setColors] = useState([])
  const [savingColors, setSavingColors] = useState(false)
  const [colorsStatus, setColorsStatus] = useState(null)

  // Shipping
  const [shippingMethods, setShippingMethods] = useState([])
  const [savingShipping, setSavingShipping] = useState(false)
  const [shippingStatus, setShippingStatus] = useState(null)

  // Sizes
  const [customizerSizes, setCustomizerSizes] = useState([])
  const [savingSizes, setSavingSizes] = useState(false)
  const [sizesStatus, setSizesStatus] = useState(null)

  // Thicknesses
  const [customizerThicknesses, setCustomizerThicknesses] = useState([])
  const [savingThicknesses, setSavingThicknesses] = useState(false)
  const [thicknessesStatus, setThicknessesStatus] = useState(null)

  function load() {
    setIsLoading(true)
    setLoadError(null)
    Promise.all([fetchPricing(), fetchAnnouncement(), fetchCustomizerColors(), fetchCustomizerShipping(), fetchCustomizerSizes(), fetchCustomizerThicknesses()])
      .then(([pricing, announcement, cols, methods, sizes, thicknesses]) => {
        setPricePerCharacter((pricing.perCharacterPriceCents / 100).toString())
        setBaseCharacters((pricing.baseCharacters ?? 0).toString())
        setBasePrice(((pricing.basePriceCents ?? 0) / 100).toString())
        setAnnouncementText(announcement.text || '')
        setAnnouncementEnabled(Boolean(announcement.enabled))
        setColors(Array.isArray(cols) ? cols : [])
        setShippingMethods(Array.isArray(methods) ? methods : [])
        setCustomizerSizes(Array.isArray(sizes) ? sizes : [])
        setCustomizerThicknesses(Array.isArray(thicknesses) ? thicknesses : [])
      })
      .catch((err) => setLoadError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [])

  async function handlePricingSubmit(e) {
    e.preventDefault()
    setPricingError(null)
    setPricingSuccess(null)
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
      setPricingSuccess('Pricing updated. New orders will use this rate immediately.')
    } catch (err) {
      setPricingError(extractError(err))
    } finally {
      setSavingPricing(false)
    }
  }

  async function handleAnnouncementSubmit(e) {
    e.preventDefault()
    setAnnouncementError(null)
    setAnnouncementSuccess(null)
    setSavingAnnouncement(true)
    try {
      const updated = await updateAnnouncement({ text: announcementText, enabled: announcementEnabled })
      setAnnouncementText(updated.text)
      setAnnouncementEnabled(updated.enabled)
      setAnnouncementSuccess('Announcement bar settings saved successfully.')
    } catch (err) {
      setAnnouncementError(extractError(err))
    } finally {
      setSavingAnnouncement(false)
    }
  }

  async function handleSaveColors() {
    setSavingColors(true)
    setColorsStatus(null)
    try {
      const saved = await updateCustomizerColors(colors)
      setColors(saved)
      setColorsStatus('ok')
      setTimeout(() => setColorsStatus(null), 2500)
    } catch {
      setColorsStatus('err')
      setTimeout(() => setColorsStatus(null), 3000)
    }
    setSavingColors(false)
  }

  async function handleSaveShipping() {
    setSavingShipping(true)
    setShippingStatus(null)
    try {
      const saved = await updateCustomizerShipping(shippingMethods)
      setShippingMethods(saved)
      setShippingStatus('ok')
      setTimeout(() => setShippingStatus(null), 2500)
    } catch {
      setShippingStatus('err')
      setTimeout(() => setShippingStatus(null), 3000)
    }
    setSavingShipping(false)
  }

  async function handleSaveSizes() {
    setSavingSizes(true)
    setSizesStatus(null)
    try {
      const saved = await updateCustomizerSizes(customizerSizes)
      setCustomizerSizes(saved)
      setSizesStatus('ok')
      setTimeout(() => setSizesStatus(null), 2500)
    } catch {
      setSizesStatus('err')
      setTimeout(() => setSizesStatus(null), 3000)
    }
    setSavingSizes(false)
  }

  async function handleSaveThicknesses() {
    setSavingThicknesses(true)
    setThicknessesStatus(null)
    try {
      const saved = await updateCustomizerThicknesses(customizerThicknesses)
      setCustomizerThicknesses(saved)
      setThicknessesStatus('ok')
      setTimeout(() => setThicknessesStatus(null), 2500)
    } catch {
      setThicknessesStatus('err')
      setTimeout(() => setThicknessesStatus(null), 3000)
    }
    setSavingThicknesses(false)
  }

  // Live pricing preview
  const previewChars = Number(baseCharacters) || 0
  const previewBase = Number(basePrice) || 0
  const previewPerChar = Number(pricePerCharacter) || 0
  const exampleBelow = previewBase > 0 ? `${previewChars} chars → ₹${previewBase.toFixed(0)}` : null
  const exampleAbove = previewBase > 0
    ? `${previewChars + 2} chars → ₹${(previewBase + 2 * previewPerChar).toFixed(0)}`
    : `8 chars → ₹${(8 * previewPerChar).toFixed(0)}`

  return (
    <div className="max-w-4xl pb-16">
      <h1 className="text-xl font-semibold text-ink">Store Settings</h1>
      <p className="mt-1 text-sm text-muted">Configure store announcements, customizer pricing, colors, and shipping.</p>

      {loadError && <div className="mt-4"><Banner tone="error">{loadError}</Banner></div>}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading settings…</p>
      ) : (
        <div className="mt-6 space-y-8">

          {/* Announcement Bar */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4">
              <h2 className="text-base font-semibold text-ink">Announcement Bar / Promotional Message</h2>
              <p className="mt-1 text-xs text-muted">Display promotional campaigns, festive greetings, or order dispatch notices across the customer header.</p>
            </div>
            {announcementError && <Banner tone="error">{announcementError}</Banner>}
            {announcementSuccess && <Banner tone="success">{announcementSuccess}</Banner>}
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" checked={announcementEnabled} onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-accent focus:ring-accent" />
                <span className="text-sm font-semibold text-ink select-none">Enable Announcement Bar on Store Header</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Announcement Text</label>
                <input type="text" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder='e.g. Diwali Special — 20% OFF or Orders dispatched within 3 working days'
                  className="w-full rounded-control border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none focus:border-brand" />
                <p className="mt-1 text-xs text-muted">Examples: "Diwali Special — 20% OFF", "New personalized gifts available!", "Orders dispatched within 3 working days"</p>
              </div>
              <div className="pt-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Live Preview {announcementEnabled ? '(Active on Storefront)' : '(Disabled / Hidden)'}
                </span>
                <div className={`rounded-control border border-line overflow-hidden transition-opacity ${announcementEnabled ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="bg-[#000000] text-[#FFFFFF] text-center py-2 px-4 text-[12.5px] font-medium tracking-[0.02em] select-none">
                    {announcementText.trim() || 'No announcement message entered'}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={savingAnnouncement}
                  className="rounded-control bg-accent px-5 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm">
                  {savingAnnouncement ? 'Saving…' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </section>

          {/* 3D Customizer Pricing */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4">
              <h2 className="text-base font-semibold text-ink">3D Customizer Pricing</h2>
              <p className="mt-1 text-xs text-muted">
                Set a base price for the first N characters, then a per-character rate for each character above that.
                Example: base ₹500 for ≤10 chars, ₹50/char above → 12 chars = ₹500 + 2×₹50 = ₹600.
              </p>
            </div>
            {pricingError && <Banner tone="error">{pricingError}</Banner>}
            {pricingSuccess && <Banner tone="success">{pricingSuccess}</Banner>}
            <form onSubmit={handlePricingSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Minimum Characters
                    <span className="ml-1 text-xs text-muted font-normal">(base threshold)</span>
                  </label>
                  <input type="number" min="0" step="1" value={baseCharacters} onChange={(e) => setBaseCharacters(e.target.value)}
                    className="w-full rounded-control border border-line px-3.5 py-2 text-sm text-ink outline-none focus:border-brand"
                    placeholder="10" />
                  <p className="mt-1 text-xs text-muted">≤ this many chars → flat base price</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Base Price (₹)
                    <span className="ml-1 text-xs text-muted font-normal">(for ≤ min chars)</span>
                  </label>
                  <input type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full rounded-control border border-line px-3.5 py-2 text-sm text-ink outline-none focus:border-brand"
                    placeholder="500" />
                  <p className="mt-1 text-xs text-muted">Flat charge up to minimum</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Price per Extra Character (₹)
                    <span className="ml-1 text-xs text-muted font-normal">(above min)</span>
                  </label>
                  <input type="number" min="0" step="0.01" value={pricePerCharacter} onChange={(e) => setPricePerCharacter(e.target.value)}
                    className="w-full rounded-control border border-line px-3.5 py-2 text-sm text-ink outline-none focus:border-brand"
                    placeholder="50" />
                  <p className="mt-1 text-xs text-muted">Charged per char above minimum</p>
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-md border border-line bg-surface/60 px-4 py-3 text-xs text-muted space-y-1">
                <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">Pricing Preview</span>
                {exampleBelow && <div>• {exampleBelow} (at or below minimum → flat base price)</div>}
                <div>• {exampleAbove}{previewBase > 0 ? ' (above minimum → base + extra chars)' : ''}</div>
                {previewBase === 0 && <div className="text-[11px] italic">Set a base price above 0 to enable tiered pricing. Currently charging {previewPerChar > 0 ? `₹${previewPerChar}/char` : '₹0/char'}.</div>}
              </div>

              <button type="submit" disabled={savingPricing}
                className="rounded-control bg-accent px-5 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm">
                {savingPricing ? 'Saving…' : 'Save Pricing'}
              </button>
            </form>
          </section>

          {/* Customizer Colors */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Customizer Color Options</h2>
                <p className="mt-1 text-xs text-muted">Colors available for customers to choose in the 3D customizer. Add, edit, or remove color options.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveColors}
                disabled={savingColors}
                className="shrink-0 rounded-control bg-accent px-4 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {savingColors ? 'Saving…' : colorsStatus === 'ok' ? '✓ Saved!' : colorsStatus === 'err' ? 'Error!' : 'Save Colors'}
              </button>
            </div>
            <ColorManager colors={colors} onChange={setColors} />
          </section>

          {/* Customizer Shipping */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Customizer Shipping Methods</h2>
                <p className="mt-1 text-xs text-muted">Shipping options shown to customers when they order a customized item. Add standard, express, etc.</p>
              </div>
              <button type="button" onClick={handleSaveShipping} disabled={savingShipping}
                className="shrink-0 rounded-control bg-accent px-4 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                {savingShipping ? 'Saving…' : shippingStatus === 'ok' ? '✓ Saved!' : shippingStatus === 'err' ? 'Error!' : 'Save Shipping'}
              </button>
            </div>
            <ShippingManager methods={shippingMethods} onChange={setShippingMethods} />
          </section>

          {/* Customizer Sizes */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Customizer Size Options</h2>
                <p className="mt-1 text-xs text-muted">
                  Size choices shown to customers in the 3D customizer. Each size has an added price on top of the character pricing.
                  Example: Small (4cm) ₹0, Medium (5.5cm) ₹50, Large (7cm) ₹100.
                </p>
              </div>
              <button type="button" onClick={handleSaveSizes} disabled={savingSizes}
                className="shrink-0 rounded-control bg-accent px-4 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                {savingSizes ? 'Saving…' : sizesStatus === 'ok' ? '✓ Saved!' : sizesStatus === 'err' ? 'Error!' : 'Save Sizes'}
              </button>
            </div>
            <PriceListEditor items={customizerSizes} onChange={setCustomizerSizes}
              namePlaceholder="Size name (e.g. Small 4cm, Medium 5.5cm)" pricePlaceholder="0" />
          </section>

          {/* Customizer Thicknesses */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Customizer Base Thickness Options</h2>
                <p className="mt-1 text-xs text-muted">
                  Thickness choices in the 3D customizer. Each option has an added price. Example: Standard ₹0, Premium ₹80.
                </p>
              </div>
              <button type="button" onClick={handleSaveThicknesses} disabled={savingThicknesses}
                className="shrink-0 rounded-control bg-accent px-4 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                {savingThicknesses ? 'Saving…' : thicknessesStatus === 'ok' ? '✓ Saved!' : thicknessesStatus === 'err' ? 'Error!' : 'Save Thicknesses'}
              </button>
            </div>
            <PriceListEditor items={customizerThicknesses} onChange={setCustomizerThicknesses}
              namePlaceholder="Thickness name (e.g. Standard, Premium)" pricePlaceholder="0" />
          </section>

        </div>
      )}
    </div>
  )
}
