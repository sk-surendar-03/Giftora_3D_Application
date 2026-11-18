// Client-side stand pricing. Mirrors backend standDesignOptions.js priceForStand.
// UX only - backend recomputes and enforces the final price.

export function computeStandPriceCents(category, volumeCm3, config) {
  const cfg = config || { pricePerCm3Cents: 100, categories: {} }
  const defaultBase = { 'phone-stand': 50000, 'pen-holder': 60000, 'combined': 90000, 'desk-organizer': 120000, 'personalized-gift': 80000 }
  const base = cfg.categories?.[category]?.basePriceCents ?? defaultBase[category] ?? 50000
  const perCm3 = cfg.pricePerCm3Cents ?? 100
  const volumeFee = Math.max(0, Math.round((volumeCm3 || 0) * perCm3))
  return base + volumeFee
}

export function formatRupees(cents) {
  return '₹' + (cents / 100).toFixed(2)
}