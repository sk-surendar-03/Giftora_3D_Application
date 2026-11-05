export default function PrintFactsCard({ report, dimensions }) {
  const width = dimensions?.widthMm ? dimensions.widthMm.toFixed(1) : '-'
  const height = dimensions?.heightMm ? dimensions.heightMm.toFixed(1) : '-'
  const thickness = dimensions?.thicknessMm ? `${dimensions.thicknessMm.toFixed(1)} mm` : '-'
  const parts = report?.partsCount ?? 1
  const printable = report?.printable ?? true

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <h3 className="text-xs font-bold tracking-wider text-muted uppercase">Print facts</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            printable ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${printable ? 'bg-success' : 'bg-danger'}`} />
          {printable ? 'Ready to print' : 'Issues detected'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <span className="block text-[11px] text-muted">Model size</span>
          <strong className="text-xs font-semibold text-ink">
            {width !== '-' ? `${width} × ${height} mm` : '-'}
          </strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Thickness</span>
          <strong className="text-xs font-semibold text-ink">{thickness}</strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Printable parts</span>
          <strong className="text-xs font-semibold text-ink">{parts}</strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Fit status</span>
          <strong className={`text-xs font-semibold ${printable ? 'text-success' : 'text-danger'}`}>
            {printable ? 'Fits envelope' : 'Exceeds size'}
          </strong>
        </div>
      </div>
    </div>
  )
}
