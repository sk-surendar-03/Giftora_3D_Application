import { HttpError } from './httpError.js'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_RANGE_DAYS = 30
const MAX_RANGE_DAYS = 366

/**
 * Parses/validates `from`/`to` query params (ISO date or datetime strings).
 * Defaults to the last 30 days when omitted, so reports aren't empty by
 * default without the caller having to know that. `to` is treated as
 * inclusive of its whole day.
 */
export function parseDateRange({ from, to }) {
  const now = new Date()
  let toDate = to ? new Date(to) : now
  let fromDate = from ? new Date(from) : new Date(toDate.getTime() - DEFAULT_RANGE_DAYS * DAY_MS)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new HttpError(400, 'from/to must be valid dates (e.g. 2026-01-01).')
  }
  if (fromDate > toDate) {
    throw new HttpError(400, 'from must not be after to.')
  }
  if (toDate.getTime() - fromDate.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    throw new HttpError(400, `Date range cannot exceed ${MAX_RANGE_DAYS} days.`)
  }

  // Make `to` inclusive of its whole day when given as a bare date
  // (e.g. "2026-11-04" would otherwise mean midnight at the start of it).
  const toExclusive = new Date(toDate.getTime())
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    toExclusive.setDate(toExclusive.getDate() + 1)
  }

  return { from: fromDate, to: toExclusive }
}

const BUCKET_KEY_LENGTH = { day: 10, week: 10, month: 7 }

function bucketKey(date, granularity) {
  if (granularity === 'week') {
    // ISO week start (Monday) of the given date, as its own date key.
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const day = (d.getUTCDay() + 6) % 7 // 0 = Monday
    d.setUTCDate(d.getUTCDate() - day)
    return d.toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, BUCKET_KEY_LENGTH[granularity] ?? 10)
}

/**
 * Buckets a list of `{ createdAt, ... }` rows by day/week/month and reduces
 * each bucket with `reduce(accumulator, row)`. Returns buckets sorted
 * chronologically, including the key so empty buckets can be told apart
 * from missing ones if the caller wants to fill gaps later.
 */
export function bucketByDate(rows, granularity, reduce, initial) {
  const buckets = new Map()
  for (const row of rows) {
    const key = bucketKey(new Date(row.createdAt), granularity)
    const current = buckets.has(key) ? buckets.get(key) : typeof initial === 'function' ? initial() : initial
    buckets.set(key, reduce(current, row))
  }
  return [...buckets.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([date, value]) => ({ date, ...value }))
}

export const VALID_GRANULARITIES = ['day', 'week', 'month']
