// Minimal CSS-only bar chart — no charting library dependency. Takes
// `data` as [{ label, value }], scales bar heights against the max value.
export default function SimpleBarChart({ data, formatValue = (v) => v }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-400">No data for this range.</p>
  }

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex h-40 items-end gap-1.5 overflow-x-auto">
      {data.map((d) => (
        <div key={d.label} className="flex min-w-8 flex-1 flex-col items-center gap-1" title={`${d.label}: ${formatValue(d.value)}`}>
          <div className="flex w-full flex-1 items-end">
            <div className="w-full rounded-t bg-gray-900" style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} />
          </div>
          <span className="w-full truncate text-center text-[10px] text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
