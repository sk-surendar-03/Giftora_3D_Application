// Mirrors apps/backend/src/modules/settings/pricingCalculator.js exactly.
// This copy drives the live as-you-type estimate; the backend recomputes on add-to-cart.
export function countBillableCharacters(text) {
  return [...(text ?? '')].filter((character) => character.trim().length > 0).length
}

export function calculateTotalCustomizationPriceCents(text, subtitle, perCharacterPriceCents, baseCharacters = 0, basePriceCents = 0) {
  const total = countBillableCharacters(text) + countBillableCharacters(subtitle)
  if (total === 0) return 0
  if (baseCharacters > 0 && basePriceCents > 0) {
    if (total <= baseCharacters) return basePriceCents
    return basePriceCents + (total - baseCharacters) * perCharacterPriceCents
  }
  return total * perCharacterPriceCents
}
