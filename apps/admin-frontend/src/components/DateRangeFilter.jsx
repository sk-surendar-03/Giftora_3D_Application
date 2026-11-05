const GRANULARITIES = ['day', 'week', 'month']

export default function DateRangeFilter({ from, to, onFromChange, onToChange, granularity, onGranularityChange }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-gray-600">
        From
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
      </label>
      <label className="text-sm text-gray-600">
        To
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
      </label>
      {onGranularityChange && (
        <label className="text-sm text-gray-600">
          Group by
          <select value={granularity} onChange={(e) => onGranularityChange(e.target.value)} className="mt-1 block rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            {GRANULARITIES.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
