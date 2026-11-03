export default function ColorSwatchPicker({ label, colors, value, onChange }) {
  if (!colors || colors.length === 0) return null

  return (
    <div>
      <span className="block text-sm font-medium text-ink">
        {label} {value && <span className="font-normal text-muted">— {value.label}</span>}
      </span>
      <div className="mt-2 flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color.label}
            type="button"
            onClick={() => onChange(color)}
            aria-pressed={value?.label === color.label}
            aria-label={color.label}
            title={color.label}
            className={`h-9 w-9 rounded-full border-2 transition-colors ${
              value?.label === color.label ? 'border-ink' : 'border-transparent'
            }`}
            style={{
              backgroundColor: color.hex,
              boxShadow: 'inset 0 0 0 1px rgba(26, 23, 18, 0.15)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
