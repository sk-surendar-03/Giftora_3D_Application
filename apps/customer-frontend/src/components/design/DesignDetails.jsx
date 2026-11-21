import { describeDesign } from '../../features/customDesign/designLabels.js'

/** The parameters of a standalone custom design, as a compact list (cart, checkout, orders). */
export default function DesignDetails({ params }) {
  const rows = describeDesign(params)
  const itemNote = params?.note
  if (rows.length === 0 && !itemNote) return null
  return (
    <div className="space-y-1">
      {rows.length > 0 && (
        <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-1">
              <dt>{row.label}:</dt>
              <dd className="flex items-center gap-1 text-ink">
                {row.hex && <span className="inline-block h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: row.hex }} aria-hidden="true" />}
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {itemNote && (
        <div className="text-[12px] text-amber-500 font-medium">
          <span className="text-muted">Note:</span> "{itemNote}"
        </div>
      )}
    </div>
  )
}
