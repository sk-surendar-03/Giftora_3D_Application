import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize } from '../auth/authMiddleware.js'
import {
  getPricing,
  updatePricing,
  getAnnouncement,
  updateAnnouncement,
  getColors,
  updateColors,
  getShipping,
  updateShipping,
} from './settingsController.js'

// Public — customer frontend needs these without auth
export const settingsRouter = Router()
settingsRouter.get('/pricing', asyncHandler(getPricing))
settingsRouter.get('/announcement', asyncHandler(getAnnouncement))
settingsRouter.get('/customizer/colors', asyncHandler(getColors))
settingsRouter.get('/customizer/shipping', asyncHandler(getShipping))

// Admin-only
export const adminSettingsRouter = Router()
adminSettingsRouter.patch('/pricing', authenticate, authorize('ADMIN'), asyncHandler(updatePricing))
adminSettingsRouter.patch('/announcement', authenticate, authorize('ADMIN'), asyncHandler(updateAnnouncement))
adminSettingsRouter.patch('/customizer/colors', authenticate, authorize('ADMIN'), asyncHandler(updateColors))
adminSettingsRouter.patch('/customizer/shipping', authenticate, authorize('ADMIN'), asyncHandler(updateShipping))
