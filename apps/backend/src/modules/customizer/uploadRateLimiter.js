import { HttpError } from '../../utils/httpError.js'

/**
 * In-memory sliding-window rate limiter for uploads per user.
 * No external dependencies required.
 *
 * @param {object} options
 * @param {number} options.windowMs - Window duration in milliseconds (default: 60s)
 * @param {number} options.max - Max requests per window per user (default: 30)
 * @param {string} options.message - Error message when rate limit exceeded
 */
export function createUploadRateLimiter({
  windowMs = 60 * 1000,
  max = 30,
  message = 'Upload rate limit exceeded. Please wait a moment before trying again.',
} = {}) {
  const store = new Map()

  // Periodically clean up expired entries every 5 minutes to prevent memory leak
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of store.entries()) {
      const active = timestamps.filter((t) => now - t < windowMs)
      if (active.length === 0) {
        store.delete(key)
      } else {
        store.set(key, active)
      }
    }
  }, 5 * 60 * 1000)

  // Unref timer so it doesn't hold open test runners or node processes
  if (cleanupTimer.unref) cleanupTimer.unref()

  return function rateLimiter(req, res, next) {
    const userId = req.user?.id || req.ip || 'anonymous'
    const now = Date.now()

    const timestamps = store.get(userId) || []
    const windowStart = now - windowMs
    const activeTimestamps = timestamps.filter((t) => t > windowStart)

    if (activeTimestamps.length >= max) {
      const retryAfterSec = Math.ceil((activeTimestamps[0] + windowMs - now) / 1000)
      res.setHeader('Retry-After', retryAfterSec)
      throw new HttpError(429, message)
    }

    activeTimestamps.push(now)
    store.set(userId, activeTimestamps)
    next()
  }
}
