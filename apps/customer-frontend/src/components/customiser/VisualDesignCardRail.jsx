export default function VisualDesignCardRail({ label, items, value, onChange }) {
  if (!items || items.length === 0) return null

  return (
    <div>
      {label && <span className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">{label}</span>}
      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5">
        {items.map((item) => {
          const isSelected = value === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-pressed={isSelected}
              className={`group relative flex w-32 shrink-0 flex-col overflow-hidden rounded-control border-2 text-left transition-all ${
                isSelected
                  ? 'border-accent ring-2 ring-accent/20 shadow-md'
                  : 'border-border bg-surface hover:border-ink/40 hover:shadow-xs'
              }`}
            >
              {/* Image thumbnail */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-paper">
                {item.previewSrc ? (
                  <img
                    src={item.previewSrc}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                    {item.name}
                  </div>
                )}
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white shadow-xs">
                    ✓
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="p-2">
                <span className={`block truncate text-xs font-semibold transition-colors ${
                  isSelected ? 'text-accent-dark' : 'text-ink group-hover:text-accent-dark'
                }`}>
                  {item.name}
                </span>
                {item.description && (
                  <span className="mt-0.5 block line-clamp-1 text-[10px] text-muted">
                    {item.description}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
