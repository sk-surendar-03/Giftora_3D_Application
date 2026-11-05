export default function SimpleBarChart({ data, formatValue = (v) => v }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted">No data for this range.</p>
  }

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div
      className="relative flex h-48 items-end gap-2.5 overflow-x-auto pt-6 pb-2"
      style={{
        backgroundImage: 'repeating-linear-gradient(to top, transparent, transparent 38px, rgba(38,38,38,0.8) 38px, rgba(38,38,38,0.8) 40px)',
      }}
    >
      {data.map((d, index) => {
        const isHighlight = index === data.length - 1
        return (
          <div key={d.label} className="flex min-w-8 flex-1 flex-col items-center gap-2 group cursor-pointer" title={`${d.label}: ${formatValue(d.value)}`}>
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-[6px] transition-all group-hover:opacity-90 ${
                  isHighlight ? 'bg-accent shadow-[0_0_12px_rgba(217,174,78,0.3)]' : 'bg-[#463A1F]'
                }`}
                style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
              />
            </div>
            <span className="w-full truncate text-center text-[11px] font-mono text-muted group-hover:text-ink">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
