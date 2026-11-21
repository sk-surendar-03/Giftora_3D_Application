export default function NameplateDetails({ config, nameplateType }) {
  if (!config && !nameplateType) return null

  const type = nameplateType || config?.plateType || 'Nameplate'
  const shape = config?.shape
  const mounting = config?.mountingStyle
  const finish = config?.finish
  const textCfg = config?.text || {}
  const line1 = textCfg.line1 || config?.line1
  const width = config?.widthMm || config?.dimensions?.width
  const height = config?.heightMm || config?.dimensions?.height
  const itemNote = config?.note

  return (
    <div className="space-y-1">
      <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
        <div className="flex gap-1">
          <dt>Type:</dt>
          <dd className="text-ink font-medium capitalize">{String(type).replace(/-/g, ' ')}</dd>
        </div>
        {shape && (
          <div className="flex gap-1">
            <dt>Shape:</dt>
            <dd className="text-ink font-medium capitalize">{String(shape).replace(/-/g, ' ')}</dd>
          </div>
        )}
        {line1 && (
          <div className="flex gap-1">
            <dt>Text:</dt>
            <dd className="text-ink font-medium">"{line1}"</dd>
          </div>
        )}
        {mounting && (
          <div className="flex gap-1">
            <dt>Mounting:</dt>
            <dd className="text-ink font-medium capitalize">{String(mounting).replace(/-/g, ' ')}</dd>
          </div>
        )}
        {finish && (
          <div className="flex gap-1">
            <dt>Finish:</dt>
            <dd className="text-ink font-medium capitalize">{String(finish).replace(/-/g, ' ')}</dd>
          </div>
        )}
        {width && height && (
          <div className="flex gap-1">
            <dt>Size:</dt>
            <dd className="text-ink font-medium">{width} × {height} mm</dd>
          </div>
        )}
      </dl>
      {itemNote && (
        <div className="text-[12px] text-amber-500 font-medium">
          <span className="text-muted">Note:</span> "{itemNote}"
        </div>
      )}
    </div>
  )
}
