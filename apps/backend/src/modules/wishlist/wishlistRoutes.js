import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { getWishlist, addWishlistItem, removeWishlistItem } from './wishlistController.js'

export const wishlistRouter = Router()

wishlistRouter.use(authenticate)

wishlistRouter.get('/', asyncHandler(getWishlist))
wishlistRouter.post('/', asyncHandler(addWishlistItem))
wishlistRouter.delete('/:productId', asyncHandler(removeWishlistItem))
