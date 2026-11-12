import { useState } from 'react'

export default function ShippingMethodsEditor({ value = [], onChange, onDirectSave }) {
  const [draft, setDraft] = useState({ name: '', price: '', days: '' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  function add() {
    const name = draft.name.trim()
    const price = parseFloat(draft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    const next = [...value, { name, priceCents: Math.round(price * 100), estimatedDays: draft.days.trim() || undefined }]
    onChange(next)
    onDirectSave?.(next)
    setDraft({ name: '', price: '', days: '' })
  }

  function remove(i) {
    const next = value.filter((_, idx) => idx !== i)
    onChange(next)
    onDirectSave?.(next)
  }

  function startEdit(i) {
    setEditIndex(i)
    setEditDraft({ name: value[i].name, price: String(value[i].priceCents / 100), days: value[i].estimatedDays || '' })
  }

  function saveEdit() {
    const name = editDraft.name.trim()
    const price = parseFloat(editDraft.price)
    if (!name || !Number.isFinite(price) || price < 0) return
    const next = value.map((item, i) => i === editIndex ? { name, priceCents: Math.round(price * 100), estimatedDays: editDraft.days.trim() || undefined } : item)
    onChange(next)
    onDirectSave?.(next)
    setEditIndex(null)
    setEditDraft(null)
  }

  return (
    <div className="rounded-lg border border-line bg-surface/40 p-4 space-y-3">
      <div className="border-b border-line pb-2">
        <h3 className="text-sm font-semibold text-ink">Shipping Methods</h3>
        <p className="text-xs text-muted">Add multiple shipping options (Standard, Express, etc.). Customer picks one on the product page.</p>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, i) => (
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
                    placeholder="e.g. 3-5 days"
                  />
                  <button type="button" onClick={saveEdit} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white cursor-pointer">Save</button>
                  <button type="button" onClick={() => setEditIndex(null)} className="text-xs text-muted hover:text-ink cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-ink">{item.name}</span>
                  {item.estimatedDays && <span className="text-xs text-muted">{item.estimatedDays}</span>}
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

      <div className="grid grid-cols-[1fr_auto_80px_100px_auto] items-center gap-2 pt-1">
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
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          + Add
        </button>
      </div>
    </div>
  )
}
