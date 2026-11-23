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
  getSizes,
  updateSizes,
  getThicknesses,
  updateThicknesses,
  getStandPricing,
  updateStandPricing,
  getNameplatePricing,
  updateNameplatePricing,
  getQrStandPricing,
  updateQrStandPricing,
} from './settingsController.js'

// Public — customer frontend needs these without auth
export const settingsRouter = Router()
settingsRouter.get('/pricing', asyncHandler(getPricing))
settingsRouter.get('/announcement', asyncHandler(getAnnouncement))
settingsRouter.get('/customizer/colors', asyncHandler(getColors))
settingsRouter.get('/customizer/shipping', asyncHandler(getShipping))
settingsRouter.get('/customizer/sizes', asyncHandler(getSizes))
settingsRouter.get('/customizer/thicknesses', asyncHandler(getThicknesses))
settingsRouter.get('/stand-pricing', asyncHandler(getStandPricing))
settingsRouter.get('/nameplate-pricing', asyncHandler(getNameplatePricing))
settingsRouter.get('/qr-stand-pricing', asyncHandler(getQrStandPricing))
settingsRouter.get('/customizer/qr-stand', asyncHandler(getQrStandPricing))

// Admin-only
export const adminSettingsRouter = Router()
adminSettingsRouter.patch('/pricing', authenticate, authorize('ADMIN'), asyncHandler(updatePricing))
adminSettingsRouter.patch('/announcement', authenticate, authorize('ADMIN'), asyncHandler(updateAnnouncement))
adminSettingsRouter.patch('/customizer/colors', authenticate, authorize('ADMIN'), asyncHandler(updateColors))
adminSettingsRouter.patch('/customizer/shipping', authenticate, authorize('ADMIN'), asyncHandler(updateShipping))
adminSettingsRouter.patch('/customizer/sizes', authenticate, authorize('ADMIN'), asyncHandler(updateSizes))
adminSettingsRouter.patch('/customizer/thicknesses', authenticate, authorize('ADMIN'), asyncHandler(updateThicknesses))
adminSettingsRouter.patch('/stand-pricing', authenticate, authorize('ADMIN'), asyncHandler(updateStandPricing))
adminSettingsRouter.patch('/nameplate-pricing', authenticate, authorize('ADMIN'), asyncHandler(updateNameplatePricing))
adminSettingsRouter.patch('/qr-stand-pricing', authenticate, authorize('ADMIN'), asyncHandler(updateQrStandPricing))
adminSettingsRouter.put('/qr-stand-pricing', authenticate, authorize('ADMIN'), asyncHandler(updateQrStandPricing))
adminSettingsRouter.patch('/customizer/qr-stand', authenticate, authorize('ADMIN'), asyncHandler(updateQrStandPricing))
adminSettingsRouter.put('/customizer/qr-stand', authenticate, authorize('ADMIN'), asyncHandler(updateQrStandPricing))
