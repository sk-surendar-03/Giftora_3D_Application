import { useEffect, useState } from 'react'
import { fetchOrders } from './ordersApi.js'

export function useOrders() {
  const [state, setState] = useState({ data: [], isLoading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      fetchOrders(controller.signal)
        .then((orders) => setState({ data: orders, isLoading: false, error: null }))
        .catch((err) => {
          if (controller.signal.aborted) return
          setState({ data: [], isLoading: false, error: err })
        })
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [])

  return state
}
