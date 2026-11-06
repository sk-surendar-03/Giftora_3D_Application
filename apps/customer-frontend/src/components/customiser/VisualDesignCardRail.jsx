export default function VisualDesignCardRail({ label, items, value, onChange }) {
  if (!items || items.length === 0) return null

  return (
    <div>
      {label && <span className="block font-sans text-[12px] font-bold text-accent uppercase tracking-[0.14em] mb-2">{label}</span>}
      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5">
        {items.map((item) => {
          const isSelected = value === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-pressed={isSelected}
              className={`group relative flex w-32 shrink-0 flex-col overflow-hidden rounded-[4px] border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-accent bg-soft ring-1 ring-accent'
                  : 'border-line bg-surface hover:border-accent/40'
              }`}
            >
              {/* Image thumbnail */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-alt">
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
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-on-accent">
                    ✓
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="p-2">
                <span className={`block truncate text-[12px] font-semibold transition-colors ${
                  isSelected ? 'text-accent' : 'text-ink group-hover:text-accent'
                }`}>
                  {item.name}
                </span>
                {item.description && (
                  <span className="mt-0.5 block line-clamp-1 text-[10.5px] text-muted">
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
