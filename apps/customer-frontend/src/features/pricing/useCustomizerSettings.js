import { useEffect, useState } from 'react'
import api from '../../services/api'

export function useCustomizerSettings() {
  const [state, setState] = useState({ colors: [], shippingMethods: [], sizes: [], thicknesses: [], isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      api.get('/settings/customizer/colors', { signal: controller.signal }),
      api.get('/settings/customizer/shipping', { signal: controller.signal }),
      api.get('/settings/customizer/sizes', { signal: controller.signal }),
      api.get('/settings/customizer/thicknesses', { signal: controller.signal }),
    ])
      .then(([colRes, shipRes, sizeRes, thickRes]) => setState({
        colors: Array.isArray(colRes.data.colors) ? colRes.data.colors : [],
        shippingMethods: Array.isArray(shipRes.data.methods) ? shipRes.data.methods : [],
        sizes: Array.isArray(sizeRes.data.sizes) ? sizeRes.data.sizes : [],
        thicknesses: Array.isArray(thickRes.data.thicknesses) ? thickRes.data.thicknesses : [],
        isLoading: false,
        error: null,
      }))
      .catch((err) => {
        if (controller.signal.aborted) return
        setState({ colors: [], shippingMethods: [], sizes: [], thicknesses: [], isLoading: false, error: err })
      })
    return () => controller.abort()
  }, [])

  return state
}
