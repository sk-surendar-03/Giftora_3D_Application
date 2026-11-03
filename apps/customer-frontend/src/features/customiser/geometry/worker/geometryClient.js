// Adapted from Open Keychain (MIT) — src/infrastructure/geometry/geometry-client.ts.
// Ported: the preview `request()` flow (stale-request superseding, caching,
// request timeout, worker crash detection/recovery), `dispose()`, worker
// creation/error wiring, and (as of Step d) `export()`. Still NOT ported:
// `validate()`/`validateCandidate()`/candidate-coalescing — a separate
// validate-only flow Giftora's customizer has no UI affordance for yet.
// TS type annotations replaced with JSDoc. See THIRD-PARTY-NOTICES.md.

import { validateGeometryResult } from '../model/types.js'
import { RecoveryError, GeometryOperationError, failureFrom } from '../recovery.js'
import { BoundedResultCache } from '../build/resultCache.js'

function disposedError() {
  return new RecoveryError({ code: 'geometry-client-disposed', message: 'Geometry client disposed.' })
}

function failedError(type = 'worker_unavailable') {
  return new GeometryOperationError({ code: 'geometry-worker-failed', message: 'Geometry worker failed.' }, { stage: 'transport', type })
}

function workerInitializationError(error) {
  return new GeometryOperationError(
    { code: 'geometry-worker-init-failed', message: error instanceof Error ? error.message : 'Geometry worker could not start.' },
    { stage: 'initialization', type: 'worker_unavailable' },
  )
}

export const DEFAULT_GEOMETRY_REQUEST_TIMEOUT_MS = 30_000

export class GeometryRequestTimeoutError extends GeometryOperationError {
  constructor() {
    super({ code: 'geometry-request-timeout', message: 'Geometry worker request timed out.' }, { stage: 'transport', type: 'timeout' })
    this.name = 'GeometryRequestTimeoutError'
  }
}

