import { SORT_OPTIONS } from '../../features/products/filters'

export default function SortMenu({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <span className="hidden text-muted sm:inline">Sort by</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
