import { OrderStatus } from '@prisma/client'
import { HttpError } from '../../utils/httpError.js'
import { parseDateRange, VALID_GRANULARITIES } from '../../utils/dateRange.js'
import { getDashboardSummary, getSalesReport, getOrderReport, getProductReport, getCustomerReport } from './reportService.js'

const VALID_STATUSES = Object.values(OrderStatus)

function parseGranularity(value) {
  if (value === undefined) return 'day'
  if (!VALID_GRANULARITIES.includes(value)) {
    throw new HttpError(400, `granularity must be one of: ${VALID_GRANULARITIES.join(', ')}`)
  }
  return value
}

function parseLimit(value, fallback, max) {
  if (value === undefined) return fallback
  const n = Number.parseInt(value, 10)
  if (!Number.isInteger(n) || n < 1 || n > max) throw new HttpError(400, `limit must be a whole number from 1 to ${max}.`)
  return n
}

export async function dashboard(req, res) {
  let range = null
  const { range: rangePreset, from, to } = req.query ?? {}

  if (rangePreset || from || to) {
    if (rangePreset === 'today') {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      range = { from: startOfToday, to: endOfToday }
    } else if (rangePreset === '7d' || rangePreset === '7days') {
      const now = new Date()
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const startOf7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      range = { from: startOf7Days, to: endOfToday }
    } else if (rangePreset === '30d' || rangePreset === '30days') {
      const now = new Date()
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const startOf30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
      range = { from: startOf30Days, to: endOfToday }
    } else {
      range = parseDateRange({ from, to })
    }
  }

  res.json(await getDashboardSummary(range))
}

export async function sales(req, res) {
  const { from, to } = parseDateRange(req.query)
  const granularity = parseGranularity(req.query.granularity)
  res.json(await getSalesReport({ from, to, granularity }))
}

export async function orders(req, res) {
  const { from, to } = parseDateRange(req.query)
  const granularity = parseGranularity(req.query.granularity)
  const { status } = req.query
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`)
  }
  res.json(await getOrderReport({ from, to, status, granularity }))
}

export async function products(req, res) {
  const { from, to } = parseDateRange(req.query)
  const limit = parseLimit(req.query.limit, 10, 50)
  res.json(await getProductReport({ from, to, limit }))
}

export async function customers(req, res) {
  const { from, to } = parseDateRange(req.query)
  const limit = parseLimit(req.query.limit, 10, 50)
  res.json(await getCustomerReport({ from, to, limit }))
}