export class GeometryCandidateSupersededError extends Error {
  constructor() {
    super('Geometry candidate was superseded.')
    this.name = 'GeometryCandidateSupersededError'
    Object.defineProperty(this, 'failure', { value: { code: 'geometry-candidate-superseded', message: this.message }, enumerable: true })
  }
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`
}

function fontKey(font) {
  if (!font) return '-'
  const metadata = Object.fromEntries(Object.entries(font).filter(([key]) => key !== 'data'))
  return stableStringify(metadata)
}

function hasInlineFontData(...fonts) {
  return fonts.some((font) => font?.data !== undefined)
}

function cloneResult(result, generationId) {
  // structuredClone preserves shared ArrayBuffer identity between aggregate meshes and parts.
  const clone = structuredClone(result)
  clone.generationId = generationId
  return clone
}

function geometryResultWeight(result) {
  const buffers = new Set()
  const meshes = [result.baseMesh, result.reliefMesh, ...(result.parts ?? []).map((part) => part.mesh)]
  for (const mesh of meshes) {
    buffers.add(mesh.positions.buffer)
    buffers.add(mesh.indices.buffer)
  }
  let total = 0
  for (const buffer of buffers) total += buffer.byteLength
  return total
}

/**
 * Main-thread client for the geometry Worker. One active preview request at
 * a time; a newer `request()` call supersedes (rejects) whatever was
 * in-flight or queued, so an outdated result can never overwrite a newer one.
 */
export class GeometryClient {
  /** @param {{requestTimeoutMs?: number}} [options] */
  constructor(options = {}) {
    this.requestTimeoutMs = options.requestTimeoutMs && Number.isFinite(options.requestTimeoutMs) ? Math.max(1, options.requestTimeoutMs) : DEFAULT_GEOMETRY_REQUEST_TIMEOUT_MS
    this.requestTimers = new Map()
    this.nextRequestId = 1
    this.activePreviewRequestId = undefined
    this.queuedPreview = undefined
    this.pendingGeometry = new Map()
    this.pendingExports = new Map()
    this.previewCacheKeys = new Map()
    this.disposed = false
    this.workerFailed = false
    this.recoveryAvailable = true
    this.workerFailure = undefined
    this.resultCache = new BoundedResultCache(8, 64 * 1024 * 1024, geometryResultWeight)
    try {
      this.worker = this.createWorker()
      this.worker.postMessage({ type: 'warmup' })
    } catch (error) {
      this.workerFailed = true
      this.workerFailure = workerInitializationError(error)
      this.worker?.terminate()
    }
  }

  /**
   * @param {import('../model/types').KeychainParams} params
   * @param {import('../fonts/catalog').FontDefinition} [fontDefinition]
   * @param {import('../fonts/catalog').FontDefinition} [subtitleFontDefinition]
   * @returns {Promise<import('../model/types').GeometryResult>}
   */
  request(params, fontDefinition, subtitleFontDefinition) {
    if (this.disposed || this.workerFailed) return Promise.reject(this.currentError())
    const requestId = this.nextRequestId++
    const cacheKey = this.cacheKey(params, fontDefinition, subtitleFontDefinition)
    const cacheable = !hasInlineFontData(fontDefinition, subtitleFontDefinition)
    const cached = cacheable ? this.resultCache.get(cacheKey) : undefined
    if (cached) return Promise.resolve(this.cloneCachedResult(cached, requestId))
    const promise = new Promise((resolve, reject) => {
      this.pendingGeometry.set(requestId, { resolve, reject, startedAt: performance.now() })
    })
    if (this.activePreviewRequestId !== undefined) {
      const stale = this.pendingGeometry.get(this.activePreviewRequestId)
      stale?.reject(new GeometryCandidateSupersededError())
      this.pendingGeometry.delete(this.activePreviewRequestId)
      if (this.queuedPreview) {
        const superseded = this.pendingGeometry.get(this.queuedPreview.requestId)
        superseded?.reject(new GeometryCandidateSupersededError())
        this.pendingGeometry.delete(this.queuedPreview.requestId)
      }
      this.queuedPreview = { params, fontDefinition, requestId, subtitleFontDefinition, cacheKey }
      return promise
    }
    this.sendGenerate(params, fontDefinition, requestId, subtitleFontDefinition, cacheable ? cacheKey : undefined)
    return promise
  }

  /**
   * Request a downloadable STL or 3MF file for the current design.
   * @param {import('../model/types').KeychainParams} params
   * @param {import('../model/types').ExportFormat} [format]
   * @param {import('../model/types').ThreeMfMode} [mode]
   * @param {import('../fonts/catalog').FontDefinition} [fontDefinition]
   * @param {import('../model/types').PrintAppearanceOverrides} [appearanceOverrides]
   * @param {import('../fonts/catalog').FontDefinition} [subtitleFontDefinition]
   * @param {boolean} [allowDisconnected] - explicit, export-only acknowledgement for disconnected solids
   * @returns {Promise<{filename: string, mimeType: string, data: ArrayBuffer}>}
   */
  export(params, format = 'stl', mode = 'separate-colors', fontDefinition, appearanceOverrides, subtitleFontDefinition, allowDisconnected = false) {
    if (this.disposed || this.workerFailed) return Promise.reject(this.currentError())
    const requestId = this.nextRequestId++
    const promise = new Promise((resolve, reject) => {
      this.pendingExports.set(requestId, { resolve, reject })
    })
    try {
      this.worker.postMessage({
        type: 'export',
        requestId,
        params,
        format,
        mode,
        appearanceOverrides,
        allowDisconnected,
        fontDefinition: this.fontForWorker(fontDefinition),
        subtitleFontDefinition: this.fontForWorker(subtitleFontDefinition),
      })
    } catch (error) {
      this.pendingExports.delete(requestId)
      return Promise.reject(error instanceof Error ? error : failedError())
    }
    this.startRequestTimer(requestId, this.worker)
    return promise
  }

  /** Re-arm a failed client only in response to an explicit user retry. Never replay old work. */
  recoverForUserRetry() {
    if (this.disposed) throw disposedError()
    if (!this.workerFailed) return false
    this.recoveryAvailable = false
    this.replaceWorker()
    if (this.workerFailed) throw this.currentError()
    return true
  }

  dispose() {
    this.disposed = true
    const error = disposedError()
    for (const pending of this.pendingGeometry.values()) pending.reject(error)
    for (const pending of this.pendingExports.values()) pending.reject(error)
    this.pendingGeometry.clear()
    this.pendingExports.clear()
    this.clearRequestTimers()
    this.queuedPreview = undefined
    this.activePreviewRequestId = undefined
    this.resultCache.clear()
    this.worker?.terminate()
  }

  sendGenerate(params, fontDefinition, requestId = this.nextRequestId++, subtitleFontDefinition, cacheKey) {
    this.activePreviewRequestId = requestId
    try {
      this.worker.postMessage({ type: 'generate', requestId, params, fontDefinition: this.fontForWorker(fontDefinition), subtitleFontDefinition: this.fontForWorker(subtitleFontDefinition) })
    } catch (error) {
      this.pendingGeometry.get(requestId)?.reject(error instanceof Error ? error : failedError())
      this.pendingGeometry.delete(requestId)
      this.previewCacheKeys.delete(requestId)
      this.activePreviewRequestId = undefined
      return
    }
    this.startRequestTimer(requestId, this.worker)
    if (cacheKey) this.previewCacheKeys.set(requestId, cacheKey)
  }

  handleResponse(worker, response) {
    if (this.disposed || worker !== this.worker) return
    if (response.type === 'ready') {
      this.workerFailure = undefined
      this.workerFailed = false
      return
    }
    this.clearRequestTimer(response.requestId)
    if (response.type === 'error' && response.requestId === 0) {
      this.handleWorkerFailure(worker, new GeometryOperationError(response.failure ?? { code: 'geometry-worker-failed', message: response.message }, { stage: 'initialization', type: 'operation_error' }))
      return
    }
    this.recoveryAvailable = true
    this.workerFailure = undefined
    if (response.type === 'geometry') {
      const pending = this.pendingGeometry.get(response.requestId)
      if (pending) {
        const result = { ...response.result, generationId: response.requestId }
        if (!validateGeometryResult(result)) {
          pending.reject(new RecoveryError({ code: 'geometry-invalid-result', message: 'Geometry worker returned an invalid result.' }))
        } else {
          const cacheKey = this.previewCacheKeys.get(response.requestId)
          const cloneStartedAt = performance.now()
          if (cacheKey) this.resultCache.set(cacheKey, cloneResult(result, 0))
          result.timings = { ...result.timings, clientCacheCloneMs: performance.now() - cloneStartedAt, clientRoundTripMs: performance.now() - pending.startedAt }
          pending.resolve(result)
        }
        this.pendingGeometry.delete(response.requestId)
        this.previewCacheKeys.delete(response.requestId)
      }
      if (this.activePreviewRequestId === response.requestId) this.activePreviewRequestId = undefined
      const latest = this.queuedPreview
      if (latest) {
        this.queuedPreview = undefined
        this.sendGenerate(latest.params, latest.fontDefinition, latest.requestId, latest.subtitleFontDefinition, latest.cacheKey)
      }
      return
    }
    if (response.type === 'export') {
      const pending = this.pendingExports.get(response.requestId)
      pending?.resolve({ filename: response.filename, mimeType: response.mimeType, data: response.data })
      this.pendingExports.delete(response.requestId)
      return
    }
    // 'error' response for a 'generate' or 'export' request.
    const error = new GeometryOperationError(response.failure ?? failureFrom({ code: 'geometry-build-failed', message: response.message }), response.diagnostics ?? { stage: 'generation', type: 'operation_error' })
    const geometry = this.pendingGeometry.get(response.requestId)
    geometry?.reject(error)
    this.pendingGeometry.delete(response.requestId)
    this.previewCacheKeys.delete(response.requestId)
    const exportRequest = this.pendingExports.get(response.requestId)
    exportRequest?.reject(error)
    this.pendingExports.delete(response.requestId)
    if (this.activePreviewRequestId === response.requestId) {
      this.activePreviewRequestId = undefined
      const latest = this.queuedPreview
      this.queuedPreview = undefined
      if (latest) this.sendGenerate(latest.params, latest.fontDefinition, latest.requestId, latest.subtitleFontDefinition, latest.cacheKey)
    }
  }

  cacheKey(params, fontDefinition, subtitleFontDefinition) {
    return `preview|${stableStringify(params)}|${fontKey(fontDefinition)}|${fontKey(subtitleFontDefinition)}`
  }

  currentError() {
    return this.disposed ? disposedError() : (this.workerFailure ?? failedError())
  }

  handleWorkerFailure(worker, error) {
    if (this.disposed || this.workerFailed || worker !== this.worker) return
    this.workerFailed = true
    this.workerFailure = error
    for (const pending of this.pendingGeometry.values()) pending.reject(error)
    for (const pending of this.pendingExports.values()) pending.reject(error)
    this.pendingGeometry.clear()
    this.pendingExports.clear()
    this.clearRequestTimers()
    this.previewCacheKeys.clear()
    this.queuedPreview = undefined
    this.activePreviewRequestId = undefined
    worker.terminate()
    if (!this.recoveryAvailable) return
    this.recoveryAvailable = false
    this.replaceWorker()
  }

  replaceWorker() {
    let replacement
    try {
      replacement = this.createWorker()
      this.worker = replacement
      this.workerFailed = false
      replacement.postMessage({ type: 'warmup' })
    } catch (error) {
      replacement?.terminate()
      this.workerFailed = true
      this.workerFailure = workerInitializationError(error)
    }
  }

  createWorker() {
    const worker = new Worker(new URL('./geometryWorker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (event) => this.handleResponse(worker, event.data)
    worker.onerror = () => this.handleWorkerFailure(worker, failedError('worker_error'))
    worker.onmessageerror = () => this.handleWorkerFailure(worker, failedError('message_error'))
    return worker
  }

  startRequestTimer(requestId, worker) {
    this.clearRequestTimer(requestId)
    this.requestTimers.set(
      requestId,
      setTimeout(() => {
        this.requestTimers.delete(requestId)
        this.handleWorkerFailure(worker, new GeometryRequestTimeoutError())
      }, this.requestTimeoutMs),
    )
  }

  clearRequestTimer(requestId) {
    const timer = this.requestTimers.get(requestId)
    if (timer !== undefined) clearTimeout(timer)
    this.requestTimers.delete(requestId)
  }

  clearRequestTimers() {
    for (const timer of this.requestTimers.values()) clearTimeout(timer)
    this.requestTimers.clear()
  }

  fontForWorker(fontDefinition) {
    return fontDefinition
  }

  cloneCachedResult(cached, generationId, lookupStartedAt = performance.now(), queueMs = 0) {
    const lookupMs = performance.now() - lookupStartedAt
    const cloneStartedAt = performance.now()
    const result = cloneResult(cached, generationId)
    const cloneMs = performance.now() - cloneStartedAt
    const timings = Object.fromEntries(Object.entries(result.timings ?? {}).filter(([key]) => !key.endsWith('Ms')))
    result.timings = { ...timings, clientCacheHit: 1, clientCacheLookupMs: lookupMs, clientCacheCloneMs: cloneMs, clientRoundTripMs: lookupMs + cloneMs + queueMs, clientQueueMs: queueMs }
    return result
  }
}
