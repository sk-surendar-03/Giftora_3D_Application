import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { getCart, addCartItem, addCustomCartItem, addStandCartItem, addNameplateCartItem, addQrStandCartItem, addPhotoLampCartItem, updateCartItem, deleteCartItem } from './cartController.js'

export const cartRouter = Router()

// Every cart route requires a real authenticated user — a cart always
// belongs to exactly one account (schema's Cart.userId is unique), so
// there is no "browse the cart" public mode, by design.
cartRouter.use(authenticate)

cartRouter.get('/', asyncHandler(getCart))
cartRouter.post('/items', asyncHandler(addCartItem))
cartRouter.post('/custom-items', asyncHandler(addCustomCartItem))
cartRouter.post('/stand-items', asyncHandler(addStandCartItem))
cartRouter.post('/nameplate-items', asyncHandler(addNameplateCartItem))
cartRouter.post('/qr-stand', asyncHandler(addQrStandCartItem))
cartRouter.post('/qr-stand-items', asyncHandler(addQrStandCartItem))
cartRouter.post('/photo-lamp', asyncHandler(addPhotoLampCartItem))
cartRouter.post('/photo-lamp-items', asyncHandler(addPhotoLampCartItem))
cartRouter.patch('/items/:itemId', asyncHandler(updateCartItem))
cartRouter.delete('/items/:itemId', asyncHandler(deleteCartItem))
