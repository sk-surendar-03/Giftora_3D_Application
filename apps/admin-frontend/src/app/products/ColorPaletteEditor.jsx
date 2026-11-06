import { useState } from 'react'

const PRESET_COLORS = [
  { label: 'White', hex: '#f5f3ee' },
  { label: 'Black', hex: '#1a1a1a' },
  { label: 'Red', hex: '#b33a3a' },
  { label: 'Natural', hex: '#e8d9b5' },
  { label: 'Gold', hex: '#c9a227' },
  { label: 'Silver', hex: '#c0c0c0' },
  { label: 'Bronze', hex: '#8c6239' },
  { label: 'Copper', hex: '#b5651d' },
  { label: 'Steel Grey', hex: '#71797e' },
  { label: 'Steel Silver', hex: '#c4c8cc' },
  { label: 'Matte Black', hex: '#2a2a2a' },
  { label: 'Gold Finish', hex: '#b9923f' },
  { label: 'Clear', hex: '#eef2f3' },
  { label: 'Frosted White', hex: '#f7f5f0' },
  { label: 'Royal Blue', hex: '#1e3a8a' },
  { label: 'Emerald Green', hex: '#047857' },
  { label: 'Rose Gold', hex: '#b76e79' },
  { label: 'Navy', hex: '#0f172a' },
]

