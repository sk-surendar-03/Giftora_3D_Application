import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize } from '../auth/authMiddleware.js'
import { list, getById, updateStatus } from './adminOrderController.js'

export const adminOrderRouter = Router()

// Every route here can see and change ANY customer's order — ADMIN only,
// no exceptions, no "owner or admin" fallback like the customer-facing
// order routes have.
adminOrderRouter.use(authenticate, authorize('ADMIN'))

adminOrderRouter.get('/', asyncHandler(list))
adminOrderRouter.get('/:id', asyncHandler(getById))
adminOrderRouter.patch('/:id/status', asyncHandler(updateStatus))
