import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { verifyAccessToken } from './jwt.js'

/**
 * Verifies the `Authorization: Bearer <token>` header, loads the real user
 * from the database (not just trusting the token's claims), and attaches
 * it as `req.user`. Re-checking against the DB on every request (rather
 * than trusting the JWT payload alone) means a deleted/role-changed user
 * is rejected immediately instead of waiting out the token's 1h lifetime.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentication required.')
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    throw new HttpError(401, 'Invalid or expired token.')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    throw new HttpError(401, 'Invalid or expired token.')
  }
  if (!user.isActive) {
    // Blocking here — the single shared gate in front of every
    // authenticated route — covers "placing orders" and everything else
    // (cart, addresses, checkout) in one place, rather than special-casing
    // order creation alone.
    throw new HttpError(403, 'This account has been deactivated.')
  }

  req.user = { id: user.id, email: user.email, name: user.name, phone: user.phone ?? null, role: user.role }
  next()
})

/**
 * Like `authenticate`, but never rejects the request — it just attaches
 * `req.user` when a valid token is present, and leaves it `undefined`
 * otherwise. For routes that are public but behave differently for an
 * authenticated admin (e.g. product browsing showing inactive products).
 */
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return next()

  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (user) req.user = { id: user.id, email: user.email, name: user.name, phone: user.phone ?? null, role: user.role }
  } catch {
    // Invalid/expired token on an optional-auth route: treat as anonymous
    // rather than rejecting, since the route itself doesn't require auth.
  }
  next()
})

/**
 * Role-based authorization gate — must run after `authenticate`.
 * Usage: `authorize('ADMIN')` or `authorize('ADMIN', 'CUSTOMER')`.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication required.'))
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to perform this action.'))
    }
    next()
  }
}
