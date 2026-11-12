// Single source of truth for "how many characters does the customizer bill
// for". Printable, non-whitespace characters only — spaces don't count (so
// "SURENDAR" and "SUR ENDAR" cost the same), but any other visible
// character (digits, punctuation, accented letters) does. Mirrored in the
// customer frontend (features/pricing/pricingCalculator.js) purely for the
// live on-screen estimate as the customer types; the price actually charged
// always comes from this backend calculation, run again when the item is
// added to the cart.
export function countBillableCharacters(text) {
  return [...(text ?? '')].filter((character) => character.trim().length > 0).length
}

// New tiered formula: flat base price up to baseCharacters, then perCharacterPriceCents for each char above.
// Falls back to old per-char-only behaviour when baseCharacters/basePriceCents are 0.
export function calculateTotalCustomizationPriceCents(text, subtitle, perCharacterPriceCents, baseCharacters = 0, basePriceCents = 0) {
  const total = countBillableCharacters(text) + countBillableCharacters(subtitle)
  if (total === 0) return 0
  if (baseCharacters > 0 && basePriceCents > 0) {
    if (total <= baseCharacters) return basePriceCents
    return basePriceCents + (total - baseCharacters) * perCharacterPriceCents
  }
  return total * perCharacterPriceCents
}
