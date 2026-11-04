import { HttpError } from '../../utils/httpError.js'
import { isNonEmptyString } from '../../utils/validation.js'
import { listAddresses, createAddress, updateAddress, deleteAddress } from './addressService.js'

const PHONE_RE = /^[0-9+\-() ]{6,20}$/
const POSTAL_RE = /^[A-Za-z0-9\- ]{3,12}$/

function validateAddressInput(body, { partial }) {
  const { fullName, phone, line1, line2, city, state, postalCode, country, isDefault } = body ?? {}

  if (!partial || fullName !== undefined) {
    if (!isNonEmptyString(fullName, 100)) throw new HttpError(400, 'Full name is required.')
  }
  if (!partial || phone !== undefined) {
    if (typeof phone !== 'string' || !PHONE_RE.test(phone)) throw new HttpError(400, 'A valid phone number is required.')
  }
  if (!partial || line1 !== undefined) {
    if (!isNonEmptyString(line1, 200)) throw new HttpError(400, 'Address line 1 is required.')
  }
  if (line2 !== undefined && line2 !== null && (typeof line2 !== 'string' || line2.length > 200)) {
    throw new HttpError(400, 'Address line 2 must be a string.')
  }
  if (!partial || city !== undefined) {
    if (!isNonEmptyString(city, 100)) throw new HttpError(400, 'City is required.')
  }
  if (!partial || state !== undefined) {
    if (!isNonEmptyString(state, 100)) throw new HttpError(400, 'State is required.')
  }
  if (!partial || postalCode !== undefined) {
    if (typeof postalCode !== 'string' || !POSTAL_RE.test(postalCode)) throw new HttpError(400, 'A valid postal code is required.')
  }
  if (!partial || country !== undefined) {
    if (!isNonEmptyString(country, 100)) throw new HttpError(400, 'Country is required.')
  }
  if (isDefault !== undefined && typeof isDefault !== 'boolean') {
    throw new HttpError(400, 'isDefault must be a boolean.')
  }

  return {
    ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
    ...(phone !== undefined ? { phone: phone.trim() } : {}),
    ...(line1 !== undefined ? { line1: line1.trim() } : {}),
    ...(line2 !== undefined ? { line2: line2 ? line2.trim() : null } : {}),
    ...(city !== undefined ? { city: city.trim() } : {}),
    ...(state !== undefined ? { state: state.trim() } : {}),
    ...(postalCode !== undefined ? { postalCode: postalCode.trim() } : {}),
    ...(country !== undefined ? { country: country.trim() } : {}),
    ...(isDefault !== undefined ? { isDefault } : {}),
  }
}

export async function list(req, res) {
  res.json({ addresses: await listAddresses(req.user.id) })
}

export async function create(req, res) {
  const data = validateAddressInput(req.body, { partial: false })
  const address = await createAddress(req.user.id, data)
  res.status(201).json({ address })
}

export async function update(req, res) {
  const data = validateAddressInput(req.body, { partial: true })
  const address = await updateAddress(req.user.id, req.params.id, data)
  res.json({ address })
}

export async function remove(req, res) {
  await deleteAddress(req.user.id, req.params.id)
  res.status(204).end()
}
