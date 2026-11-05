import { useState } from 'react'
import './fontPreview.css'
import { FONT_UI_CATEGORIES, fontsForUiCategory } from '../../features/customiser/fontUiCategories'
import FontChooserModal from './FontChooserModal'

export default function FontPickerCards({ fonts, value, onChange }) {
  const [activeCategory, setActiveCategory] = useState('retro-fun')
  const [modalOpen, setModalOpen] = useState(false)
  const visibleFonts = fontsForUiCategory(fonts, activeCategory)

  return (
    <div className="space-y-3">
      {/* Category Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FONT_UI_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={`shrink-0 rounded-[4px] border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
              activeCategory === category.id
                ? 'border-accent bg-soft text-accent ring-1 ring-accent'
                : 'border-line bg-surface text-ink hover:border-accent/40'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Horizontal Scrolling Font Cards */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5">
        {visibleFonts.map((font) => {
          const isSelected = value === font.id
          return (
            <button
              key={font.id}
              type="button"
              onClick={() => onChange(font.id)}
              aria-pressed={isSelected}
              className={`group flex w-28 shrink-0 flex-col items-center justify-between rounded-[4px] border p-2.5 text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-accent bg-soft text-accent ring-1 ring-accent'
                  : 'border-line bg-surface hover:border-accent/40'
              }`}
            >
              <div className="my-auto flex h-10 w-full items-center justify-center">
                <span className="truncate text-xl text-ink" style={{ fontFamily: font.previewFamily }}>
                  {font.sampleLatin}
                </span>
              </div>
              <span
                className={`block w-full truncate border-t pt-1.5 text-[11px] font-medium transition-colors ${
                  isSelected ? 'border-accent/30 text-accent font-semibold' : 'border-line text-muted group-hover:text-ink'
                }`}
              >
                {font.name}
              </span>
            </button>
          )
        })}
        {visibleFonts.length === 0 && (
          <p className="py-4 text-xs text-muted">No fonts in this category.</p>
        )}
      </div>

      {/* Show All button */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-[4px] border border-line bg-surface py-2 text-[12.5px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent cursor-pointer"
      >
        <span>Browse all fonts</span>
        <span className="text-[11px] text-muted">({fonts.length})</span>
      </button>

      {/* Full Modal */}
      <FontChooserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fonts={fonts}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
