import { useEffect, useState } from 'react'
import Banner from '../../components/Banner.jsx'
import api from '../../services/api.js'
import { useAuth } from '../../features/auth/useAuth.js'
import { fetchAnnouncement, updateAnnouncement } from '../../features/settings/settingsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

// ─── Admin Details Card ───────────────────────────────────────────────────────
function AdminDetailsCard({ currentUser, onUserUpdated }) {
  const [name, setName] = useState(currentUser?.name ?? '')
  const [phone, setPhone] = useState(currentUser?.phone ?? '')

  useEffect(() => {
    setName(currentUser?.name ?? '')
    setPhone(currentUser?.phone ?? '')
  }, [currentUser])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  async function handleSave(e) {
    e.preventDefault()
    setError(null); setStatus(null)

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    const body = { name: name.trim(), phone: phone.trim() }
    if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword }

    setSaving(true)
    try {
      const { data } = await api.patch('/auth/me', body)
      onUserUpdated(data.user)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setStatus('ok')
      setTimeout(() => setStatus(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Save failed.')
      setStatus('err')
    }
    setSaving(false)
  }

  return (
    <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
      <div className="border-b border-line pb-3 mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Admin Details</h2>
          <p className="mt-1 text-xs text-muted">Update your name, email, or change your login password.</p>
        </div>
        <button type="button" onClick={handleSave} disabled={saving}
          className="shrink-0 rounded-control bg-accent px-4 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
          {saving ? 'Saving…' : status === 'ok' ? '✓ Saved!' : status === 'err' ? 'Error!' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="mb-3"><Banner tone="error">{error}</Banner></div>}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-control border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none focus:border-brand"
              placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-control border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none focus:border-brand"
              placeholder="contact@example.com" />
          </div>
        </div>

        <div className="pt-2 border-t border-line">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-3">Change Password <span className="normal-case font-normal">(leave blank to keep current)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v), autoComplete: 'current-password' },
              { label: 'New Password', value: newPassword, setter: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v), autoComplete: 'new-password' },
              { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v), autoComplete: 'new-password' },
            ].map(({ label, value, setter, show, toggle, autoComplete }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full rounded-control border border-line bg-surface px-3.5 py-2 pr-10 text-sm text-ink outline-none focus:border-brand"
                    placeholder="••••••••"
                    autoComplete={autoComplete}
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); toggle() }}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-ink cursor-pointer select-none"
                    tabIndex={-1}
                  >
                    <span className="text-[11px] font-semibold">{show ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted">
          <span className="font-medium text-ink">Email:</span> {currentUser?.email ?? '—'} &nbsp;·&nbsp;
          <span className="font-medium text-ink">Role:</span> {currentUser?.role ?? '—'}
        </p>
      </form>
    </section>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
  const { user, updateUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Announcement
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [announcementError, setAnnouncementError] = useState(null)
  const [announcementSuccess, setAnnouncementSuccess] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    fetchAnnouncement()
      .then((announcement) => {
        setAnnouncementText(announcement.text || '')
        setAnnouncementEnabled(Boolean(announcement.enabled))
      })
      .catch((err) => setLoadError(extractError(err)))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleAnnouncementSubmit(e) {
    e.preventDefault()
    setAnnouncementError(null)
    setAnnouncementSuccess(null)
    setSavingAnnouncement(true)
    try {
      const updated = await updateAnnouncement({ text: announcementText, enabled: announcementEnabled })
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
      <p className="mt-1 text-sm text-muted">Manage your admin account and store announcement.</p>

      {loadError && <div className="mt-4"><Banner tone="error">{loadError}</Banner></div>}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading settings…</p>
      ) : (
        <div className="mt-6 space-y-8">

          {/* Admin Details */}
          <AdminDetailsCard currentUser={user} onUserUpdated={updateUser} />

          {/* Announcement Bar */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="border-b border-line pb-3 mb-4">
              <h2 className="text-base font-semibold text-ink">Announcement Bar / Promotional Message</h2>
              <p className="mt-1 text-xs text-muted">Display promotional campaigns, festive greetings, or order dispatch notices across the customer header.</p>
            </div>
            {announcementError && <Banner tone="error">{announcementError}</Banner>}
            {announcementSuccess && <Banner tone="success">{announcementSuccess}</Banner>}
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input type="checkbox" checked={announcementEnabled} onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-accent focus:ring-accent" />
                <span className="text-sm font-semibold text-ink select-none">Enable Announcement Bar on Store Header</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Announcement Text</label>
                <input type="text" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder='e.g. Diwali Special — 20% OFF or Orders dispatched within 3 working days'
                  className="w-full rounded-control border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none focus:border-brand" />
                <p className="mt-1 text-xs text-muted">Examples: "Diwali Special — 20% OFF", "New personalized gifts available!", "Orders dispatched within 3 working days"</p>
              </div>
              <div className="pt-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Live Preview {announcementEnabled ? '(Active on Storefront)' : '(Disabled / Hidden)'}
                </span>
                <div className={`rounded-control border border-line overflow-hidden transition-opacity ${announcementEnabled ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="bg-[#000000] text-[#FFFFFF] text-center py-2 px-4 text-[12.5px] font-medium tracking-[0.02em] select-none">
                    {announcementText.trim() || 'No announcement message entered'}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={savingAnnouncement}
                  className="rounded-control bg-accent px-5 py-2 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm">
                  {savingAnnouncement ? 'Saving…' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </section>

        </div>
      )}
    </div>
  )
}
