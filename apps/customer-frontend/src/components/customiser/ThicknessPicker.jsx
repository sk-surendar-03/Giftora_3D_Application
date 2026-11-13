import { THICKNESS_OPTIONS } from '../../features/customiser/thicknessOptions'

// options: array of { key, label, mm, priceCents } built from admin settings in Customiser
// If not passed, falls back to hardcoded THICKNESS_OPTIONS
export default function ThicknessPicker({ value, onChange, options }) {
  const entries = options
    ? options.map((o) => [o.key, o])
    : Object.entries(THICKNESS_OPTIONS).map(([key, opt]) => [
        key,
        { key, label: opt.label, mm: opt.baseThicknessMm, displayValue: opt.baseThicknessMm, displayUnit: 'mm', priceCents: 0 },
      ])

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {entries.map(([key, option]) => {
        const isSelected = value === key
        const priceLabel = option.priceCents > 0
          ? `₹${(option.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`
          : 'Included'

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={isSelected}
            className={`rounded-control border p-3.5 text-left transition-colors cursor-pointer flex flex-col gap-2 ${
              isSelected
                ? 'border-accent bg-soft ring-1 ring-accent'
                : 'border-line bg-surface hover:border-accent/40'
            }`}
          >
            {/* Top row: name + mm badge */}
            <div className="flex items-center justify-between gap-2">
              <span className={`font-sans text-[14px] font-semibold ${isSelected ? 'text-accent' : 'text-ink'}`}>
                {option.label}
              </span>
              <span className={`text-[11px] font-bold rounded-[3px] border px-[6px] py-[2px] tabular-nums ${
                isSelected
                  ? 'text-accent border-accent/30 bg-accent/8'
                  : 'text-muted border-line bg-alt'
              }`}>
                {option.displayValue ?? option.mm} {option.displayUnit ?? 'mm'}
              </span>
            </div>

            {/* Spec rows */}
            <div className={`flex flex-col gap-[3px] pt-2 border-t ${isSelected ? 'border-accent/20' : 'border-line'}`}>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] text-muted">Base thickness</span>
                <span className={`font-sans text-[11px] font-semibold tabular-nums ${isSelected ? 'text-accent' : 'text-ink'}`}>
                  {option.displayValue ?? option.mm} {option.displayUnit ?? 'mm'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] text-muted">Price</span>
                <span className={`font-sans text-[11px] font-semibold ${isSelected ? 'text-accent' : 'text-ink'}`}>
                  {priceLabel}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
