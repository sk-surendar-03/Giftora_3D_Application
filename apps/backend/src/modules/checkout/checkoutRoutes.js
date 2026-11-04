import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { review } from './checkoutController.js'

export const checkoutRouter = Router()

checkoutRouter.use(authenticate)

// A read-only revalidation of the cart/address/prices — never writes
// anything. No order is created here (that's Phase 9); this exists purely
// so the checkout page (and, later, the real "place order" action right
// before it) can trust a server-computed total instead of the client's.
checkoutRouter.post('/review', asyncHandler(review))
