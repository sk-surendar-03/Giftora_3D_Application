// Ported from Open Keychain (MIT) — src/shared/lib/recovery/failure.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
//
// Reclassified from Step (a): this is the builder's own structured
// "why was this clamped/rejected" mechanism (used throughout
// build/edge-finish.ts and keychain-builder.ts to explain validation
// issues), not unrelated telemetry/analytics — so unlike Google Fonts/
// PostHog/hosted-mode, it's real geometry-validation logic and is ported
// here rather than excluded. See THIRD-PARTY-NOTICES.md.

/**
 * @typedef {object} RecoveryFailureContext
 * @property {'base'|'text'} [target]
 * @property {'sharp'|'round'|'chamfer'} [profile]
 * @property {number} [maximumMm]
 * @property {number} [requestedMm]
 * @property {'cornerRadiusMm'|'stakeShoulderMm'} [parameter]
 */
/**
 * @typedef {object} RecoveryFailure
 * @property {string} code
 * @property {string} [message]
 * @property {RecoveryFailureContext} [context]
 */

export class RecoveryError extends Error {
  /** @param {RecoveryFailure} failure */
  constructor(failure) {
    super(failure.message ?? failure.code)
    this.name = 'RecoveryError'
    this.failure = failure
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

function recoveryContext(value) {
  if (!isRecord(value)) return undefined
  const context = {}
  if (value.target === 'base' || value.target === 'text') context.target = value.target
  if (value.profile === 'sharp' || value.profile === 'round' || value.profile === 'chamfer') context.profile = value.profile
  for (const key of ['maximumMm', 'requestedMm']) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) context[key] = value[key]
  }
  if (value.parameter === 'cornerRadiusMm' || value.parameter === 'stakeShoulderMm') context.parameter = value.parameter
  return Object.keys(context).length ? context : undefined
}

function structuredFailure(value) {
  if (typeof value.code !== 'string') return undefined
  const context = recoveryContext(value.context)
  return {
    code: value.code,
    ...(typeof value.message === 'string' ? { message: value.message } : {}),
    ...(context ? { context } : {}),
  }
}

/** @param {unknown} error @param {string} [fallbackCode] @returns {RecoveryFailure} */
export function failureFrom(error, fallbackCode = 'unknown-failure') {
  if (error instanceof RecoveryError) return error.failure
  if (isRecord(error)) {
    const candidate = error.failure
    if (isRecord(candidate)) {
      const failure = structuredFailure(candidate)
      if (failure) return failure
    }
    const failure = structuredFailure(error)
    if (failure) return failure
  }
  return { code: fallbackCode, ...(error instanceof Error && error.message ? { message: error.message } : {}) }
}

// Ported from Open Keychain (MIT) — src/shared/lib/recovery/operation-diagnostics.ts.
// Added in Step (c) for worker error propagation (which stage/kind of
// failure a worker request hit — initialization, generation, transport, a
// timeout, a crashed worker, etc.).

/**
 * @typedef {object} OperationDiagnostics
 * @property {'initialization'|'normalization'|'generation'|'serialization'|'transport'|'download'} stage
 * @property {'timeout'|'worker_error'|'message_error'|'worker_unavailable'|'operation_error'} type
 */

export class GeometryOperationError extends RecoveryError {
  /** @param {RecoveryFailure} failure @param {OperationDiagnostics} diagnostics */
  constructor(failure, diagnostics) {
    super(failure)
    this.diagnostics = diagnostics
  }
}
