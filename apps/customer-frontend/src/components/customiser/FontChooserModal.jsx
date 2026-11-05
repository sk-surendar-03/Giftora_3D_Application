import { useState } from 'react'
import '../customiser/fontPreview.css'
import { FONT_UI_CATEGORIES, fontsForUiCategory } from '../../features/customiser/fontUiCategories'

export default function FontChooserModal({ open, onClose, fonts, value, onChange }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (!open) return null

  const categoryFiltered = fontsForUiCategory(fonts, activeCategory)
  const visibleFonts = categoryFiltered.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-card border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Choose Font Style</h2>
            <p className="text-xs text-muted">Browse all compatible fonts with live typography previews</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted hover:border-ink hover:text-ink"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="space-y-3 border-b border-border bg-paper/50 px-5 py-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fonts by name…"
            className="w-full rounded-control border border-border bg-surface px-3 py-1.5 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />

          <div className="flex flex-wrap gap-1.5">
            {FONT_UI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'border-ink bg-ink text-paper'
                    : 'border-border bg-surface text-ink hover:border-ink/40'
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
              className={`flex flex-col items-center justify-center rounded-control border-2 p-3 text-center transition-all ${
                value === font.id
                  ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                  : 'border-border bg-surface hover:border-ink/40'
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
        <div className="flex justify-end border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border border-border bg-surface px-4 py-2 text-xs font-semibold text-ink hover:border-ink"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
