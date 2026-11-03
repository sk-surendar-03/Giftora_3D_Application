// Adapted from Open Keychain (MIT) — src/infrastructure/geometry/geometry-worker.ts.
// Logic for the 'warmup', 'generate', and (as of Step d) 'export' message
// types is preserved; the separate 'validate'-only flow is still NOT
// ported — it exists upstream purely to serve a UI validate-on-demand
// affordance Giftora's customizer doesn't have yet, and porting it would
// mean reintroducing the candidate-coalescing machinery Step (c) explicitly
// left out. TS type annotations replaced with JSDoc. See
// THIRD-PARTY-NOTICES.md.
//
// WASM initialization reuses Giftora's existing manifoldRuntime.js
// (Module({locateFile}) + wasm.setup()) rather than duplicating it — each
// Worker instance gets its own independent module realm, so this module-
// level singleton correctly initializes exactly once per worker.

import { getManifoldWasm } from '../manifoldRuntime.js'
import { buildKeychain } from '../build/keychainBuilder.js'
import { BoundedResultCache } from '../build/resultCache.js'
import { failureFrom } from '../recovery.js'
import { sanitizeFilename, applyPrintAppearanceOverrides } from '../model/types.js'
import { serializeBinaryStl } from '../export/stlSerializer.js'
import { serializeThreeMf } from '../export/threeMfSerializer.js'

const localFonts = new Map()

function builtGeometryWeight(built) {
  const buffers = new Set()
  const meshes = [built.result.baseMesh, built.result.reliefMesh, ...(built.result.parts ?? []).map((part) => part.mesh)]
  for (const mesh of meshes) {
    buffers.add(mesh.positions.buffer)
    buffers.add(mesh.indices.buffer)
  }
  let total = 0
  for (const buffer of buffers) total += buffer.byteLength
  return total
}

const finalCache = new BoundedResultCache(8, 64 * 1024 * 1024, builtGeometryWeight)

function fontForBuild(definition) {
  if (definition?.source !== 'local') return definition
  if (definition.data) {
    localFonts.set(definition.id, definition)
    return definition
  }
  return localFonts.get(definition.id) ?? definition
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`
}

async function fontKey(font) {
  if (!font) return '-'
  const byteIdentity = font.data
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', font.data)), (byte) => byte.toString(16).padStart(2, '0')).join('')
    : ''
  const metadata = Object.fromEntries(Object.entries(font).filter(([key]) => key !== 'data'))
  return stableStringify({ ...metadata, byteDigest: byteIdentity })
}

async function cacheKey(quality, request) {
  const [primaryFontKey, subtitleFontKey] = await Promise.all([fontKey(fontForBuild(request.fontDefinition)), fontKey(fontForBuild(request.subtitleFontDefinition))])
  return `${quality}|${stableStringify(request.params)}|${primaryFontKey}|${subtitleFontKey}`
}

function responseResult(result) {
  return { ...structuredClone(result) }
}

function transferBuffers(result) {
  const buffers = new Set()
  const meshes = [result.baseMesh, result.reliefMesh, ...(result.parts ?? []).map((part) => part.mesh)]
  for (const mesh of meshes) {
    buffers.add(mesh.positions.buffer)
    buffers.add(mesh.indices.buffer)
  }
  return [...buffers].filter((buffer) => buffer instanceof ArrayBuffer)
}

self.onmessage = async (event) => {
  const request = event.data
  let stage = 'initialization'
  try {
    if (request.type === 'warmup') {
      await getManifoldWasm()
      self.postMessage({ type: 'ready', requestId: 0 })
      return
    }
    const wasmStartedAt = performance.now()
    const wasm = await getManifoldWasm()
    const wasmWaitMs = performance.now() - wasmStartedAt
    stage = 'generation'
    if (request.type === 'generate') {
      const startedAt = performance.now()
      const key = await cacheKey('preview', request)
      const cached = finalCache.get(key)
      const cacheHit = cached !== undefined
      const built = cached ?? (await buildKeychain(wasm, request.params, false, fontForBuild(request.fontDefinition), request.subtitleFontDefinition ? fontForBuild(request.subtitleFontDefinition) : undefined))
      if (!cacheHit) {
        built.result.timings = { ...built.result.timings, workerComputeMs: performance.now() - startedAt }
        finalCache.set(key, built)
      }
      const { result } = built
      const preparationStartedAt = performance.now()
      const output = responseResult(result)
      output.timings = {
        ...output.timings,
        wasmWaitMs,
        workerCacheHit: cacheHit ? 1 : 0,
        workerComputeMs: cacheHit ? 0 : (result.timings?.workerComputeMs ?? 0),
        generationMs: cacheHit ? 0 : (result.timings?.generationMs ?? 0),
        workerResponsePreparationMs: performance.now() - preparationStartedAt,
      }
      if (cacheHit) output.timings = { ...output.timings, workerCacheLookupMs: performance.now() - startedAt }
      self.postMessage({ type: 'geometry', requestId: request.requestId, result: output }, { transfer: [...transferBuffers(output)] })
      return
    }
    if (request.type === 'export') {
      const key = await cacheKey('exportable', request)
      const cached = finalCache.get(key)
      const cacheHit = cached !== undefined
      const built = cached ?? (await buildKeychain(wasm, request.params, true, fontForBuild(request.fontDefinition), request.subtitleFontDefinition ? fontForBuild(request.subtitleFontDefinition) : undefined))
      const { result, exportMesh } = built
      const blockingIssues = result.issues.filter((issue) => issue.severity === 'error')
      const disconnectedOnly = blockingIssues.length > 0 && blockingIssues.every((issue) => issue.code === 'disconnected')
      if (!exportMesh || (!result.printable && !(request.allowDisconnected && disconnectedOnly))) {
        const message = result.issues.find((issue) => issue.severity === 'error')?.message ?? 'This model is not ready to download.'
        const issue = result.issues.find((candidate) => candidate.severity === 'error')
        self.postMessage({ type: 'error', requestId: request.requestId, message, ...(issue?.failure ? { failure: issue.failure } : {}) })
        return
      }
      if (!cacheHit) finalCache.set(key, built)
      stage = 'serialization'
      const appearance = applyPrintAppearanceOverrides(result.appearance, request.appearanceOverrides)
      const format = request.format ?? 'stl'
      const data = format === '3mf' ? serializeThreeMf(result.baseMesh, result.reliefMesh, exportMesh, request.mode ?? 'separate-colors', appearance) : serializeBinaryStl(exportMesh)
      const filename = sanitizeFilename(request.params.text, request.params.styleId, format)
      stage = 'transport'
      self.postMessage({ type: 'export', requestId: request.requestId, filename, mimeType: format === '3mf' ? 'model/3mf' : 'model/stl', data }, { transfer: [data] })
      return
    }
    throw new Error(`Unsupported worker request type in this step: ${request.type}`)
  } catch (error) {
    const failure = failureFrom(error, 'geometry-build-failed')
    self.postMessage({
      type: 'error',
      requestId: request.type === 'warmup' ? 0 : request.requestId,
      message: failure.message ?? 'The geometry engine could not create this model.',
      failure,
      diagnostics: { stage, type: 'operation_error' },
    })
  }
}
