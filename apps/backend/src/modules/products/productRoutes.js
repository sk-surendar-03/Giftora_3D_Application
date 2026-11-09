import express, { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize, optionalAuthenticate } from '../auth/authMiddleware.js'
import {
  list,
  getBySlug,
  create,
  update,
  remove,
  uploadModel,
  deleteModel,
  getModel,
  uploadImage,
  getImage,
  deleteImage,
} from './productController.js'
import { createUploadRateLimiter } from '../customizer/uploadRateLimiter.js'
import { ALLOWED_MODEL_MIME_TYPES, MAX_MODEL_BYTES } from './productModelValidator.js'
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from './productImageValidator.js'

const modelUploadLimiter = createUploadRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many model uploads. Please wait a minute before uploading again.',
})

const imageUploadLimiter = createUploadRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many image uploads. Please wait a minute before uploading again.',
})

export const productRouter = Router()

// Public browsing — optionalAuthenticate lets an authenticated ADMIN also
// see inactive products (e.g. for a storefront preview), without requiring
// login for ordinary customer browsing.
productRouter.get('/', optionalAuthenticate, asyncHandler(list))

// Public image asset serving — must be declared BEFORE /:slug to avoid route shadowing
productRouter.get('/images/:filename', asyncHandler(getImage))

productRouter.get('/:slug', optionalAuthenticate, asyncHandler(getBySlug))
productRouter.get('/:slug/model', optionalAuthenticate, asyncHandler(getModel))

productRouter.post('/', authenticate, authorize('ADMIN'), asyncHandler(create))
productRouter.patch('/:id', authenticate, authorize('ADMIN'), asyncHandler(update))
productRouter.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(remove))

// Image upload and deletion (Admin only)
productRouter.post(
  '/images',
  authenticate,
  authorize('ADMIN'),
  imageUploadLimiter,
  express.raw({ type: ALLOWED_IMAGE_MIME_TYPES, limit: MAX_IMAGE_BYTES }),
  asyncHandler(uploadImage)
)
productRouter.delete('/images/:filename', authenticate, authorize('ADMIN'), asyncHandler(deleteImage))

// Admin-only 3D model upload/delete. authenticate/authorize run BEFORE the body parser, so a
// non-admin upload is rejected without being buffered.
productRouter.put(
  '/:id/model',
  authenticate,
  authorize('ADMIN'),
  modelUploadLimiter,
  express.raw({ type: ALLOWED_MODEL_MIME_TYPES, limit: MAX_MODEL_BYTES }),
  asyncHandler(uploadModel)
)
productRouter.delete('/:id/model', authenticate, authorize('ADMIN'), asyncHandler(deleteModel))
