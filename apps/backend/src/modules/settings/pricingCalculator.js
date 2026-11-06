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

export function calculateCustomizationPriceCents(text, perCharacterPriceCents) {
  return countBillableCharacters(text) * perCharacterPriceCents
}

// The subtitle is priced the same way and on top of the name — it's
// optional, so an empty/missing subtitle simply contributes 0.
export function calculateTotalCustomizationPriceCents(text, subtitle, perCharacterPriceCents) {
  return calculateCustomizationPriceCents(text, perCharacterPriceCents) + calculateCustomizationPriceCents(subtitle, perCharacterPriceCents)
}
