import React from 'react'

export default function QRStandFactsCard() {
  return (
    <div className="rounded-card border border-line bg-surface p-5 text-ink text-xs space-y-3 shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <h4 className="font-sans font-bold uppercase tracking-wider text-accent text-[11px] m-0">
          3D QR Engineering Standards
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3 text-muted">
        <div>
          <span className="block font-semibold text-ink">Print Resolution</span>
          <span>0.16mm Layer Height</span>
        </div>
        <div>
          <span className="block font-semibold text-ink">Scan Reliability</span>
          <span>Level H (30% ECC)</span>
        </div>
        <div>
          <span className="block font-semibold text-ink">Multi-Material</span>
          <span>Dual Extrusion Inlay</span>
        </div>
        <div>
          <span className="block font-semibold text-ink">Optical Verification</span>
          <span>Pre-Flight Scanned</span>
        </div>
      </div>

      <p className="text-[11px] text-muted leading-relaxed pt-1 border-t border-line">
        Precision-manufactured with weighted ergonomic desktop pedestals. Suitable for Indian UPI barcodes, high-speed Wi-Fi onboarding, and instant customer Google Reviews.
      </p>
    </div>
  )
}
