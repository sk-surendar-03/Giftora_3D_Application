import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { list, create, update, remove } from './addressController.js'

export const addressRouter = Router()

// An address always belongs to exactly one account — same reasoning as the
// cart module, no public/unauthenticated mode.
addressRouter.use(authenticate)

addressRouter.get('/', asyncHandler(list))
addressRouter.post('/', asyncHandler(create))
addressRouter.patch('/:id', asyncHandler(update))
addressRouter.delete('/:id', asyncHandler(remove))
