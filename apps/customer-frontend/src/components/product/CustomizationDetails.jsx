const CUSTOMIZATION_LABELS = {
  text: 'Text',
  font: 'Font',
  material: 'Material',
  color: 'Colour',
  size: 'Size',
}

// Shared by the Cart and Checkout pages — renders whatever customization
// fields were recorded when the item was added (see useCart's addToCart
// payloads in ProductDetail.jsx / CustomizationSummary.jsx), without
// assuming every field is present.
export default function CustomizationDetails({ customization }) {
  if (!customization) return null
  const rows = Object.entries(CUSTOMIZATION_LABELS)
    .map(([key, label]) => {
      const value = customization[key]
      if (!value) return null
      const display = typeof value === 'object' ? (value.label ?? value.name ?? JSON.stringify(value)) : value
      return { label, display }
    })
    .filter(Boolean)

  if (rows.length === 0) return null

  return (
    <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-1">
          <dt>{row.label}:</dt>
          <dd className="text-ink">{row.display}</dd>
        </div>
      ))}
    </dl>
  )
}
