import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { submitContactInquiry } from './contactController.js'

export const contactRouter = Router()

contactRouter.post('/', asyncHandler(submitContactInquiry))
