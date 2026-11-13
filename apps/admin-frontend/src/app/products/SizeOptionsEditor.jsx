import { useState } from 'react'

export default function SizeOptionsEditor({ value = [], onChange, onDirectSave }) {
  const [draft, setDraft] = useState({ name: '', additional: '' })
  const [editIndex, setEditIndex] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  function add() {
    const name = draft.name.trim()
    const additional = parseFloat(draft.additional)
    if (!name || !Number.isFinite(additional) || additional < 0) return
    const next = [...value, { name, additionalCents: Math.round(additional * 100) }]
    onChange(next)
    onDirectSave?.(next)
    setDraft({ name: '', additional: '' })
  }

  function remove(i) {
    const next = value.filter((_, idx) => idx !== i)
    onChange(next)
    onDirectSave?.(next)
  }

  function startEdit(i) {
    setEditIndex(i)
    setEditDraft({ name: value[i].name, additional: String(value[i].additionalCents / 100) })
  }

  function saveEdit() {
    const name = editDraft.name.trim()
    const additional = parseFloat(editDraft.additional)
    if (!name || !Number.isFinite(additional) || additional < 0) return
    const next = value.map((item, i) => i === editIndex ? { name, additionalCents: Math.round(additional * 100) } : item)
    onChange(next)
    onDirectSave?.(next)
    setEditIndex(null)
    setEditDraft(null)
  }

  return (
    <div className="rounded-lg border border-line bg-surface/40 p-4 space-y-3">
      <div className="border-b border-line pb-2">
        <h3 className="text-sm font-semibold text-ink">Sizes &amp; Additional Pricing</h3>
        <p className="text-xs text-muted">Each size can add an extra charge on top of the material price. Set ₹0 for no extra charge.</p>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
              {editIndex === i ? (
                <>
                  <input
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    className="flex-1 min-w-[100px] rounded border border-line px-2 py-1 text-xs"
                    placeholder="Size name"
                    autoFocus
                  />
                  <span className="text-xs text-muted shrink-0">+₹</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={editDraft.additional}
                    onChange={(e) => setEditDraft((p) => ({ ...p, additional: e.target.value }))}
                    className="w-20 rounded border border-line px-2 py-1 text-xs"
                    placeholder="Extra"
                  />
                  <button type="button" onClick={saveEdit} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white cursor-pointer shrink-0">Save</button>
                  <button type="button" onClick={() => setEditIndex(null)} className="text-xs text-muted hover:text-ink cursor-pointer shrink-0">✕</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-ink">{item.name}</span>
                  <span className="text-sm font-semibold text-accent">
                    {item.additionalCents === 0 ? 'No extra charge' : `+₹${(item.additionalCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                  </span>
                  <button type="button" onClick={() => startEdit(i)} className="text-xs text-muted hover:text-ink cursor-pointer">✎</button>
                  <button type="button" onClick={() => remove(i)} className="text-xs text-muted hover:text-danger cursor-pointer">✕</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <input
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Size name (e.g. Small 4cm)"
          className="flex-1 min-w-[120px] rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <span className="text-xs text-muted shrink-0">+₹</span>
        <input
          type="number" min="0" step="0.01"
          value={draft.additional}
          onChange={(e) => setDraft((p) => ({ ...p, additional: e.target.value }))}
          placeholder="0"
          className="w-20 rounded-md border border-line px-3 py-1.5 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button
          type="button" onClick={add}
          disabled={!draft.name.trim() || draft.additional === ''}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          + Add
        </button>
      </div>
    </div>
  )
}
