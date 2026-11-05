import { useState } from 'react'
import '../customiser/fontPreview.css'
import { FONT_UI_CATEGORIES, fontsForUiCategory } from '../../features/customiser/fontUiCategories'
import Button from '../ui/Button'

export default function FontChooserModal({ open, onClose, fonts, value, onChange }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (!open) return null

  const categoryFiltered = fontsForUiCategory(fonts, activeCategory)
  const visibleFonts = categoryFiltered.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-card border border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-sans text-[17px] font-semibold text-ink m-0">Choose Font Style</h2>
            <p className="font-sans text-[12.5px] text-muted m-0 mt-0.5">Browse all compatible fonts with live typography previews</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-line text-muted hover:border-accent hover:text-ink cursor-pointer"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="space-y-3 border-b border-line bg-alt px-5 py-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fonts by name…"
            className="w-full h-9 rounded-[4px] border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />

          <div className="flex flex-wrap gap-1.5">
            {FONT_UI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-[4px] border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'border-accent bg-soft text-accent ring-1 ring-accent'
                    : 'border-line bg-surface text-ink hover:border-accent/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font grid */}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3">
          {visibleFonts.map((font) => (
            <button
              key={font.id}
              type="button"
              onClick={() => {
                onChange(font.id)
                onClose()
              }}
              className={`flex flex-col items-center justify-center rounded-[4px] border p-3 text-center transition-all cursor-pointer ${
                value === font.id
                  ? 'border-accent bg-soft text-accent ring-1 ring-accent'
                  : 'border-line bg-surface hover:border-accent/40'
              }`}
            >
              <span className="truncate text-xl text-ink" style={{ fontFamily: font.previewFamily }}>
                {font.sampleLatin}
              </span>
              <span className="mt-1 block truncate text-[11px] font-medium text-muted">{font.name}</span>
            </button>
          ))}
          {visibleFonts.length === 0 && (
            <p className="col-span-full py-8 text-center text-xs text-muted">No fonts match your search.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-line px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
