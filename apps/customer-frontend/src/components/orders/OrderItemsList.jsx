import CustomizationDetails from '../product/CustomizationDetails.jsx'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

// Shared by Order Success and Order Details — renders an order's item
// snapshots (productName/productImage captured at order time, see
// Phase 9's OrderItem schema), not a live product lookup.
export default function OrderItemsList({ items }) {
  return (
    <div className="divide-y divide-border rounded-card border border-border bg-surface">
      {items.map((item) => (
        <div key={item.id} className="flex gap-4 p-5">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-control bg-ink/5">
            {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">{item.productName}</p>
                <CustomizationDetails customization={item.customization} />
                <p className="mt-1 text-xs text-muted">Qty {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-medium text-ink">{formatPrice(item.unitPriceCents * item.quantity)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
