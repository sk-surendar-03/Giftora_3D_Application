import { useEffect, useRef, useState } from 'react'
import { GeometryClient } from './worker/geometryClient.js'

const DEBOUNCE_MS = 250

/**
 * Drives the real, worker-backed keychain geometry engine (Steps a–d) from
 * React. One `GeometryClient` per mount (disposed on unmount — this also
 * terminates its Worker). Debounces rapid parameter changes; relies on
 * `GeometryClient.request()`'s own stale-request superseding so a slow,
 * now-outdated request can never overwrite a newer one's result — a
 * superseded request's rejection is swallowed here rather than surfaced as
 * an error, since a newer request is already in flight to replace it.
 *
 * @param {import('./model/types').KeychainParams} params
 * @param {{fontDefinition?: import('./fonts/catalog').FontDefinition, subtitleFontDefinition?: import('./fonts/catalog').FontDefinition}} [fonts]
 */
export function useGeometryEngine(params, fonts = {}) {
  const clientRef = useRef(null)
  const [state, setState] = useState({ status: 'loading', result: null, error: null })
  const requestSeqRef = useRef(0)

  useEffect(() => {
    const client = new GeometryClient()
    clientRef.current = client
    return () => {
      client.dispose()
      clientRef.current = null
    }
  }, [])

  const paramsKey = JSON.stringify(params)
  const fontKey = `${fonts.fontDefinition?.id ?? ''}|${fonts.subtitleFontDefinition?.id ?? ''}`

  useEffect(() => {
    const client = clientRef.current
    if (!client) return
    const sequence = ++requestSeqRef.current

    const timer = setTimeout(() => {
      setState((previous) => ({ ...previous, status: 'loading', error: null }))
      client
        .request(params, fonts.fontDefinition, fonts.subtitleFontDefinition)
        .then((result) => {
          if (requestSeqRef.current !== sequence) return
          setState({ status: 'ready', result, error: null })
        })
        .catch((error) => {
          if (requestSeqRef.current !== sequence) return
          if (error?.name === 'GeometryCandidateSupersededError') return
          setState((previous) => ({ ...previous, status: 'error', error }))
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paramsKey/fontKey are the real dependency; params/fonts are re-created every render.
  }, [paramsKey, fontKey])

  function retry() {
    const client = clientRef.current
    if (!client) return
    try {
      client.recoverForUserRetry()
    } catch {
      // Already recovering or disposed — the next paramsKey/fontKey change will try again regardless.
    }
    requestSeqRef.current += 1
    const sequence = requestSeqRef.current
    setState((previous) => ({ ...previous, status: 'loading', error: null }))
    client
      .request(params, fonts.fontDefinition, fonts.subtitleFontDefinition)
      .then((result) => {
        if (requestSeqRef.current !== sequence) return
        setState({ status: 'ready', result, error: null })
      })
      .catch((error) => {
        if (requestSeqRef.current !== sequence) return
        setState((previous) => ({ ...previous, status: 'error', error }))
      })
  }

  return { ...state, client: clientRef.current, retry }
}
