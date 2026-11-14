import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAddresses } from '../features/addresses/useAddresses.js'
import Button from '../components/ui/Button'

const PHONE_RE = /^[0-9]{10}$/
const POSTAL_RE = /^[0-9]{6}$/

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  isDefault: false,
}

function normalizeForm(initial) {
  if (!initial) return EMPTY_FORM
  return {
    fullName: initial.fullName || '',
    phone: initial.phone || '',
    line1: initial.line1 || '',
    line2: initial.line2 || '',
    city: initial.city || '',
    state: initial.state || '',
    postalCode: initial.postalCode || '',
    country: initial.country || '',
    isDefault: Boolean(initial.isDefault),
  }
}

function AddressForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(() => normalizeForm(initial))
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.'
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required.'
    } else if (!PHONE_RE.test(form.phone.trim())) {
      errs.phone = 'Phone must be exactly 10 digits (numbers only).'
    }

    if (!form.line1.trim()) errs.line1 = 'Address line 1 is required.'
    if (!form.city.trim()) errs.city = 'City is required.'
    if (!form.state.trim()) errs.state = 'State is required.'

    if (!form.postalCode.trim()) {
      errs.postalCode = 'Postal code is required.'
    } else if (!POSTAL_RE.test(form.postalCode.trim())) {
      errs.postalCode = 'Postal code must be exactly 6 digits.'
    }

    if (!form.country.trim()) errs.country = 'Country is required.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid grid-cols-1 gap-4 rounded-card border border-line bg-surface p-5 min-[761px]:grid-cols-2 shadow-sm"
    >
      <div className="min-[761px]:col-span-2">
        <label className="block text-sm font-semibold text-ink" htmlFor="addr-name">
          Full Name <span className="text-danger">*</span>
        </label>
        <input
          id="addr-name"
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          placeholder="e.g. Rahul Sharma"
          className={`mt-1.5 block w-full rounded-control border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
            errors.fullName
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line focus:border-accent focus:ring-accent/30'
          }`}
        />
        {errors.fullName && <p className="mt-1 text-xs text-danger font-medium">{errors.fullName}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor="addr-phone">
          Phone Number <span className="text-danger">*</span>
        </label>
        <input
          id="addr-phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile number"
          className={`mt-1.5 block w-full rounded-control border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
            errors.phone
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line focus:border-accent focus:ring-accent/30'
          }`}
        />
        {errors.phone && <p className="mt-1 text-xs text-danger font-medium">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor="addr-postal">
          Postal / ZIP Code <span className="text-danger">*</span>
        </label>
        <input
          id="addr-postal"
          inputMode="numeric"
          maxLength={6}
          value={form.postalCode}
          onChange={(e) => update('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="e.g. 560001"
          className={`mt-1.5 block w-full rounded-control border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
            errors.postalCode
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line focus:border-accent focus:ring-accent/30'
          }`}
        />
        {errors.postalCode && <p className="mt-1 text-xs text-danger font-medium">{errors.postalCode}</p>}
      </div>

      <div className="min-[761px]:col-span-2">
        <label className="block text-sm font-semibold text-ink" htmlFor="addr-line1">
          Address Line 1 <span className="text-danger">*</span>
        </label>
        <input
          id="addr-line1"
          value={form.line1}
          onChange={(e) => update('line1', e.target.value)}
          placeholder="House/Flat number, Street name, Area"
          className={`mt-1.5 block w-full rounded-control border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
            errors.line1
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line focus:border-accent focus:ring-accent/30'
          }`}
        />
        {errors.line1 && <p className="mt-1 text-xs text-danger font-medium">{errors.line1}</p>}
      </div>

      <div className="min-[761px]:col-span-2">
        <label className="block text-sm font-semibold text-ink" htmlFor="addr-line2">
          Address Line 2 <span className="text-muted font-normal text-xs">(optional)</span>
        </label>
        <input
          id="addr-line2"
          value={form.line2}
          onChange={(e) => update('line2', e.target.value)}
          placeholder="Apartment, suite, unit, building, landmark"
          className="mt-1.5 block w-full rounded-control border border-line px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor="addr-city">
          City <span className="text-danger">*</span>
        </label>
        <input
          id="addr-city"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          placeholder="e.g. Bengaluru"
          className={`mt-1.5 block w-full rounded-control border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
            errors.city
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line focus:border-accent focus:ring-accent/30'
          }`}
        />
        {errors.city && <p className="mt-1 text-xs text-danger font-medium">{errors.city}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink" htmlFor="addr-state">
          State <span className="text-danger">*</span>
        </label>
        <input
          id="addr-state"
          value={form.state}
          onChange={(e) => update('state', e.target.value)}
          placeholder="e.g. Karnataka"
          className={`mt-1.5 block w-full rounded-control border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
            errors.state
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line focus:border-accent focus:ring-accent/30'
          }`}
        />
        {errors.state && <p className="mt-1 text-xs text-danger font-medium">{errors.state}</p>}
      </div>

      <div className="min-[761px]:col-span-2">
        <label className="block text-sm font-semibold text-ink" htmlFor="addr-country">
          Country <span className="text-danger">*</span>
        </label>
        <input
          id="addr-country"
          value={form.country}
          onChange={(e) => update('country', e.target.value)}
          placeholder="e.g. India"
          className={`mt-1.5 block w-full rounded-control border px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 ${
            errors.country
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line focus:border-accent focus:ring-accent/30'
          }`}
        />
        {errors.country && <p className="mt-1 text-xs text-danger font-medium">{errors.country}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-ink min-[761px]:col-span-2 select-none cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => update('isDefault', e.target.checked)}
          className="rounded border-line text-accent focus:ring-accent"
        />
        Set as default address for shipping
      </label>

      <div className="flex gap-3 min-[761px]:col-span-2 pt-2">
        <Button type="submit" variant="primary" disabled={submitting}>
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
  const {
    addresses,
    isAuthenticated,
    isLoading,
    loadError,
    mutating,
    mutationError,
    addAddress,
    editAddress,
    removeAddress,
  } = useAddresses()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const fromCheckout = location.state?.from === '/checkout'

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[500px] px-[18px] py-24 text-center">
        <h1 className="text-2xl font-semibold text-ink">Your Addresses</h1>
        <p className="mt-3 text-sm text-muted">Sign in to manage your delivery addresses.</p>
        <Link to="/login" state={{ from: '/addresses' }} className="mt-6 inline-block">
          <Button variant="accent">Sign in</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-[18px] py-24 text-center text-sm text-muted">
        Loading your addresses…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[500px] px-[18px] py-24 text-center text-sm text-danger">
        Something went wrong loading your addresses. Please try again.
      </div>
    )
  }

  async function handleAdd(form) {
    await addAddress(form)
    setShowAddForm(false)
    if (fromCheckout) navigate('/checkout')
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
    <div className="mx-auto max-w-[1400px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-12">
      {fromCheckout && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent/40 bg-soft px-4 py-3">
          <span className="text-sm text-muted">Add an address, then continue to checkout.</span>
          <Link to="/checkout">
            <Button variant="primary" size="sm" className="whitespace-nowrap">Continue to Checkout</Button>
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Your Addresses</h1>
          <p className="mt-1 text-xs text-muted">Manage your delivery destinations for 3D printed orders.</p>
        </div>
        {!showAddForm && (
          <Button variant="primary" onClick={() => setShowAddForm(true)}>
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
              <div key={address.id} className="rounded-card border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{address.fullName}</p>
                      {address.isDefault && (
                        <span className="rounded-full bg-soft border border-line px-2 py-0.5 text-xs font-medium text-accent">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted font-mono">{address.phone}</p>
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
                    <button
                      type="button"
                      onClick={() => setEditingId(address.id)}
                      className="font-medium text-ink hover:text-accent"
                    >
                      Edit
                    </button>
                    {!address.isDefault && (
                      <button
                        type="button"
                        disabled={mutating}
                        onClick={() => editAddress(address.id, { isDefault: true })}
                        className="font-medium text-ink hover:text-accent disabled:opacity-50"
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
