// Ported from Open Keychain (MIT) — src/domain/keychain/model/model-feature.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
// See THIRD-PARTY-NOTICES.md.

/**
 * @typedef {[number, number]} FeaturePoint
 * @typedef {[number, number, number]} FeatureVector
 * @typedef {object} ModelFeature
 * @property {string} id
 * @property {'box'|'sphere'|'cylinder'|'extrude'|'revolve'|'sweep'} kind
 * @property {'add'|'subtract'|'intersect'} operation
 * @property {FeatureVector} sizeMm
 * @property {FeatureVector} positionMm
 * @property {FeatureVector} rotationDeg
 * @property {FeaturePoint[][]} [polygons]
 * @property {FeatureVector[]} [pathMm]
 */

function vector(value, limit) {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((number) => typeof number === 'number' && Number.isFinite(number) && Math.abs(number) <= limit)
  )
}

/** Strict, bounded input shared by the document codec and the geometry worker. */
export function validateModelFeatures(value) {
  if (!Array.isArray(value) || value.length > 24) return false
  const ids = new Set()
  let points = 0
  return value.every((feature) => {
    if (!feature || typeof feature !== 'object' || Array.isArray(feature)) return false
    const item = feature
    if (
      Object.keys(item).some(
        (key) => !['id', 'kind', 'operation', 'sizeMm', 'positionMm', 'rotationDeg', 'polygons', 'pathMm'].includes(key),
      )
    )
      return false
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(item.id) || ids.has(item.id)) return false
    ids.add(item.id)
    if (
      !['box', 'sphere', 'cylinder', 'extrude', 'revolve', 'sweep'].includes(String(item.kind)) ||
      !['add', 'subtract', 'intersect'].includes(String(item.operation)) ||
      !vector(item.sizeMm, 200) ||
      item.sizeMm.some((size) => size < 0.2) ||
      !vector(item.positionMm, 500) ||
      !vector(item.rotationDeg, 360)
    )
      return false
    const usesProfile = ['extrude', 'revolve', 'sweep'].includes(String(item.kind))
    if (usesProfile && (!Array.isArray(item.polygons) || item.polygons.length === 0 || item.polygons.length > 128))
      return false
    if (!usesProfile && (item.polygons !== undefined || item.pathMm !== undefined)) return false
    if (item.kind !== 'sweep' && item.pathMm !== undefined) return false
    if (
      item.polygons !== undefined &&
      (!Array.isArray(item.polygons) ||
        !item.polygons.every((polygon) => {
          if (!Array.isArray(polygon) || polygon.length < 3 || polygon.length > 4096) return false
          points += polygon.length
          return polygon.every(
            (point) =>
              Array.isArray(point) &&
              point.length === 2 &&
              point.every((number) => typeof number === 'number' && Number.isFinite(number) && Math.abs(number) <= 500),
          )
        }))
    )
      return false
    if (points > 12000) return false
    if (
      item.kind === 'sweep' &&
      (!Array.isArray(item.pathMm) ||
        item.pathMm.length < 2 ||
        item.pathMm.length > 32 ||
        !item.pathMm.every((point) => vector(point, 500)))
    )
      return false
    if (
      item.kind === 'sweep' &&
      item.pathMm.every((point) => point.every((value, index) => value === item.pathMm[0]?.[index]))
    )
      return false
    return (
      item.pathMm === undefined ||
      (Array.isArray(item.pathMm) && item.pathMm.length <= 32 && item.pathMm.every((point) => vector(point, 500)))
    )
  })
}
