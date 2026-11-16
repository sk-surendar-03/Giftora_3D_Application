import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { isValidEmail, isValidPassword, isNonEmptyString } from '../../utils/validation.js'
import { getOtpSecret } from '../../config/otpSecret.js'
import { sendRegistrationOtpEmail } from '../email/emailService.js'
import { signAccessToken } from './jwt.js'
import { toPublicUser } from './authService.js'

const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000 // 60 seconds
const RESEND_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_RESENDS_PER_WINDOW = 3 // 3 resends + 1 initial = 4 total OTPs
const MAX_FAILED_ATTEMPTS = 5
const SALT_ROUNDS = 12

/**
 * Computes HMAC-SHA256 hash using the mandatory dedicated OTP_SECRET.
 * Cryptographically key-separated: never falls back to JWT_SECRET.
 */
export function hashOtp(email, otp) {
  const secret = getOtpSecret()
  return crypto
    .createHmac('sha256', secret)
    .update(`${email.toLowerCase().trim()}:${String(otp).trim()}`)
    .digest('hex')
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP (100000 - 999999).
 */
export function generateNumericOtp() {
  return String(crypto.randomInt(100000, 1000000))
}

/**
 * STEP 1 & 2: Validates registration inputs, generates 6-digit OTP,
 * stages pending record in registration_otps, and sends OTP via Gmail SMTP.
 * Does NOT create a customer account in the main users table.
 */
export async function initiateRegistration({ name, email, phone, password }) {
  // Input validation
  if (!isNonEmptyString(name, 100)) throw new HttpError(400, 'Name is required.')
  if (!isValidEmail(email)) throw new HttpError(400, 'A valid email is required.')
  if (!isValidPassword(password)) throw new HttpError(400, 'Password must be 8-128 characters.')
  if (!phone || typeof phone !== 'string' || !/^[0-9+\-() ]{6,20}$/.test(phone.trim())) {
    throw new HttpError(400, 'A valid phone number is required.')
  }

  const cleanEmail = email.toLowerCase().trim()
  const cleanName = name.trim()
  const cleanPhone = phone.trim()

  // Ensure customer account does not already exist
  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } })
  if (existingUser) {
    throw new HttpError(409, 'An account with this email already exists.')
  }

  // Pre-hash password with bcrypt (so plaintext password is never stored even in pending table)
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  // Generate 6-digit OTP and HMAC-SHA256 hash
  const otp = generateNumericOtp()
  const otpHash = hashOtp(cleanEmail, otp)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS)

  // Stage pending registration with PENDING_DELIVERY status
  const staged = await prisma.registrationOtp.upsert({
    where: { email: cleanEmail },
    create: {
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone,
      passwordHash,
      otpHash,
      failedAttempts: 0,
      resendCount: 0,
      version: 1,
      lastResentAt: now,
      windowStartedAt: now,
      expiresAt,
      status: 'PENDING_DELIVERY',
    },
    update: {
      name: cleanName,
      phone: cleanPhone,
      passwordHash,
      otpHash,
      failedAttempts: 0,
      resendCount: 0,
      version: { increment: 1 },
      lastResentAt: now,
      windowStartedAt: now,
      expiresAt,
      status: 'PENDING_DELIVERY',
    },
  })

  // Safe SMTP failure handling: attempt transmission
  try {
    await sendRegistrationOtpEmail({
      email: cleanEmail,
      name: cleanName,
      otp,
    })
  } catch (err) {
    // Delivery failed: remove staged record immediately so no invalid state remains
    await prisma.registrationOtp.deleteMany({ where: { email: cleanEmail } }).catch(() => {})
    throw new HttpError(
      502,
      'Unable to send verification code to your email. Please check your email address or try again later.'
    )
  }

  // Mark record as ACTIVE after verified SMTP delivery
  await prisma.registrationOtp.update({
    where: { id: staged.id },
    data: { status: 'ACTIVE' },
  })

  return {
    success: true,
    email: cleanEmail,
    resendCooldownSeconds: 60,
  }
}

/**
 * Resends a 6-digit OTP to a pending registration email.
 * Enforces:
 * - 60s cooldown
 * - Max 3 resends per 15-minute window
 * - Previous OTP immediately invalidated
 * - New OTP gets fresh 5-minute expiry
 * - Failed attempts are cumulative and NEVER reset on resend
 */
