import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { register, login, logout, me, updateMe } from './authController.js'
import { authenticate, authorize } from './authMiddleware.js'

export const authRouter = Router()

authRouter.post('/register', asyncHandler(register))
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
