// Renders an order's `shippingAddress` snapshot (captured at order time —
// see Phase 9), not a live address lookup, so it stays accurate even if the
// customer later edits or deletes the real address.
export default function OrderAddressSummary({ address }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 text-sm">
      <p className="font-medium text-ink">{address.fullName}</p>
      <p className="mt-0.5 text-muted">{address.phone}</p>
      <p className="mt-1 text-ink">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}, {address.country}
      </p>
    </div>
  )
}
