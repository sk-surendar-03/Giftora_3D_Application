import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  register,
  registerRequest,
  registerVerify,
  registerResend,
  login,
  logout,
  me,
  updateMe,
} from './authController.js'
import { authenticate, authorize } from './authMiddleware.js'
import { createPersistentRateLimiter } from './persistentRateLimiter.js'

export const authRouter = Router()

// Persistent rate limiters for registration endpoints (shared across PM2 workers, survives restarts)
const registerRequestLimiter = createPersistentRateLimiter({
  prefix: 'reg_req_ip',
  max: 15,
  windowMs: 15 * 60 * 1000,
  message: 'Too many registration attempts from this IP. Please wait before trying again.',
})

const registerVerifyLimiter = createPersistentRateLimiter({
  prefix: 'reg_verify_ip',
  max: 25,
  windowMs: 15 * 60 * 1000,
  message: 'Too many verification attempts from this IP. Please wait before trying again.',
})

const registerResendLimiter = createPersistentRateLimiter({
  prefix: 'reg_resend_ip',
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many resend requests from this IP. Please wait before trying again.',
})

// Customer registration endpoints with mandatory 6-digit email OTP verification
authRouter.post('/register', registerRequestLimiter, asyncHandler(register))
authRouter.post('/register-request', registerRequestLimiter, asyncHandler(registerRequest))
authRouter.post('/register/initiate', registerRequestLimiter, asyncHandler(registerRequest))
authRouter.post('/register-verify', registerVerifyLimiter, asyncHandler(registerVerify))
authRouter.post('/register-resend', registerResendLimiter, asyncHandler(registerResend))

// Standard authentication endpoints
authRouter.post('/login', asyncHandler(login))
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, me)
authRouter.patch('/me', authenticate, asyncHandler(updateMe))

// Minimal end-to-end proof that role-based authorization actually works —
// real admin-only business routes belong to their own modules in later
// phases (product management, order management, etc.), not here.
authRouter.get('/admin-check', authenticate, authorize('ADMIN'), (req, res) => {
  res.json({ ok: true, role: req.user.role })
})
