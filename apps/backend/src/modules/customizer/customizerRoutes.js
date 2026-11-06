import express, { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { MAX_PREVIEW_BYTES, MAX_STL_BYTES } from './designOptions.js'
import { create, getById, getOptions, getPreview, uploadPreview, uploadStl } from './customizerController.js'
import { createUploadRateLimiter } from './uploadRateLimiter.js'

// Public: everything the standalone customiser needs to build its options.
export const customizerRouter = Router()
customizerRouter.get('/options', getOptions)

// Upload rate limiter: 30 uploads per minute per authenticated user
const uploadLimiter = createUploadRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many file uploads. Please wait a minute before uploading again.',
})

// A custom design always belongs to exactly one signed-in customer.
export const customDesignRouter = Router()
// Authenticate BEFORE any body is read, so anonymous uploads are rejected
// without buffering them.
customDesignRouter.use(authenticate)

customDesignRouter.post('/', asyncHandler(create))
customDesignRouter.get('/:id', asyncHandler(getById))
customDesignRouter.get('/:id/preview', asyncHandler(getPreview))
// Binary bodies use their own parsers with their own size limits; the
// global JSON parser ignores these content types.
customDesignRouter.put(
  '/:id/stl',
  uploadLimiter,
  express.raw({ type: 'application/octet-stream', limit: MAX_STL_BYTES }),
  asyncHandler(uploadStl)
)
customDesignRouter.put(
  '/:id/preview',
  uploadLimiter,
  express.raw({ type: 'image/png', limit: MAX_PREVIEW_BYTES }),
  asyncHandler(uploadPreview)
)
