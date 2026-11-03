export default function ProductSpecs({ product }) {
  // When colours differ by material (e.g. Standard PLA vs Silk Metallic
  // PLA), list each material's own colours rather than just the default
  // material's — otherwise this would silently omit real options.
  const colourValue = product.colorsByMaterial
    ? Object.entries(product.colorsByMaterial)
        .map(([material, colors]) => `${material}: ${colors.map((c) => c.label).join(', ')}`)
        .join(' · ')
    : product.colors?.map((c) => c.label).join(', ')

  const rows = [
    { label: 'Category', value: product.category },
    { label: 'Material', value: product.materials?.join(', ') ?? product.material },
    { label: 'Available sizes', value: product.sizes?.join(', ') },
    { label: 'Available colours', value: colourValue },
  ].filter((row) => row.value)

  if (rows.length === 0) return null

  return (
    <div className="border-t border-border pt-6">
      <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">Specifications</h2>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 text-sm">
            <dt className="w-36 shrink-0 text-muted">{row.label}</dt>
            <dd className="text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
