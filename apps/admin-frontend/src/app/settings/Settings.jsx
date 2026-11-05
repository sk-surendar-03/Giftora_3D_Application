import { useEffect, useState } from 'react'
import Banner from '../../components/Banner.jsx'
import { fetchPricing, updatePricing } from '../../features/settings/settingsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // Stored/sent as whole-rupee cents on the backend; edited here as a plain
  // rupee amount, same convention as the product price fields elsewhere in
  // the admin UI.
  const [pricePerCharacter, setPricePerCharacter] = useState('')

  function load() {
    setIsLoading(true)
    setLoadError(null)
    fetchPricing()
      .then((pricing) => setPricePerCharacter((pricing.perCharacterPriceCents / 100).toString()))
      .catch((err) => setLoadError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    const rupees = Number(pricePerCharacter)
    if (!Number.isFinite(rupees) || rupees < 0) {
      setFormError('Enter a valid price of ₹0 or more.')
      return
    }
    setSubmitting(true)
    try {
      const pricing = await updatePricing(Math.round(rupees * 100))
      setPricePerCharacter((pricing.perCharacterPriceCents / 100).toString())
      setSuccessMessage('Pricing updated. New orders will use this rate immediately.')
    } catch (err) {
      setFormError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Configure pricing used by the customer 3D customizer.</p>

      <div className="mt-4">
        <Banner tone="error">{formError ?? loadError}</Banner>
        <Banner tone="success">{successMessage}</Banner>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-gray-500">Loading settings…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <label className="block text-sm font-medium text-gray-700">
            Price per character (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricePerCharacter}
              onChange={(e) => setPricePerCharacter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="5.00"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Charged per printable, non-space character in the customer's engraved text. Example: at ₹5/character,
              "SURENDAR" (8 characters) costs ₹40.
            </span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </form>
      )}
    </div>
  )
}
