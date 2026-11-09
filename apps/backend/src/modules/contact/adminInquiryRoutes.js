import { Router } from 'express'
import { authenticate, authorize } from '../auth/authMiddleware.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  listAdminInquiries,
  getNewInquiryCount,
  getAdminInquiry,
  updateAdminInquiryStatus,
} from './contactController.js'

export const adminInquiryRouter = Router()

adminInquiryRouter.use(authenticate, authorize('ADMIN'))

adminInquiryRouter.get('/', asyncHandler(listAdminInquiries))
adminInquiryRouter.get('/count', asyncHandler(getNewInquiryCount))
adminInquiryRouter.get('/:id', asyncHandler(getAdminInquiry))
adminInquiryRouter.patch('/:id', asyncHandler(updateAdminInquiryStatus))
