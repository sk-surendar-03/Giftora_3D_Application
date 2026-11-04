import bcrypt from 'bcryptjs'
import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { signAccessToken } from './jwt.js'

const SALT_ROUNDS = 12

function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export async function registerUser({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // Deliberately vague: confirms an account exists for this email, which
    // is an acceptable, common tradeoff for registration (unlike login,
    // where we never reveal whether the email exists at all).
    throw new HttpError(409, 'An account with this email already exists.')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
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

export { toPublicUser }
