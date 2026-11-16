import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'

/**
 * Checks a persistent database-backed rate limit key.
 * Survives PM2 restarts and is shared across all backend workers/instances.
 *
 * @param {string} key Unique key (e.g., "reg_otp_ip:192.168.1.1")
 * @param {object} options
 * @param {number} options.windowMs Window duration in milliseconds (default: 60,000ms = 1m)
 * @param {number} options.max Max requests per window
 * @param {string} options.message Error message on limit exceed
 */
export async function checkPersistentRateLimit(key, {
  windowMs = 60 * 1000,
  max = 5,
  message = 'Too many requests. Please wait a moment before trying again.',
} = {}) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + windowMs)

  try {
    const existing = await prisma.authRateLimit.findUnique({ where: { key } })

    if (!existing || existing.expiresAt <= now) {
      await prisma.authRateLimit.upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      })
      return { isBlocked: false, remaining: max - 1 }
    }

    if (existing.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000))
      const error = new HttpError(429, message)
      error.retryAfter = retryAfterSec
      throw error
    }

    const updated = await prisma.authRateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    })

    return { isBlocked: false, remaining: Math.max(0, max - updated.count) }
  } catch (err) {
    if (err instanceof HttpError) throw err
    // If database connection fails during rate-limit check, fail open safely
    if (
      err.name === 'PrismaClientInitializationError' ||
      err.message?.includes('reach database') ||
      err.message?.includes('connect')
    ) {
      return { isBlocked: false, remaining: max }
    }
    throw err
  }
}

/**
 * Express middleware for persistent IP-based rate limiting.
 */
export function createPersistentRateLimiter({
  prefix = 'auth',
  windowMs = 60 * 1000,
  max = 5,
  message = 'Rate limit exceeded. Please wait a moment before trying again.',
  keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || 'anonymous',
} = {}) {
  return async function persistentRateLimiter(req, res, next) {
    const ipKey = keyGenerator(req)
    const key = `${prefix}:${ipKey}`

    try {
      await checkPersistentRateLimit(key, { windowMs, max, message })
      next()
    } catch (err) {
      if (err instanceof HttpError && err.retryAfter) {
        res.setHeader('Retry-After', String(err.retryAfter))
      }
      next(err)
    }
  }
}

/**
 * Cleanup expired rate limit entries from database.
 */
export async function cleanupExpiredRateLimits() {
  try {
    const now = new Date()
    return await prisma.authRateLimit.deleteMany({
      where: { expiresAt: { lt: now } },
    })
  } catch {
    // Non-fatal background cleanup
    return { count: 0 }
  }
}
