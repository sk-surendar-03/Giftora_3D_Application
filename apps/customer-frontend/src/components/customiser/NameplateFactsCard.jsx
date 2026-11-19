import React from 'react'

export default function NameplateFactsCard() {
  return (
    <div className="rounded-card border border-line bg-surface p-5 text-ink space-y-3">
      <h4 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0">
        Manufacturing & Durability
      </h4>
      <div className="space-y-2 text-[12.5px] text-muted leading-relaxed">
        <p>
          <strong className="text-ink">Architectural PLA+:</strong> Fabricated with high-grade, UV-stabilised biopolymers featuring low thermal distortion and scratch-resistant satin finishes.
        </p>
        <p>
          <strong className="text-ink">Dual-Layer Adhesion:</strong> Multi-color letters and border frames are molecularly fused onto the solid base plate during extrusion for zero delamination risk.
        </p>
        <p>
          <strong className="text-ink">Mounting Hardware:</strong> Suitable for standard wall screws, heavy-duty 3M command tape, or freestanding angled desk placement with integrated support ribs.
        </p>
      </div>
    </div>
  )
}
