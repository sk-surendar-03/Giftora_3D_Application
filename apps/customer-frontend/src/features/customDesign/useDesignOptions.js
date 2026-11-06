import { useEffect, useState } from 'react'
import { fetchDesignOptions } from './customDesignApi.js'

let cached

/**
 * The customiser's options (templates, materials and colours, sizes, fonts,
 * thickness, limits) come from the backend — the same lists it validates
 * designs against. They rarely change, so they're fetched once per page load.
 */
export function useDesignOptions() {
  const [state, setState] = useState(() => ({ data: cached ?? null, isLoading: !cached, error: null }))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (cached) return undefined
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setState({ data: null, isLoading: true, error: null })
      fetchDesignOptions(controller.signal)
        .then((options) => {
          cached = options
          setState({ data: options, isLoading: false, error: null })
        })
        .catch((error) => {
          if (controller.signal.aborted) return
          setState({ data: null, isLoading: false, error })
        })
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [attempt])

  return { ...state, retry: () => setAttempt((n) => n + 1) }
}
