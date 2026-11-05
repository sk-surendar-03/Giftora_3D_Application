import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize } from '../auth/authMiddleware.js'
import { getPricing, updatePricing } from './settingsController.js'

// Public — the customer frontend needs the current rate to price the
// customizer live, with no auth requirement (same as the product catalog).
export const settingsRouter = Router()
settingsRouter.get('/pricing', asyncHandler(getPricing))

// Admin-only — the rate itself may only be changed by an admin.
export const adminSettingsRouter = Router()
adminSettingsRouter.patch('/pricing', authenticate, authorize('ADMIN'), asyncHandler(updatePricing))
