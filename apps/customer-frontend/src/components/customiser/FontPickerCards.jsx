import { useState } from 'react'
import './fontPreview.css'
import { FONT_UI_CATEGORIES, fontsForUiCategory } from '../../features/customiser/fontUiCategories'

/**
 * Horizontal-scrolling font preview cards, grouped by the reference
 * design's category tabs. Backed entirely by the real, existing
 * `FONT_CATALOG` (filtered by `fontOptions` for template validity) — no
 * fonts are added or invented here, only grouped and previewed.
 */
export default function FontPickerCards({ fonts, value, onChange }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const visibleFonts = fontsForUiCategory(fonts, activeCategory)

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FONT_UI_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === category.id ? 'border-ink bg-ink text-paper' : 'border-border text-ink hover:border-ink/30'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {visibleFonts.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => onChange(font.id)}
            aria-pressed={value === font.id}
            className={`flex w-28 shrink-0 flex-col items-center gap-1.5 rounded-control border-2 p-3 text-center transition-colors ${
              value === font.id ? 'border-ink bg-ink/5' : 'border-border hover:border-ink/30'
            }`}
          >
            <span className="truncate text-lg text-ink" style={{ fontFamily: font.previewFamily }}>
              {font.sampleLatin}
            </span>
            <span className="truncate text-[11px] text-muted">{font.name}</span>
          </button>
        ))}
        {visibleFonts.length === 0 && <p className="text-xs text-muted">No fonts in this category for the current keychain type.</p>}
      </div>
    </div>
  )
}
