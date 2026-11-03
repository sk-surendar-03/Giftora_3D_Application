import Badge from '../ui/Badge'

const STATUS_LABEL = {
  generating: 'Generating…',
  ready: 'Ready to print',
  'ready-with-warnings': 'Ready, with warnings',
  blocked: 'Not ready',
}

const STATUS_TONE = {
  generating: 'neutral',
  ready: 'success',
  'ready-with-warnings': 'accent',
  blocked: 'danger',
}

/**
 * Displays the real preflight report (Step d's `buildPreflightReport`) —
 * errors, warnings, and the overall printable/status verdict for the
 * *current* generated geometry. Corresponds to whatever `report` is passed,
 * so a caller must always pass the report for the latest result (never a
 * stale one) — the parent page is responsible for that, same as it is for
 * the 3D preview.
 */
export default function PreflightPanel({ report, allowDisconnected, onAllowDisconnectedChange }) {
  if (!report) return null
  const errors = report.issues.filter((issue) => issue.severity === 'error')
  const warnings = report.issues.filter((issue) => issue.severity === 'warning')
  const disconnectedOnly = errors.length > 0 && errors.every((issue) => issue.code === 'disconnected')

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Printability</h2>
        <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status] ?? report.status}</Badge>
      </div>

      {report.dimensions && (
        <p className="mt-2 text-xs text-muted">
          {report.dimensions.widthMm.toFixed(1)} × {report.dimensions.heightMm.toFixed(1)} × {report.dimensions.thicknessMm.toFixed(1)} mm
        </p>
      )}

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {errors.map((issue) => (
            <li key={issue.code} className="text-xs text-danger">
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {warnings.map((issue) => (
            <li key={issue.code} className="text-xs text-accent-dark">
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      {disconnectedOnly && (
        <label className="mt-3 flex items-start gap-2 text-xs text-ink">
          <input
            type="checkbox"
            checked={allowDisconnected}
            onChange={(e) => onAllowDisconnectedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
          />
          This design prints as separate parts — I understand and want to export it anyway.
        </label>
      )}
    </div>
  )
}
