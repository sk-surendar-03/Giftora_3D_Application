// Ported from Open Keychain (MIT) — src/features/export/model/preflight.ts.
// Logic unchanged; TS type annotations replaced with JSDoc.
//
// This aggregates `result.issues` (the real, per-severity validation output
// already computed inside the builder/template/style/edge-finish code during
// Steps a/b — e.g. 'disconnected', 'relief-outside-backing', 'text-over-width',
// 'articulated-*', 'nameplate-*') into one report shape a future UI could
// consume. It does not itself re-derive manifoldness/connectivity/wall-
// thickness checks — those are traced to the builder, not invented here.
// See THIRD-PARTY-NOTICES.md.

import { DEFAULT_PRINT_PROFILE, printProfileFor } from '../model/types.js'

/** @typedef {'generating'|'ready'|'ready-with-warnings'|'blocked'} PreflightStatus */
/**
 * @typedef {object} PreflightReport
 * @property {PreflightStatus} status
 * @property {boolean} printable
 * @property {import('../model/types').Dimensions|undefined} dimensions
 * @property {import('../model/types').PrintProfile|undefined} profile
 * @property {import('../model/types').GeometryConstraints|undefined} constraints
 * @property {import('../model/types').PrintAppearance|undefined} appearance
 * @property {import('../model/types').ValidationIssue[]} issues
 */

/**
 * Collects generation validation and manufacturing metadata for the export handoff.
 * @param {import('../model/types').GeometryResult|undefined} result
 * @param {import('../model/types').PrintAppearance|undefined} [appearance]
 * @param {boolean} [busy]
 * @param {string} [error]
 * @param {boolean} [allowDisconnected]
 * @returns {PreflightReport}
 */
export function buildPreflightReport(result, appearance = result?.appearance, busy = false, error, allowDisconnected = false) {
  if (busy || error || !result) {
    return {
      status: error ? 'blocked' : 'generating',
      printable: false,
      dimensions: undefined,
      profile: undefined,
      constraints: undefined,
      appearance: undefined,
      issues: error ? [{ severity: 'error', code: 'generation-error', message: error }] : [],
    }
  }
  const blockingIssues = result.issues.filter((issue) => issue.severity === 'error')
  const disconnectedOnly = blockingIssues.length > 0 && blockingIssues.every((issue) => issue.code === 'disconnected')
  const hasErrors = blockingIssues.length > 0 && !(allowDisconnected && disconnectedOnly)
  const hasWarnings = result.issues.some((issue) => issue.severity === 'warning')
  const printable = (result.printable || (allowDisconnected && disconnectedOnly)) && !hasErrors

  const constraints = result.constraints

  return {
    status: !printable ? 'blocked' : hasWarnings ? 'ready-with-warnings' : 'ready',
    printable,
    dimensions: result.dimensions,
    profile: result.printProfile ?? (constraints ? printProfileFor(constraints) : DEFAULT_PRINT_PROFILE),
    constraints: constraints ?? result.printProfile?.constraints ?? DEFAULT_PRINT_PROFILE.constraints,
    appearance,
    issues: result.issues,
  }
}