export default function ColorPaletteEditor({ materials = [], value = {}, onChange }) {
  const [newMaterialInput, setNewMaterialInput] = useState('')
  const [addingMaterial, setAddingMaterial] = useState(false)
  const [editingColor, setEditingColor] = useState(null) // { material, index, label, hex }
  const [newColorDrafts, setNewColorDrafts] = useState({}) // { [material]: { label, hex } }

  // Combine configured materials from the form field with any extra materials already present in value
  const allMaterials = Array.from(
    new Set([
      ...materials.map((m) => m.trim()).filter(Boolean),
      ...Object.keys(value || {}),
    ])
  )

  function updatePalette(updater) {
    const next = typeof updater === 'function' ? updater(value || {}) : updater
    onChange(next)
  }

  function handleAddMaterial(name) {
    const trimmed = (name || newMaterialInput).trim()
    if (!trimmed) return
    if (!value[trimmed]) {
      updatePalette((prev) => ({
        ...prev,
        [trimmed]: [],
      }))
    }
    setNewMaterialInput('')
    setAddingMaterial(false)
  }

  function handleRemoveMaterial(materialName) {
    if (!window.confirm(`Remove material "${materialName}" and all its colors?`)) return
    updatePalette((prev) => {
      const copy = { ...prev }
      delete copy[materialName]
      return copy
    })
  }

  function handleAddColor(material) {
    const draft = newColorDrafts[material] || { label: '', hex: '#000000' }
    const label = draft.label.trim()
    const hex = draft.hex.trim()
    if (!label) return

    const currentColors = value[material] || []
    const updated = [...currentColors, { label, hex }]
    updatePalette((prev) => ({
      ...prev,
      [material]: updated,
    }))

    // Reset draft for this material
    setNewColorDrafts((prev) => ({
      ...prev,
      [material]: { label: '', hex: '#000000' },
    }))
  }

  function handleUpdateColor(material, index, updatedColor) {
    const currentColors = value[material] || []
    const updated = currentColors.map((c, i) => (i === index ? updatedColor : c))
    updatePalette((prev) => ({
      ...prev,
      [material]: updated,
    }))
    setEditingColor(null)
  }

  function handleRemoveColor(material, index) {
    const currentColors = value[material] || []
    const updated = currentColors.filter((_, i) => i !== index)
    updatePalette((prev) => ({
      ...prev,
      [material]: updated,
    }))
  }

  function setDraftField(material, field, val) {
    setNewColorDrafts((prev) => {
      const current = prev[material] || { label: '', hex: '#000000' }
      return {
        ...prev,
        [material]: {
          ...current,
          [field]: val,
        },
      }
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-alt/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Color Palette Editor</h3>
          <p className="text-xs text-muted">
            Manage visual colors and finishes grouped by material. Colors saved here will show as swatches on customer product cards.
          </p>
        </div>
        {!addingMaterial && (
          <button
            type="button"
            onClick={() => setAddingMaterial(true)}
            className="rounded border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:border-accent hover:text-accent transition-colors cursor-pointer"
          >
            + Add Material Group
          </button>
        )}
      </div>

      {addingMaterial && (
        <div className="flex items-center gap-2 rounded border border-line bg-surface p-2.5">
          <input
            type="text"
            value={newMaterialInput}
            onChange={(e) => setNewMaterialInput(e.target.value)}
            placeholder="e.g. Standard PLA, Silk Metallic PLA"
            className="flex-1 rounded border border-line px-2.5 py-1 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddMaterial()
              }
            }}
          />
          <button
            type="button"
            onClick={() => handleAddMaterial()}
            className="rounded bg-accent px-3 py-1 text-xs font-semibold text-on-accent hover:opacity-90 cursor-pointer"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingMaterial(false)
              setNewMaterialInput('')
            }}
            className="rounded border border-line px-2.5 py-1 text-xs text-muted hover:text-ink cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {allMaterials.length === 0 ? (
        <div className="rounded border border-dashed border-line p-6 text-center text-xs text-muted">
          No materials configured yet. Add materials in the &quot;Materials&quot; input above or click &quot;+ Add Material Group&quot; to begin adding colors.
        </div>
      ) : (
        <div className="space-y-4">
          {allMaterials.map((material) => {
            const colors = value[material] || []
            const draft = newColorDrafts[material] || { label: '', hex: '#000000' }

            return (
              <div key={material} className="rounded-md border border-line bg-surface p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-line/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      {material}
                    </span>
                    <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] text-muted">
                      {colors.length} {colors.length === 1 ? 'color' : 'colors'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(material)}
                    className="text-xs text-muted hover:text-danger cursor-pointer transition-colors"
                    title={`Delete entire ${material} palette`}
                  >
                    Delete Group
                  </button>
                </div>

                {/* Existing Color Swatches List */}
                {colors.length === 0 ? (
                  <p className="text-xs text-muted italic">No colors added for {material} yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((color, idx) => {
                      const isEditingThis =
                        editingColor?.material === material && editingColor?.index === idx

                      if (isEditingThis) {
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 rounded-md border border-accent bg-alt p-1.5 text-xs shadow-sm"
                          >
                            <input
                              type="color"
                              value={editingColor.hex}
                              onChange={(e) =>
                                setEditingColor((prev) => ({ ...prev, hex: e.target.value }))
                              }
                              className="h-6 w-6 rounded border-0 p-0 cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={editingColor.label}
                              onChange={(e) =>
                                setEditingColor((prev) => ({ ...prev, label: e.target.value }))
                              }
                              placeholder="Name"
                              className="w-20 rounded border border-line px-1.5 py-0.5 text-xs"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editingColor.hex}
                              onChange={(e) =>
                                setEditingColor((prev) => ({ ...prev, hex: e.target.value }))
                              }
                              placeholder="#hex"
                              className="w-16 rounded border border-line px-1.5 py-0.5 text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateColor(material, idx, {
                                  label: editingColor.label.trim() || color.label,
                                  hex: editingColor.hex.trim() || color.hex,
                                })
                              }
                              className="rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-accent cursor-pointer"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingColor(null)}
                              className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted hover:text-ink cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={idx}
                          className="group relative flex items-center gap-2 rounded-full border border-line bg-alt pl-1.5 pr-2.5 py-1 text-xs text-ink hover:border-accent/60 transition-colors"
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-black/30 shadow-inner shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-medium text-[11.5px]">{color.label}</span>
                          <span className="text-[10px] text-muted font-mono">{color.hex}</span>

                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity ml-1">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingColor({
                                  material,
                                  index: idx,
                                  label: color.label,
                                  hex: color.hex,
                                })
                              }
                              title="Edit color"
                              className="text-[10px] text-muted hover:text-accent cursor-pointer"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(material, idx)}
                              title="Remove color"
                              className="text-[10px] text-muted hover:text-danger cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add New Color Form for this material */}
                <div className="pt-2 border-t border-line/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium text-muted">Add color:</span>
                    <input
                      type="color"
                      value={draft.hex}
                      onChange={(e) => setDraftField(material, 'hex', e.target.value)}
                      className="h-7 w-7 rounded border border-line p-0.5 cursor-pointer bg-surface"
                      title="Pick color"
                    />
                    <input
                      type="text"
                      value={draft.label}
                      onChange={(e) => setDraftField(material, 'label', e.target.value)}
                      placeholder="Color name (e.g. Gold, Matte Black)"
                      className="rounded border border-line px-2.5 py-1 text-xs w-48"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddColor(material)
                        }
                      }}
                    />
                    <input
                      type="text"
                      value={draft.hex}
                      onChange={(e) => setDraftField(material, 'hex', e.target.value)}
                      placeholder="#hex"
                      className="rounded border border-line px-2 py-1 text-xs w-20 font-mono"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddColor(material)
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddColor(material)}
                      disabled={!draft.label.trim()}
                      className="rounded bg-accent px-3 py-1 text-xs font-semibold text-on-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
                    >
                      + Add Color
                    </button>
                  </div>

                  {/* Preset quick pickers */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-muted mr-1">Presets:</span>
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setDraftField(material, 'label', preset.label)
                          setDraftField(material, 'hex', preset.hex)
                        }}
                        className="group flex items-center gap-1 rounded-full border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted hover:border-accent hover:text-ink cursor-pointer transition-colors"
                        title={`Click to load preset ${preset.label} (${preset.hex})`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/30"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
