export default function ColorSwatchPicker({ label, colors, value, onChange }) {
  if (!colors || colors.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="block font-sans text-[13px] font-bold tracking-[0.04em] text-ink">
          {label}
        </span>
        {value && <span className="font-sans text-[13px] text-muted">{value.label}</span>}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const isSelected = value?.label === color.label
          return (
            <button
              key={color.label}
              type="button"
              onClick={() => onChange(color)}
              aria-pressed={isSelected}
              aria-label={color.label}
              title={color.label}
              className={`h-7 w-7 rounded-full transition-transform cursor-pointer relative ${
                isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg scale-105' : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: color.hex,
                boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.4)',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
