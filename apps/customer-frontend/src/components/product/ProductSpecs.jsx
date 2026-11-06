export default function ProductSpecs({ product }) {
  const colourValue = product.colorsByMaterial
    ? Object.entries(product.colorsByMaterial)
        .map(([material, colors]) => `${material}: ${colors.map((c) => c.label).join(', ')}`)
        .join(' · ')
    : product.colors?.map((c) => c.label).join(', ')

  const rows = [
    { label: 'Category', value: product.category },
    { label: 'Material', value: product.materials?.join(', ') ?? product.material },
    { label: 'Available sizes', value: product.sizes?.join(', ') },
    { label: 'Finishes', value: colourValue },
  ].filter((row) => row.value)

  if (rows.length === 0) return null

  return (
    <div className="border-t border-line pt-6">
      <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
        Specifications
      </h3>
      <dl className="mt-3.5 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 text-[13.5px]">
            <dt className="w-36 shrink-0 text-muted">{row.label}</dt>
            <dd className="text-ink font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
