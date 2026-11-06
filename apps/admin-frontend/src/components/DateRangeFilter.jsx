const GRANULARITIES = ['day', 'week', 'month']

export default function DateRangeFilter({ from, to, onFromChange, onToChange, granularity, onGranularityChange }) {
  return (
    <div className="flex flex-wrap items-end gap-3 text-ink">
      <label className="text-[13px] font-medium text-muted">
        From
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="mt-1 block h-9 rounded-control border border-line bg-surface px-3 text-[13px] text-ink focus:border-accent focus:outline-none"
        />
      </label>
      <label className="text-[13px] font-medium text-muted">
        To
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="mt-1 block h-9 rounded-control border border-line bg-surface px-3 text-[13px] text-ink focus:border-accent focus:outline-none"
        />
      </label>
      {onGranularityChange && (
        <label className="text-[13px] font-medium text-muted">
          Group by
          <select
            value={granularity}
            onChange={(e) => onGranularityChange(e.target.value)}
            className="mt-1 block h-9 rounded-control border border-line bg-surface px-3 text-[13px] text-ink focus:border-accent focus:outline-none cursor-pointer"
          >
            {GRANULARITIES.map((g) => (
              <option key={g} value={g} className="bg-surface text-ink">
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
