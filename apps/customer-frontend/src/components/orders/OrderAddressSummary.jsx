export default function OrderAddressSummary({ address }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 text-[14px]">
      <p className="font-semibold text-ink m-0">{address.fullName}</p>
      <p className="mt-1 text-[13px] text-muted m-0">{address.phone}</p>
      <p className="mt-1.5 text-ink m-0 leading-relaxed">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}, {address.country}
      </p>
    </div>
  )
}
