export default function StandFactsCard({ dimensions, volumeCm3, validation }) {
  const width = dimensions?.width ? dimensions.width.toFixed(1) : '-'
  const depth = dimensions?.depth ? dimensions.depth.toFixed(1) : '-'
  const height = dimensions?.height ? dimensions.height.toFixed(1) : '-'
  const volume = typeof volumeCm3 === 'number' && volumeCm3 > 0 ? `${volumeCm3.toFixed(1)} cm³` : '-'
  const printable = validation?.validForExport ?? true
  const fitsBed = validation?.fitsBed ?? true

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
          {printable ? 'Ready to print' : 'Adjustment needed'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 min-[761px]:grid-cols-4">
        <div>
          <span className="block text-[11px] text-muted">Dimensions</span>
          <strong className="text-[13px] font-semibold text-ink font-mono">
            {width !== '-' ? `${width} × ${depth} mm` : '-'}
          </strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Height</span>
          <strong className="text-[13px] font-semibold text-ink font-mono">{height !== '-' ? `${height} mm` : '-'}</strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Solid volume</span>
          <strong className="text-[13px] font-semibold text-ink font-mono">{volume}</strong>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Bed fit</span>
          <strong className={`text-[13px] font-semibold ${fitsBed ? 'text-[#17683f]' : 'text-danger'}`}>
            {fitsBed ? 'Fits 220×220 bed' : 'Exceeds print bed'}
          </strong>
        </div>
      </div>
    </div>
  )
}
