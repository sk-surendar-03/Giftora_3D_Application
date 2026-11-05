import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize, optionalAuthenticate } from '../auth/authMiddleware.js'
import { list, getBySlug, create, update, remove } from './productController.js'

export const productRouter = Router()

// Public browsing — optionalAuthenticate lets an authenticated ADMIN also
// see inactive products (e.g. for a storefront preview), without requiring
// login for ordinary customer browsing.
productRouter.get('/', optionalAuthenticate, asyncHandler(list))
productRouter.get('/:slug', optionalAuthenticate, asyncHandler(getBySlug))

productRouter.post('/', authenticate, authorize('ADMIN'), asyncHandler(create))
productRouter.patch('/:id', authenticate, authorize('ADMIN'), asyncHandler(update))
productRouter.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(remove))
