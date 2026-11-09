import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize } from '../auth/authMiddleware.js'
import {
  getPricing,
  updatePricing,
  getAnnouncement,
  updateAnnouncement,
} from './settingsController.js'

// Public — the customer frontend needs the current pricing and active announcement live,
// with no auth requirement (same as the product catalog).
export const settingsRouter = Router()
settingsRouter.get('/pricing', asyncHandler(getPricing))
settingsRouter.get('/announcement', asyncHandler(getAnnouncement))

// Admin-only — settings may only be changed by an authenticated admin.
export const adminSettingsRouter = Router()
adminSettingsRouter.patch('/pricing', authenticate, authorize('ADMIN'), asyncHandler(updatePricing))
adminSettingsRouter.patch('/announcement', authenticate, authorize('ADMIN'), asyncHandler(updateAnnouncement))
