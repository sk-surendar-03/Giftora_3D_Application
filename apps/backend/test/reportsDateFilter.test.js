import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDateRange } from '../src/utils/dateRange.js'

test('parseDateRange: supports allTime option', () => {
  const result = parseDateRange({ allTime: true })
  assert.equal(result.isAllTime, true)
  assert.equal(result.from.getTime(), 0)
  assert.equal(result.to.getUTCFullYear(), 2099)
})

test('parseDateRange: supports string allTime="true"', () => {
  const result = parseDateRange({ allTime: 'true' })
  assert.equal(result.isAllTime, true)
  assert.equal(result.from.getTime(), 0)
})

test('parseDateRange: standard valid range with inclusive end date', () => {
  const result = parseDateRange({ from: '2026-11-01', to: '2026-11-09' })
  assert.equal(result.from.toISOString().slice(0, 10), '2026-11-01')
  // Bare date "2026-11-09" becomes inclusive by advancing 1 day to midnight 2026-11-10
  assert.equal(result.to.toISOString().slice(0, 10), '2026-11-10')
})

test('parseDateRange: throws when from is after to', () => {
  assert.throws(
    () => parseDateRange({ from: '2026-11-15', to: '2026-11-10' }),
    (err) => err.status === 400 && err.message.includes('from must not be after to')
  )
})

test('parseDateRange: default range when parameters omitted is 30 days', () => {
  const result = parseDateRange({})
  const diffDays = Math.round((result.to.getTime() - result.from.getTime()) / (24 * 60 * 60 * 1000))
  assert.equal(diffDays, 30)
})
