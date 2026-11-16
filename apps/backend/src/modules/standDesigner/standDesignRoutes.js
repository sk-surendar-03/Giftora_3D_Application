import express, { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { MAX_PREVIEW_BYTES, MAX_STL_BYTES } from './standDesignOptions.js'
import { create, getById, getOptions, getPreview, uploadPreview, uploadStl } from './standDesignController.js'
import { createUploadRateLimiter } from '../customizer/uploadRateLimiter.js'

// Public: options list for the stand customizer
export const standDesignerRouter = Router()
standDesignerRouter.get('/options', getOptions)

// Upload rate limiter (reuse the customizer one)
const uploadLimiter = createUploadRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many file uploads. Please wait a minute before uploading again.',
})

export const standDesignRouter = Router()
standDesignRouter.use(authenticate)

standDesignRouter.post('/', asyncHandler(create))
standDesignRouter.get('/:id', asyncHandler(getById))
standDesignRouter.get('/:id/preview', asyncHandler(getPreview))
standDesignRouter.put(
  '/:id/stl',
  uploadLimiter,
  express.raw({ type: 'application/octet-stream', limit: MAX_STL_BYTES }),
  asyncHandler(uploadStl)
)
standDesignRouter.put(
  '/:id/preview',
  uploadLimiter,
  express.raw({ type: 'image/png', limit: MAX_PREVIEW_BYTES }),
  asyncHandler(uploadPreview)
)