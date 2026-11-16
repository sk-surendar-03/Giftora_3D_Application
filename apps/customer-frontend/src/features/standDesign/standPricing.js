// Client-side stand pricing. Mirrors backend standDesignOptions.js priceForStand.
// UX only - backend recomputes and enforces the final price.

const BASE_PRICES = {
  'phone-stand': 50000,
  'pen-holder': 60000,
  'combined': 90000,
  'desk-organizer': 120000,
  'personalized-gift': 80000,
}

const PRICE_PER_CM3_CENTS = 100

export function computeStandPriceCents(category, volumeCm3) {
  const base = BASE_PRICES[category] ?? 50000
  const volumeFee = Math.max(0, Math.round((volumeCm3 || 0) * PRICE_PER_CM3_CENTS))
  return base + volumeFee
}

export function formatRupees(cents) {
  return '₹' + (cents / 100).toFixed(2)
}