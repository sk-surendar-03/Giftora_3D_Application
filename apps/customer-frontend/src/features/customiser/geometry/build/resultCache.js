// Ported from Open Keychain (MIT) — src/infrastructure/geometry/result-cache.ts.
// Logic unchanged; TS generics/type annotations replaced with JSDoc.
// See THIRD-PARTY-NOTICES.md.

/** A tiny insertion-ordered cache for immutable-by-convention worker results. */
export class BoundedResultCache {
  /**
   * @param {number} [limit]
   * @param {number} [maxWeight]
   * @param {(value: any) => number} [weightOf]
   */
  constructor(limit = 8, maxWeight = 64 * 1024 * 1024, weightOf = () => 0) {
    this.limit = limit
    this.maxWeight = maxWeight
    this.weightOf = weightOf
    this.entries = new Map()
    this.weights = new Map()
  }

  get(key) {
    const value = this.entries.get(key)
    if (value !== undefined) {
      this.entries.delete(key)
      this.entries.set(key, value)
    }
    return value
  }

  set(key, value) {
    const weight = this.weightOf(value)
    this.entries.delete(key)
    this.weights.delete(key)
    if (weight > this.maxWeight) return
    this.entries.set(key, value)
    this.weights.set(key, weight)
    while (this.entries.size > this.limit) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
      this.weights.delete(oldest)
    }
    while (this.totalWeight() > this.maxWeight) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
      this.weights.delete(oldest)
    }
  }

  clear() {
    this.entries.clear()
    this.weights.clear()
  }

  totalWeight() {
    let total = 0
    for (const weight of this.weights.values()) total += weight
    return total
  }
}
