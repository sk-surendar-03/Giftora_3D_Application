/**
 * `options` may be an array of plain strings (value === label, the original
 * shape every existing caller uses) or an array of `{ value, label }`
 * objects, for cases where the underlying value isn't the display text
 * (e.g. a style id like "soft-tag" shown as "Soft Tag").
 */
export default function OptionPicker({ label, options, value, onChange }) {
  if (!options || options.length === 0) return null
  const normalized = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option))

  return (
    <div>
      <span className="block text-sm font-medium text-ink">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {normalized.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`rounded-control border px-3.5 py-2 text-sm font-medium transition-colors ${
              value === option.value
                ? 'border-ink bg-ink text-paper'
                : 'border-border text-ink hover:border-ink/30'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
