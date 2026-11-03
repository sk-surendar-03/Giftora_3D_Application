import { THICKNESS_OPTIONS } from '../../features/customiser/thicknessOptions'

export default function ThicknessPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(THICKNESS_OPTIONS).map(([key, option]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={`rounded-control border-2 p-3 text-left transition-colors ${
            value === key ? 'border-ink bg-ink/5' : 'border-border hover:border-ink/30'
          }`}
        >
          <span className="block text-sm font-semibold text-ink">{option.label}</span>
          <span className="block text-xs text-muted">{option.description}</span>
          <span className="mt-1 block text-xs text-muted">{option.baseThicknessMm} mm</span>
        </button>
      ))}
    </div>
  )
}
