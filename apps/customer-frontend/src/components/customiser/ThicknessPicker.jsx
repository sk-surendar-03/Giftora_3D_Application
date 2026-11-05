import { THICKNESS_OPTIONS } from '../../features/customiser/thicknessOptions'

export default function ThicknessPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(THICKNESS_OPTIONS).map(([key, option]) => {
        const isSelected = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={isSelected}
            className={`rounded-control border p-3.5 text-left transition-colors cursor-pointer ${
              isSelected
                ? 'border-accent bg-soft text-accent ring-1 ring-accent'
                : 'border-line bg-surface text-ink hover:border-accent/40'
            }`}
          >
            <span className={`block font-sans text-[14px] font-semibold ${isSelected ? 'text-accent' : 'text-ink'}`}>
              {option.label}
            </span>
            <span className="block font-sans text-[12px] text-muted mt-0.5">{option.description}</span>
            <span className="mt-1 block font-sans text-[11.5px] font-medium text-muted">{option.baseThicknessMm} mm</span>
          </button>
        )
      })}
    </div>
  )
}
