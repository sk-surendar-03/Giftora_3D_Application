import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from './addressesApi.js'

export function useAddresses() {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({ data: [], isLoading: isAuthenticated, error: null })
  const [mutating, setMutating] = useState(false)
  const [mutationError, setMutationError] = useState(null)

  const load = useCallback(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setState({ data: [], isLoading: false, error: null })
        return
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      fetchAddresses(controller.signal)
        .then((addresses) => setState({ data: addresses, isLoading: false, error: null }))
        .catch((err) => {
          if (controller.signal.aborted) return
          setState({ data: [], isLoading: false, error: err })
        })
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isAuthenticated])

  useEffect(() => load(), [load])

  async function runMutation(fn) {
    setMutating(true)
    setMutationError(null)
    try {
      const result = await fn()
      load()
      return result
    } catch (err) {
      setMutationError(err.response?.data?.error ?? err.message ?? 'Something went wrong.')
      throw err
    } finally {
      setMutating(false)
    }
  }

  return {
    addresses: state.data,
    isAuthenticated,
    isLoading: state.isLoading,
    loadError: state.error,
    mutating,
    mutationError,
    addAddress: (payload) => runMutation(() => createAddress(payload)),
    editAddress: (id, payload) => runMutation(() => updateAddress(id, payload)),
    removeAddress: (id) => runMutation(() => deleteAddress(id)),
  }
}
