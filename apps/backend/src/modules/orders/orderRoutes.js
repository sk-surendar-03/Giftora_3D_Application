import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { authenticate } from '../auth/authMiddleware.js'
import { create, list, getById } from './orderController.js'

export const orderRouter = Router()

orderRouter.use(authenticate)

orderRouter.post('/', asyncHandler(create))
orderRouter.get('/', asyncHandler(list))
orderRouter.get('/:id', asyncHandler(getById))
