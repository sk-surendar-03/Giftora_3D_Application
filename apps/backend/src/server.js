import 'dotenv/config'
import app from './app.js'
import { prisma } from './config/db.js'
import { getOtpSecret } from './config/otpSecret.js'
import { cleanupExpiredRegistrationOtps } from './modules/auth/registrationOtpService.js'
import { cleanupExpiredRateLimits } from './modules/auth/persistentRateLimiter.js'

// Fail-fast startup validation: ensure mandatory OTP_SECRET is configured
getOtpSecret()

const port = process.env.PORT || 4000

// Background periodic cleanup for expired abandoned registration records and rate limits (every 30 mins)
const cleanupInterval = setInterval(async () => {
  try {
    await Promise.all([
      cleanupExpiredRegistrationOtps(),
      cleanupExpiredRateLimits(),
    ])
  } catch (err) {
    console.error('Background cleanup error:', err.message)
  }
}, 30 * 60 * 1000)
cleanupInterval.unref()

const server = app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`)
})

async function shutdown() {
  clearInterval(cleanupInterval)
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
