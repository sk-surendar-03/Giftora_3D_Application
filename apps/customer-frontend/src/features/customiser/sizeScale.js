const MIN_SCALE = 0.8
const MAX_SCALE = 1.25

function parseCm(label) {
  const match = /([\d.]+)\s*cm/i.exec(label ?? '')
  return match ? parseFloat(match[1]) : null
}

// Scales the preview proportionally to where the selected size falls within
// this product's own size range (not an absolute real-world scale).
export function getSizeScale(selectedSize, allSizes) {
  const target = parseCm(selectedSize)
  const values = (allSizes ?? []).map(parseCm).filter((v) => v != null)

  if (target == null || values.length < 2) return 1

  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return 1

  const ratio = (target - min) / (max - min)
  return MIN_SCALE + ratio * (MAX_SCALE - MIN_SCALE)
}
