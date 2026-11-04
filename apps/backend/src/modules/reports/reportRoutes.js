import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate, authorize } from '../auth/authMiddleware.js'
import { dashboard, sales, orders, products, customers } from './reportController.js'

export const reportRouter = Router()

// ADMIN only — reports expose aggregate business data across all
// customers/orders, never a single customer's own scoped view.
reportRouter.use(authenticate, authorize('ADMIN'))

reportRouter.get('/dashboard', asyncHandler(dashboard))
reportRouter.get('/sales', asyncHandler(sales))
reportRouter.get('/orders', asyncHandler(orders))
reportRouter.get('/products', asyncHandler(products))
reportRouter.get('/customers', asyncHandler(customers))
