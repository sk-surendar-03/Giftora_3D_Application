import { useEffect, useState } from 'react'
import Banner from '../../components/Banner.jsx'
import {
  fetchPricing,
  updatePricing,
  fetchAnnouncement,
  updateAnnouncement,
} from '../../features/settings/settingsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [pricingError, setPricingError] = useState(null)
  const [pricingSuccess, setPricingSuccess] = useState(null)
  const [announcementError, setAnnouncementError] = useState(null)
  const [announcementSuccess, setAnnouncementSuccess] = useState(null)

  const [savingPricing, setSavingPricing] = useState(false)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Stored/sent as whole-rupee cents on the backend; edited here as a plain
  // rupee amount, same convention as the product price fields elsewhere in
  // the admin UI.
  const [pricePerCharacter, setPricePerCharacter] = useState('')

  // Announcement bar state
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)

  function load() {
    setIsLoading(true)
    setLoadError(null)
    Promise.all([fetchPricing(), fetchAnnouncement()])
      .then(([pricing, announcement]) => {
        setPricePerCharacter((pricing.perCharacterPriceCents / 100).toString())
        setAnnouncementText(announcement.text || '')
        setAnnouncementEnabled(Boolean(announcement.enabled))
      })
      .catch((err) => setLoadError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [])

  async function handlePricingSubmit(e) {
    e.preventDefault()
    setPricingError(null)
    setPricingSuccess(null)
    const rupees = Number(pricePerCharacter)
    if (!Number.isFinite(rupees) || rupees < 0) {
      setPricingError('Enter a valid price of ₹0 or more.')
      return
    }
    setSavingPricing(true)
    try {
      const pricing = await updatePricing(Math.round(rupees * 100))
      setPricePerCharacter((pricing.perCharacterPriceCents / 100).toString())
      setPricingSuccess('Pricing updated. New orders will use this rate immediately.')
    } catch (err) {
      setPricingError(extractError(err))
    } finally {
      setSavingPricing(false)
    }
  }

  async function handleAnnouncementSubmit(e) {
    e.preventDefault()
    setAnnouncementError(null)
    setAnnouncementSuccess(null)
    setSavingAnnouncement(true)
    try {
      const updated = await updateAnnouncement({
        text: announcementText,
        enabled: announcementEnabled,
      })
      setAnnouncementText(updated.text)
      setAnnouncementEnabled(updated.enabled)
      setAnnouncementSuccess('Announcement bar settings saved successfully.')
    } catch (err) {
      setAnnouncementError(extractError(err))
    } finally {
      setSavingAnnouncement(false)
    }
  }

  return (
    <div className="max-w-4xl pb-16">
      <h1 className="text-xl font-semibold text-ink">Store Settings</h1>
      <p className="mt-1 text-sm text-muted">Configure store announcements and customizer pricing.</p>

      {loadError && (
        <div className="mt-4">
          <Banner tone="error">{loadError}</Banner>
        </div>
      )}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading settings…</p>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Announcement Bar / Promotional Message Section */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4">
              <h2 className="text-base font-semibold text-ink">Announcement Bar / Promotional Message</h2>
              <p className="mt-1 text-xs text-muted">
                Display promotional campaigns, festive greetings, or order dispatch notices across the customer header.
              </p>
            </div>

            {announcementError && <Banner tone="error">{announcementError}</Banner>}
            {announcementSuccess && <Banner tone="success">{announcementSuccess}</Banner>}

            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={announcementEnabled}
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
                />
                <span className="text-sm font-semibold text-ink select-none">
                  Enable Announcement Bar on Store Header
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Announcement Text
                </label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. Diwali Special — 20% OFF or Orders dispatched within 3 working days"
                  className="w-full rounded-control border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none focus:border-brand"
                />
                <p className="mt-1 text-xs text-muted">
                  Examples: "Diwali Special — 20% OFF", "New personalized gifts available!", "Orders dispatched within 3 working days"
                </p>
              </div>

              {/* Live Preview */}
              <div className="pt-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Live Preview {announcementEnabled ? '(Active on Storefront)' : '(Disabled / Hidden)'}
                </span>
                <div className={`rounded-control border border-line overflow-hidden transition-opacity ${announcementEnabled ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="bg-[#000000] text-[#FFFFFF] text-center py-2 px-4 text-[12.5px] font-medium tracking-[0.02em] select-none">
                    {announcementText.trim() || 'No announcement message entered'}
                  </div>
                </div>
                {!announcementEnabled && (
                  <p className="mt-1 text-xs text-muted italic">
                    The announcement bar is disabled and will be hidden from customer storefront.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="rounded-control bg-accent px-5 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {savingAnnouncement ? 'Saving…' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </section>

          {/* Customizer Pricing Section */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4">
              <h2 className="text-base font-semibold text-ink">3D Customizer Pricing</h2>
              <p className="mt-1 text-xs text-muted">Configure pricing used by the customer 3D customizer.</p>
            </div>

            {pricingError && <Banner tone="error">{pricingError}</Banner>}
            {pricingSuccess && <Banner tone="success">{pricingSuccess}</Banner>}

            <form onSubmit={handlePricingSubmit} className="max-w-md space-y-4">
              <label className="block text-sm font-medium text-ink">
                Price per character (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerCharacter}
                  onChange={(e) => setPricePerCharacter(e.target.value)}
                  className="mt-1.5 block w-full rounded-control border border-line px-3.5 py-2 text-sm text-ink outline-none focus:border-brand"
                  placeholder="5.00"
                />
                <span className="mt-1.5 block text-xs text-muted">
                  Charged per printable, non-space character in the customer's engraved text. Example: at ₹5/character,
                  "SURENDAR" (8 characters) costs ₹40.
                </span>
              </label>

              <button
                type="submit"
                disabled={savingPricing}
                className="rounded-control bg-accent px-5 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {savingPricing ? 'Saving…' : 'Save Pricing'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
