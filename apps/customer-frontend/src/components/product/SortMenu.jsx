import { SORT_OPTIONS } from '../../features/products/filters'

export default function SortMenu({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-[14px] text-ink font-sans">
      <span className="hidden text-muted sm:inline text-[13.5px]">Sort by:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-control border border-line bg-surface px-3 text-[14px] text-ink focus:border-accent focus:outline-none cursor-pointer"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface text-ink">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
