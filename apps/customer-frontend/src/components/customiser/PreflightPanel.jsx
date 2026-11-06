import Badge from '../ui/Badge'

const STATUS_LABEL = {
  generating: 'Analyzing geometry…',
  ready: 'Ready to print',
  'ready-with-warnings': 'Ready with notes',
  blocked: 'Manufacturing blocked',
}

const STATUS_TONE = {
  generating: 'neutral',
  ready: 'success',
  'ready-with-warnings': 'warning',
  blocked: 'danger',
}

export default function PreflightPanel({ report, allowDisconnected, onAllowDisconnectedChange }) {
  if (!report) return null
  const errors = report.issues.filter((issue) => issue.severity === 'error')
  const warnings = report.issues.filter((issue) => issue.severity === 'warning')
  const disconnectedOnly = errors.length > 0 && errors.every((issue) => issue.code === 'disconnected')

  const isReady = report.status === 'ready'

  return (
    <div className={`rounded-control p-4 border transition-colors ${
      isReady ? 'bg-[#e8f5ee] border-[#17683f]/30 text-[#17683f]' : 'bg-surface border-line text-ink'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isReady ? (
            <svg className="w-5 h-5 text-[#17683f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 12 5 5 9-10" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z" />
            </svg>
          )}
          <span className={`font-sans text-[13px] font-bold tracking-wide uppercase ${isReady ? 'text-[#17683f]' : 'text-ink'}`}>
            Preflight check
          </span>
        </div>
        <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status] ?? report.status}</Badge>
      </div>

      {report.dimensions && (
        <p className={`mt-2 font-mono text-[12px] ${isReady ? 'text-[#17683f]/80' : 'text-muted'}`}>
          Dimensions: {report.dimensions.widthMm.toFixed(1)} × {report.dimensions.heightMm.toFixed(1)} × {report.dimensions.thicknessMm.toFixed(1)} mm
        </p>
      )}

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1.5 list-none p-0 m-0">
          {errors.map((issue) => (
            <li key={issue.code} className="text-[12.5px] text-[#a82d1a] font-medium flex items-start gap-1.5">
              <span>✕</span>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5 list-none p-0 m-0">
          {warnings.map((issue) => (
            <li key={issue.code} className="text-[12.5px] text-[#8a5c00] font-medium flex items-start gap-1.5">
              <span>!</span>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}

      {disconnectedOnly && (
        <label className="mt-3 flex items-start gap-2 text-[12.5px] text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={allowDisconnected}
            onChange={(e) => onAllowDisconnectedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line bg-surface text-accent"
          />
          <span>Allow separate disconnected geometry pieces</span>
        </label>
      )}
    </div>
  )
}
