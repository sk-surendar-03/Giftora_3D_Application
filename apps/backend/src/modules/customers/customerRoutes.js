import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize } from '../auth/authMiddleware.js'
import { list, getById, updateStatus } from './customerController.js'

export const customerRouter = Router()

// ADMIN only — this module exists purely for admin customer management.
customerRouter.use(authenticate, authorize('ADMIN'))

customerRouter.get('/', asyncHandler(list))
customerRouter.get('/:id', asyncHandler(getById))
customerRouter.patch('/:id/status', asyncHandler(updateStatus))
