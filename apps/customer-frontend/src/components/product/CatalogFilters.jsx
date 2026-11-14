import Button from '../ui/Button'

function CheckboxGroup({ title, options, selected, onToggle }) {
  if (options.length === 0) return null
  return (
    <div>
      <h4 className="font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-ink mb-3">
        {title}
      </h4>
      <div className="space-y-2.5">
        {options.map((option) => {
          const isChecked = selected.includes(option)
          return (
            <label key={option} className="flex items-center gap-2.5 text-[14px] text-ink cursor-pointer group">
              <span className={`flex h-5 w-5 items-center justify-center rounded-[4px] border transition-colors ${
                isChecked
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-line bg-surface group-hover:border-accent/60'
              }`}>
                {isChecked && (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(option)}
                className="sr-only"
              />
              <span>{option}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function CatalogFilters({
  categories,
  materials,
  filters,
  onToggleCategory,
  onToggleMaterial,
  onClearAll,
  hasActiveFilters,
}) {
  return (
    <div className="space-y-7 rounded-card border border-line bg-surface p-5">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[13px] font-semibold text-accent hover:underline cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <CheckboxGroup
        title="Category"
        options={categories}
        selected={filters.categories}
        onToggle={onToggleCategory}
      />

      <CheckboxGroup
        title="Material"
        options={materials}
        selected={filters.materials}
        onToggle={onToggleMaterial}
      />

      {hasActiveFilters && (
        <Button variant="secondary" size="sm" className="w-full min-[761px]:hidden" onClick={onClearAll}>
          Reset all filters
        </Button>
      )}
    </div>
  )
}
