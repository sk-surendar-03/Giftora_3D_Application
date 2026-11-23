import React from 'react'

export default function QrStandDetails({ config, templateId, qrType }) {
  if (!config && !templateId && !qrType) return null

  const template = templateId || config?.templateId || 'QR Stand'
  const type = qrType || config?.qrType || config?.qrCodes?.[0]?.type || 'URL'
  const printMode = config?.printMode || config?.printingMode || 'raised'
  const dims = config?.dimensions || {}
  const width = dims.widthMm
  const height = dims.heightMm
  const itemNote = config?.note

  return (
    <div className="space-y-1">
      <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
        <div className="flex gap-1">
          <dt>Template:</dt>
          <dd className="text-ink font-medium capitalize">{String(template).replace(/_/g, ' ')}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Payload:</dt>
          <dd className="text-ink font-medium font-mono uppercase">{String(type).replace(/_/g, ' ')}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Mode:</dt>
          <dd className="text-ink font-medium capitalize">{String(printMode)}</dd>
        </div>
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