export async function resendRegistrationOtp({ email }) {
  if (!isValidEmail(email)) {
    throw new HttpError(400, 'A valid email is required.')
  }
  const cleanEmail = email.toLowerCase().trim()

  // Privacy protection: avoid exposing whether email is registered
  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } })
  if (existingUser) {
    return {
      success: true,
      message: 'If a pending registration exists for this email, a verification code has been sent.',
      resendCooldownSeconds: 60,
    }
  }

  const record = await prisma.registrationOtp.findUnique({ where: { email: cleanEmail } })
  if (!record || record.status !== 'ACTIVE') {
    return {
      success: true,
      message: 'If a pending registration exists for this email, a verification code has been sent.',
      resendCooldownSeconds: 60,
    }
  }

  // Enforce cumulative attempt lockout
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    await prisma.registrationOtp.deleteMany({ where: { email: cleanEmail } }).catch(() => {})
    throw new HttpError(
      400,
      'Too many incorrect attempts. For security, this registration attempt has been terminated. Please restart registration.'
    )
  }

  const now = new Date()

  // Enforce 60-second cooldown
  const elapsedSec = Math.floor((now.getTime() - record.lastResentAt.getTime()) / 1000)
  if (elapsedSec < 60) {
    const remaining = 60 - elapsedSec
    const error = new HttpError(429, `Please wait ${remaining} seconds before requesting a new code.`)
    error.retryAfter = remaining
    throw error
  }

  // Enforce 15-minute window and 3-resend limit
  const windowElapsed = now.getTime() - record.windowStartedAt.getTime()
  let newWindowStartedAt = record.windowStartedAt
  let newResendCount = record.resendCount

  if (windowElapsed > RESEND_WINDOW_MS) {
    // 15-minute window expired: reset window
    newWindowStartedAt = now
    newResendCount = 0
  }

  if (newResendCount >= MAX_RESENDS_PER_WINDOW) {
    throw new HttpError(429, 'Maximum resend limit reached. Please wait before trying again.')
  }

  // Generate fresh 6-digit OTP
  const newOtp = generateNumericOtp()
  const newOtpHash = hashOtp(cleanEmail, newOtp)
  const freshExpiresAt = new Date(now.getTime() + OTP_EXPIRY_MS)
  const previousOtpHash = record.otpHash
  const nextVersion = record.version + 1

  // Optimistically stage update with PENDING_DELIVERY to invalidate old OTP immediately
  await prisma.registrationOtp.update({
    where: { id: record.id },
    data: {
      otpHash: newOtpHash,
      version: nextVersion,
      expiresAt: freshExpiresAt,
      status: 'PENDING_DELIVERY',
    },
  })

  // Safe SMTP delivery
  try {
    await sendRegistrationOtpEmail({
      email: cleanEmail,
      name: record.name,
      otp: newOtp,
    })
  } catch (err) {
    // Rollback to previous OTP hash or purge if failed
    await prisma.registrationOtp.update({
      where: { id: record.id },
      data: {
        otpHash: previousOtpHash,
        status: 'ACTIVE',
      },
    }).catch(() => {})
    throw new HttpError(502, 'Unable to send verification code. Please try again later.')
  }

  // Commit updated resend counter and lastResentAt
  await prisma.registrationOtp.update({
    where: { id: record.id },
    data: {
      status: 'ACTIVE',
      resendCount: newResendCount + 1,
      lastResentAt: now,
      windowStartedAt: newWindowStartedAt,
      // NOTE: failedAttempts is deliberately untouched (cumulative)
    },
  })

  return {
    success: true,
    message: 'Verification code resent.',
    resendCooldownSeconds: 60,
  }
}

/**
 * STEP 3: Concurrency-safe validation of the 6-digit OTP and atomic user creation.
 * Consumes the OTP permanently and activates the verified customer account.
 */
