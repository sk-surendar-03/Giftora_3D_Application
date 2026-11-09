const GRANULARITIES = ['day', 'week', 'month']

export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  allTime = false,
  onAllTimeChange,
  onApply,
  onReset,
  granularity,
  onGranularityChange,
}) {
  const isInvalidRange = !allTime && from && to && from > to

  return (
    <div className="flex flex-wrap items-end gap-3 text-ink">
      <label className="text-[13px] font-medium text-muted">
        From
        <input
          type="date"
          value={from}
          disabled={allTime}
          onChange={(e) => onFromChange(e.target.value)}
          className={`mt-1 block h-9 rounded-control border border-line bg-surface px-3 text-[13px] text-ink focus:border-accent focus:outline-none ${
            allTime ? 'opacity-50 cursor-not-allowed bg-alt' : ''
          } ${isInvalidRange ? 'border-danger' : ''}`}
        />
      </label>

      <label className="text-[13px] font-medium text-muted">
        To
        <input
          type="date"
          value={to}
          disabled={allTime}
          onChange={(e) => onToChange(e.target.value)}
          className={`mt-1 block h-9 rounded-control border border-line bg-surface px-3 text-[13px] text-ink focus:border-accent focus:outline-none ${
            allTime ? 'opacity-50 cursor-not-allowed bg-alt' : ''
          } ${isInvalidRange ? 'border-danger' : ''}`}
        />
      </label>

      {onAllTimeChange && (
        <label className="flex items-center gap-2 h-9 px-2 text-[13px] font-medium text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allTime}
            onChange={(e) => onAllTimeChange(e.target.checked)}
            className="h-4 w-4 rounded border-line text-accent accent-accent focus:ring-accent cursor-pointer"
          />
          <span>All time</span>
        </label>
      )}

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

      {onApply && (
        <button
          type="button"
          onClick={onApply}
          disabled={isInvalidRange}
          className="h-9 px-4 rounded-control bg-accent text-on-accent text-[13px] font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Apply
        </button>
      )}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="h-9 px-3 rounded-control border border-line bg-surface text-muted hover:text-ink text-[13px] font-medium transition-colors cursor-pointer"
        >
          Reset
        </button>
      )}

      {isInvalidRange && (
        <p className="w-full text-xs text-danger font-medium -mt-1">
          "From" date must not be later than "To" date.
        </p>
      )}
    </div>
  )
}
