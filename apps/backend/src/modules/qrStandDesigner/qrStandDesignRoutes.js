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
} from './qrStandDesignController.js'

const MAX_STL_BYTES = 50 * 1024 * 1024
const MAX_PREVIEW_BYTES = 2 * 1024 * 1024

// Public: options for QR Stand customizer
export const qrStandDesignerRouter = Router()
qrStandDesignerRouter.get('/options', asyncHandler(getOptions))

const uploadLimiter = createUploadRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many file uploads. Please wait a minute before uploading again.',
})

// Customer design persistence routes
export const qrStandDesignRouter = Router()
qrStandDesignRouter.use(authenticate)

qrStandDesignRouter.post('/', asyncHandler(create))
qrStandDesignRouter.get('/:id', asyncHandler(getById))
qrStandDesignRouter.get('/:id/preview', asyncHandler(getPreview))
qrStandDesignRouter.put(
  '/:id/stl',
  uploadLimiter,
  express.raw({ type: 'application/octet-stream', limit: MAX_STL_BYTES }),
  asyncHandler(uploadStl)
)
qrStandDesignRouter.put(
  '/:id/preview',
  uploadLimiter,
  express.raw({ type: 'image/png', limit: MAX_PREVIEW_BYTES }),
  asyncHandler(uploadPreview)
)
