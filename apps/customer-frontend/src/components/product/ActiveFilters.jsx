function Chip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft py-1 pr-1.5 pl-3 text-xs font-medium text-accent-dark">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${children}`}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-accent-dark/15"
      >
        ×
      </button>
    </span>
  )
}

export default function ActiveFilters({ filters, onRemoveCategory, onRemoveMaterial, onClearSearch, onClearAll }) {
  const hasAny =
    filters.search.trim() || filters.categories.length > 0 || filters.materials.length > 0

  if (!hasAny) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.search.trim() && <Chip onRemove={onClearSearch}>"{filters.search.trim()}"</Chip>}
      {filters.categories.map((category) => (
        <Chip key={category} onRemove={() => onRemoveCategory(category)}>
          {category}
        </Chip>
      ))}
      {filters.materials.map((material) => (
        <Chip key={material} onRemove={() => onRemoveMaterial(material)}>
          {material}
        </Chip>
      ))}
      <button type="button" onClick={onClearAll} className="text-xs font-medium text-muted hover:text-ink">
        Clear all
      </button>
    </div>
  )
}
