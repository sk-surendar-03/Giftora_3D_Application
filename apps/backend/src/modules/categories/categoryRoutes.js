import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize } from '../auth/authMiddleware.js'
import { list, create, update, remove } from './categoryController.js'

export const categoryRouter = Router()

categoryRouter.get('/', asyncHandler(list))
categoryRouter.post('/', authenticate, authorize('ADMIN'), asyncHandler(create))
categoryRouter.patch('/:id', authenticate, authorize('ADMIN'), asyncHandler(update))
categoryRouter.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(remove))
