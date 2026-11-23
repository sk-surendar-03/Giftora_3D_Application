import express, { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { createUploadRateLimiter } from '../customizer/uploadRateLimiter.js'
import {
  create,
  getById,
  getOptions,
  getPhoto,
  getPreview,
  uploadBaseStl,
  uploadPhoto,
  uploadPreview,
  uploadStl,
} from './lithophaneDesignController.js'

const MAX_STL_BYTES = 50 * 1024 * 1024
const MAX_BASE_STL_BYTES = 25 * 1024 * 1024
const MAX_PREVIEW_BYTES = 2 * 1024 * 1024
const MAX_PHOTO_BYTES = 15 * 1024 * 1024

// Public: options for Lithophane Photo Lamp customizer
export const photoLampDesignerRouter = Router()
photoLampDesignerRouter.get('/options', asyncHandler(getOptions))

const uploadLimiter = createUploadRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many file uploads. Please wait a minute before uploading again.',
})

// Customer design persistence routes
export const photoLampDesignRouter = Router()
photoLampDesignRouter.use(authenticate)

// Upload customer photo (multipart/binary buffer, EXIF stripped, saved as progressive JPEG)
photoLampDesignRouter.post(
  '/photos',
  uploadLimiter,
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/octet-stream'],
    limit: MAX_PHOTO_BYTES,
  }),
  asyncHandler(uploadPhoto)
)

photoLampDesignRouter.post('/', asyncHandler(create))
photoLampDesignRouter.get('/:id', asyncHandler(getById))
photoLampDesignRouter.get('/:id/photo/:slotIndex', asyncHandler(getPhoto))
photoLampDesignRouter.get('/:id/preview', asyncHandler(getPreview))

photoLampDesignRouter.put(
  '/:id/stl',
  uploadLimiter,
  express.raw({ type: 'application/octet-stream', limit: MAX_STL_BYTES }),
  asyncHandler(uploadStl)
)

photoLampDesignRouter.put(
  '/:id/base-stl',
  uploadLimiter,
  express.raw({ type: 'application/octet-stream', limit: MAX_BASE_STL_BYTES }),
  asyncHandler(uploadBaseStl)
)

photoLampDesignRouter.put(
  '/:id/preview',
  uploadLimiter,
  express.raw({ type: 'image/png', limit: MAX_PREVIEW_BYTES }),
  asyncHandler(uploadPreview)
)
