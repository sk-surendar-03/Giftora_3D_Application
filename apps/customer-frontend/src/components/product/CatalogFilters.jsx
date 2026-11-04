import Button from '../ui/Button'

function CheckboxGroup({ title, options, selected, onToggle }) {
  if (options.length === 0) return null
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 space-y-2.5">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
            />
            {option}
          </label>
        ))}
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
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Filters</h2>
        {hasActiveFilters && (
          <button type="button" onClick={onClearAll} className="text-sm font-medium text-accent-dark hover:underline">
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
        <Button variant="secondary" className="w-full sm:hidden" onClick={onClearAll}>
          Clear all filters
        </Button>
      )}
    </div>
  )
}
