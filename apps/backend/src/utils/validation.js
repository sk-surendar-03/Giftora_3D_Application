// Minimal hand-rolled input validation — deliberately not pulling in a
// schema-validation library for two checks, per "avoid unnecessary
// dependencies".
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value)
}

export function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128
}

export function isNonEmptyString(value, maxLength = 200) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 120 && SLUG_RE.test(value)
}

export function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0
}

export function isStringArray(value, maxItems = 50, maxLength = 100) {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => isNonEmptyString(item, maxLength))
}
