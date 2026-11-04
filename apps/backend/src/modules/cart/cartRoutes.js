import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { getCart, addCartItem, updateCartItem, deleteCartItem } from './cartController.js'

export const cartRouter = Router()

// Every cart route requires a real authenticated user — a cart always
// belongs to exactly one account (schema's Cart.userId is unique), so
// there is no "browse the cart" public mode, by design.
cartRouter.use(authenticate)

cartRouter.get('/', asyncHandler(getCart))
cartRouter.post('/items', asyncHandler(addCartItem))
cartRouter.patch('/items/:itemId', asyncHandler(updateCartItem))
cartRouter.delete('/items/:itemId', asyncHandler(deleteCartItem))
