export default function OptionPicker({ label, options, value, onChange }) {
  if (!options || options.length === 0) return null
  const normalized = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option))

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="block font-sans text-[13px] font-bold tracking-[0.04em] text-ink">{label}</span>
        {value && <span className="font-sans text-[13px] text-muted">{value}</span>}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {normalized.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isSelected}
              className={`h-[44px] px-[18px] rounded-control border text-[14px] font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'border-accent bg-soft text-accent ring-1 ring-accent'
                  : 'border-line bg-surface text-ink hover:border-accent/40'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
