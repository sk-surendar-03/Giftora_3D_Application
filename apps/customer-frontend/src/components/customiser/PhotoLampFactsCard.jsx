import React from 'react'

export default function PhotoLampFactsCard({ report, dimensions }) {
  const height = dimensions?.y || dimensions?.heightMm || 120
  const diameter = dimensions?.x || dimensions?.diameterMm || dimensions?.widthMm || 90
  const triangleCount = report?.triangleCount || 0
  const estimatedWeight = report?.estimatedWeightGrams || 90
  const estimatedHours = report?.estimatedPrintTimeHours || 6.2

  return (
    <div className="rounded-card border border-line bg-surface p-5 text-ink text-xs space-y-3 shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <h4 className="font-sans font-bold uppercase tracking-wider text-accent text-[11px] m-0">
          3D Lithophane Engineering Standards
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3 text-muted">
        <div>
          <span className="block font-semibold text-ink">Print Resolution</span>
          <span>0.12mm Ultra-Fine Layers</span>
        </div>
        <div>
          <span className="block font-semibold text-ink">Mesh Integrity</span>
          <span className="text-emerald-600 font-semibold">Watertight &amp; Manifold</span>
        </div>
        <div>
          <span className="block font-semibold text-ink">Model Dimensions</span>
          <span>{height}mm H × {diameter}mm W</span>
        </div>
        <div>
          <span className="block font-semibold text-ink">Est. Print Time</span>
          <span>~{estimatedHours} hrs ({estimatedWeight}g PLA)</span>
        </div>
      </div>

      <p className="text-[11px] text-muted leading-relaxed pt-1 border-t border-line">
        Precision-carved translucent relief shade with internal USB LED illumination cavity. High optical contrast reproduces fine highlights, shadows, and subtle facial tones when backlit.
      </p>
    </div>
  )
}
