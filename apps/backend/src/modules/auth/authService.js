import bcrypt from 'bcryptjs'
import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { signAccessToken } from './jwt.js'

const SALT_ROUNDS = 12

function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, phone: user.phone ?? null, role: user.role }
}

export async function registerUser({ name, email, password, phone }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // Deliberately vague: confirms an account exists for this email, which
    // is an acceptable, common tradeoff for registration (unlike login,
    // where we never reveal whether the email exists at all).
    throw new HttpError(409, 'An account with this email already exists.')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone },
  })

  return { user: toPublicUser(user), token: signAccessToken(user) }
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })
  // Same generic error whether the email doesn't exist or the password is
  // wrong, and bcrypt.compare runs either way (against a fixed dummy hash
  // when there's no user) so the response doesn't leak which case it was
  // via a timing difference.
  const passwordHash = user?.passwordHash ?? '$2b$12$skKhfeAxVr/ao7VJVE3rZO.pm6h80WeOKuZLUfbRmfSQf/rMvjx6q'
  const passwordMatches = await bcrypt.compare(password, passwordHash)

  if (!user || !passwordMatches) {
    throw new HttpError(401, 'Invalid email or password.')
  }
  if (!user.isActive) {
    // Credentials were correct, but the account itself has been
    // deactivated (Phase 13) — a distinct, honest reason to refuse,
    // not the generic "invalid email or password".
    throw new HttpError(403, 'This account has been deactivated.')
  }

  return { user: toPublicUser(user), token: signAccessToken(user) }
}

export async function updateProfile(userId, { name, phone, currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new HttpError(404, 'User not found.')

  const data = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'Name is required.')
    data.name = name.trim()
  }

  if (phone !== undefined) {
    if (typeof phone !== 'string' || !phone.trim()) throw new HttpError(400, 'Contact info is required.')
    data.phone = phone.trim()
  }

  if (newPassword !== undefined) {
    if (typeof currentPassword !== 'string' || !currentPassword) throw new HttpError(400, 'Current password is required to set a new password.')
    const matches = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!matches) throw new HttpError(401, 'Current password is incorrect.')
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) throw new HttpError(400, 'New password must be 8-128 characters.')
    data.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  }

  if (Object.keys(data).length === 0) return toPublicUser(user)

  const updated = await prisma.user.update({ where: { id: userId }, data })
  return toPublicUser(updated)
}

export { toPublicUser }
