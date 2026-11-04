import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAddresses } from '../features/addresses/useAddresses.js'
import Button from '../components/ui/Button'

const EMPTY_FORM = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: '', isDefault: false }

function AddressForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
      className="grid grid-cols-1 gap-4 rounded-card border border-border bg-surface p-5 sm:grid-cols-2"
    >
      <label className="block text-sm font-medium text-ink sm:col-span-2">
        Full name
        <input
          required
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Phone
        <input
          required
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Postal code
        <input
          required
          value={form.postalCode}
          onChange={(e) => update('postalCode', e.target.value)}
          className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block text-sm font-medium text-ink sm:col-span-2">
        Address line 1
        <input
          required
          value={form.line1}
          onChange={(e) => update('line1', e.target.value)}
          className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block text-sm font-medium text-ink sm:col-span-2">
        Address line 2 (optional)
        <input
          value={form.line2}
          onChange={(e) => update('line2', e.target.value)}
          className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        City
        <input
          required
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        State
        <input
          required
          value={form.state}
          onChange={(e) => update('state', e.target.value)}
          className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block text-sm font-medium text-ink sm:col-span-2">
        Country
        <input
          required
          value={form.country}
          onChange={(e) => update('country', e.target.value)}
          className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-ink sm:col-span-2">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => update('isDefault', e.target.checked)} />
        Set as default address
      </label>

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save address'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function Addresses() {
  const { addresses, isAuthenticated, isLoading, loadError, mutating, mutationError, addAddress, editAddress, removeAddress } = useAddresses()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">Your Addresses</h1>
        <p className="mt-3 text-sm text-muted">Sign in to manage your delivery addresses.</p>
        <Link to="/login" state={{ from: '/addresses' }} className="mt-6 inline-block">
          <Button variant="accent">Sign in</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-muted sm:px-6">Loading your addresses…</div>
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger sm:px-6">
        Something went wrong loading your addresses. Please try again.
      </div>
    )
  }

  async function handleAdd(form) {
    await addAddress(form)
    setShowAddForm(false)
  }

  async function handleEdit(id, form) {
    await editAddress(id, form)
    setEditingId(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this address?')) return
    await removeAddress(id)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Your Addresses</h1>
        {!showAddForm && (
          <Button variant="accent" onClick={() => setShowAddForm(true)}>
            Add address
          </Button>
        )}
      </div>

      {mutationError && <p className="mt-4 text-sm text-danger">{mutationError}</p>}

      {showAddForm && (
        <div className="mt-6">
          <AddressForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} submitting={mutating} />
        </div>
      )}

      {addresses.length === 0 && !showAddForm ? (
        <p className="mt-8 text-sm text-muted">You haven't added any addresses yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {addresses.map((address) =>
            editingId === address.id ? (
              <AddressForm
                key={address.id}
                initial={address}
                onSubmit={(form) => handleEdit(address.id, form)}
                onCancel={() => setEditingId(null)}
                submitting={mutating}
              />
            ) : (
              <div key={address.id} className="rounded-card border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{address.fullName}</p>
                      {address.isDefault && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-dark">Default</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{address.phone}</p>
                    <p className="mt-2 text-sm text-ink">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ''}
                    </p>
                    <p className="text-sm text-ink">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-sm text-ink">{address.country}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
                    <button type="button" onClick={() => setEditingId(address.id)} className="font-medium text-ink hover:text-accent-dark">
                      Edit
                    </button>
                    {!address.isDefault && (
                      <button
                        type="button"
                        disabled={mutating}
                        onClick={() => editAddress(address.id, { isDefault: true })}
                        className="font-medium text-ink hover:text-accent-dark disabled:opacity-50"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={mutating}
                      onClick={() => handleDelete(address.id)}
                      className="font-medium text-danger hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}
