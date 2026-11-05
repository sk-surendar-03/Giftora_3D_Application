// Mirrors the backend's slug validation (lowercase letters/numbers/hyphens
// only, see apps/backend/src/utils/validation.js's isValidSlug) so a
// generated suggestion is always accepted without a round-trip.
export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
