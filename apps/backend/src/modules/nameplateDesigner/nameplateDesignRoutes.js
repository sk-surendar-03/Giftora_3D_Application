import express, { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { createUploadRateLimiter } from '../customizer/uploadRateLimiter.js'
import {
  create,
  getById,
  getOptions,
  getPreview,
  uploadPreview,
  uploadStl,
} from './nameplateDesignController.js'

const MAX_STL_BYTES = 50 * 1024 * 1024
const MAX_PREVIEW_BYTES = 2 * 1024 * 1024

// Public: options list for nameplate customizer
export const nameplateDesignerRouter = Router()
nameplateDesignerRouter.get('/options', asyncHandler(getOptions))

const uploadLimiter = createUploadRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many file uploads. Please wait a minute before uploading again.',
})

// Customer design persistence routes
export const nameplateDesignRouter = Router()
nameplateDesignRouter.use(authenticate)

nameplateDesignRouter.post('/', asyncHandler(create))
nameplateDesignRouter.get('/:id', asyncHandler(getById))
nameplateDesignRouter.get('/:id/preview', asyncHandler(getPreview))
nameplateDesignRouter.put(
  '/:id/stl',
  uploadLimiter,
  express.raw({ type: 'application/octet-stream', limit: MAX_STL_BYTES }),
  asyncHandler(uploadStl)
)
nameplateDesignRouter.put(
  '/:id/preview',
  uploadLimiter,
  express.raw({ type: 'image/png', limit: MAX_PREVIEW_BYTES }),
  asyncHandler(uploadPreview)
)