export async function verifyRegistrationOtp({ email, otp }) {
  if (!isValidEmail(email)) throw new HttpError(400, 'A valid email is required.')
  if (!otp || typeof otp !== 'string' || !/^[0-9]{6}$/.test(otp.trim())) {
    throw new HttpError(400, 'Enter a valid 6-digit verification code.')
  }

  const cleanEmail = email.toLowerCase().trim()
  const cleanOtp = otp.trim()
  const candidateHash = hashOtp(cleanEmail, cleanOtp)
  const now = new Date()

  // Acquire active registration record
  const record = await prisma.registrationOtp.findUnique({
    where: { email: cleanEmail },
  })

  if (!record || record.status !== 'ACTIVE') {
    throw new HttpError(400, 'No active registration session found. Please request a new code.')
  }

  // Check expiration (5 minutes)
  if (record.expiresAt < now) {
    throw new HttpError(400, 'Verification code has expired. Please request a new code.')
  }

  // Check attempt limit (max 5 cumulative)
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    await prisma.registrationOtp.deleteMany({ where: { id: record.id } }).catch(() => {})
    throw new HttpError(
      400,
      'Too many incorrect attempts. For security, this registration attempt has been terminated. Please restart registration.'
    )
  }

  // Compare HMAC-SHA256 hash using timing-safe buffer comparison
  const hashBuf = Buffer.from(record.otpHash, 'utf8')
  const candBuf = Buffer.from(candidateHash, 'utf8')
  const matches = hashBuf.length === candBuf.length && crypto.timingSafeEqual(hashBuf, candBuf)

  if (!matches) {
    // Atomically increment failedAttempts outside of throwing transaction so it persists in DB
    let updatedRecord
    try {
      updatedRecord = await prisma.registrationOtp.update({
        where: { id: record.id },
        data: {
          failedAttempts: { increment: 1 },
        },
        select: {
          id: true,
          failedAttempts: true,
        },
      })
    } catch {
      // If record was already deleted or not found
      throw new HttpError(
        400,
        'Too many incorrect attempts. For security, this registration attempt has been terminated. Please restart registration.'
      )
    }

    if (updatedRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await prisma.registrationOtp.deleteMany({ where: { id: record.id } }).catch(() => {})
      throw new HttpError(
        400,
        'Too many incorrect attempts. For security, this registration attempt has been terminated. Please restart registration.'
      )
    }

    const remaining = MAX_FAILED_ATTEMPTS - updatedRecord.failedAttempts
    throw new HttpError(400, `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`)
  }

  // Concurrency-safe atomic transaction for user creation and consuming OTP
  return await prisma.$transaction(async (tx) => {
    // Re-verify the record within the transaction
    const currentRecord = await tx.registrationOtp.findUnique({
      where: { id: record.id },
    })

    if (!currentRecord || currentRecord.status !== 'ACTIVE') {
      throw new HttpError(400, 'No active registration session found. Please request a new code.')
    }

    // Check expiration inside transaction
    if (currentRecord.expiresAt < now) {
      throw new HttpError(400, 'Verification code has expired. Please request a new code.')
    }

    // Check attempt limit inside transaction
    if (currentRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await tx.registrationOtp.deleteMany({ where: { id: currentRecord.id } }).catch(() => {})
      throw new HttpError(
        400,
        'Too many incorrect attempts. For security, this registration attempt has been terminated. Please restart registration.'
      )
    }

    // Re-verify OTP hash has not been superseded by a concurrent resend
    const currentHashBuf = Buffer.from(currentRecord.otpHash, 'utf8')
    const matchesNow = currentHashBuf.length === candBuf.length && crypto.timingSafeEqual(currentHashBuf, candBuf)
    if (!matchesNow) {
      throw new HttpError(400, 'Verification code is invalid or has been superseded. Please check your latest email.')
    }

    // Concurrency double-check: ensure user wasn't created by a racing process
    const duplicateUser = await tx.user.findUnique({ where: { email: cleanEmail } })
    if (duplicateUser) {
      await tx.registrationOtp.deleteMany({ where: { id: currentRecord.id } }).catch(() => {})
      throw new HttpError(409, 'An account with this email already exists.')
    }

    // Create the verified customer account
    const user = await tx.user.create({
      data: {
        name: currentRecord.name,
        email: currentRecord.email,
        phone: currentRecord.phone,
        passwordHash: currentRecord.passwordHash,
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: now,
      },
    })

    // Consume the OTP permanently by deleting the staging record
    await tx.registrationOtp.delete({ where: { id: currentRecord.id } })

    const token = signAccessToken(user)
    return {
      user: toPublicUser(user),
      token,
    }
  })
}

/**
 * Opportunistic and scheduled cleanup.
 * Strictly deletes only expired abandoned registration records (> 1 hour old).
 * NEVER deletes active registration sessions or real customer accounts in `users`.
 */
export async function cleanupExpiredRegistrationOtps() {
  try {
    const threshold = new Date(Date.now() - 60 * 60 * 1000) // 1 hour past expiry
    return await prisma.registrationOtp.deleteMany({
      where: { expiresAt: { lt: threshold } },
    })
  } catch {
    return { count: 0 }
  }
}
