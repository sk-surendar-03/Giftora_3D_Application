import { useEffect, useState } from 'react'
import api from '../../services/api'

export function useCustomizerSettings() {
  const [state, setState] = useState({ colors: [], shippingMethods: [], isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      api.get('/settings/customizer/colors', { signal: controller.signal }),
      api.get('/settings/customizer/shipping', { signal: controller.signal }),
    ])
      .then(([colRes, shipRes]) => setState({
        colors: Array.isArray(colRes.data.colors) ? colRes.data.colors : [],
        shippingMethods: Array.isArray(shipRes.data.methods) ? shipRes.data.methods : [],
        isLoading: false,
        error: null,
      }))
      .catch((err) => {
        if (controller.signal.aborted) return
        setState({ colors: [], shippingMethods: [], isLoading: false, error: err })
      })
    return () => controller.abort()
  }, [])

  return state
}
