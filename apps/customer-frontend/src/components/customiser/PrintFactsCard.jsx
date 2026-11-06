export default function PrintFactsCard({ report, dimensions }) {
  const width = dimensions?.widthMm ? dimensions.widthMm.toFixed(1) : '-'
  const height = dimensions?.heightMm ? dimensions.heightMm.toFixed(1) : '-'
  const thickness = dimensions?.thicknessMm ? `${dimensions.thicknessMm.toFixed(1)} mm` : '-'
  const parts = report?.partsCount ?? 1
  const printable = report?.printable ?? true

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <h4 className="font-sans text-[11.5px] font-bold tracking-[0.14em] text-muted uppercase m-0">Print facts</h4>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            printable ? 'bg-[#e3f4ea] text-[#17683f]' : 'bg-[#fbe6e2] text-[#a82d1a]'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${printable ? 'bg-[#17683f]' : 'bg-[#a82d1a]'}`} />
          {printable ? 'Ready to print' : 'Issues detected'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <span className="block text-[11px] text-muted">Model size</span>
          <strong className="text-[13px] font-semibold text-ink font-mono">
            {width !== '-' ? `${width} × ${height} mm` : '-'}
          </strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Thickness</span>
          <strong className="text-[13px] font-semibold text-ink font-mono">{thickness}</strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Printable parts</span>
          <strong className="text-[13px] font-semibold text-ink font-mono">{parts}</strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Fit status</span>
          <strong className={`text-[13px] font-semibold ${printable ? 'text-[#17683f]' : 'text-danger'}`}>
            {printable ? 'Fits envelope' : 'Exceeds size'}
          </strong>
        </div>
      </div>
    </div>
  )
}
