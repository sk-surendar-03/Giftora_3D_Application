// Mirrors apps/backend/src/modules/settings/pricingCalculator.js exactly —
// printable, non-whitespace characters only (spaces don't count). This copy
// only drives the *live, as-you-type* price shown in the customizer; the
// price actually charged is always recomputed server-side (cartService.js)
// against the admin-configured rate, never trusted from the client. Keep
// both in sync if this counting rule ever changes.
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
