import { randomBytes } from 'node:crypto'

/**
 * A short, customer-facing order number — distinct from the internal cuid
 * `id`. Date-prefixed for readability, with enough random entropy
 * (36^6 ≈ 2.2 billion combinations) that a collision is effectively
 * impossible; createOrder still handles the rare unique-constraint
 * conflict by retrying with a fresh number (see orderService.js).
 */
export function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomPart = randomBytes(5).toString('hex').slice(0, 6).toUpperCase()
  return `GFT-${datePart}-${randomPart}`
}
