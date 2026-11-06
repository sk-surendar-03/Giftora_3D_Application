import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import { createUploadRateLimiter } from '../src/modules/customizer/uploadRateLimiter.js'

describe('uploadRateLimiter', () => {
  test('allows requests within rate limit', () => {
    const limiter = createUploadRateLimiter({ windowMs: 1000, max: 3 })
    const req = { user: { id: 'user-1' } }
    const res = { setHeader: () => {} }
    let calls = 0
    const next = () => { calls++ }

    limiter(req, res, next)
    limiter(req, res, next)
    limiter(req, res, next)
    assert.equal(calls, 3)
  })

  test('blocks requests that exceed rate limit and sets Retry-After header', () => {
    const limiter = createUploadRateLimiter({ windowMs: 1000, max: 2 })
    const req = { user: { id: 'user-2' } }
    let headerKey = null
    let headerVal = null
    const res = {
      setHeader: (k, v) => {
        headerKey = k
        headerVal = v
      },
    }
    const next = () => {}

    limiter(req, res, next)
    limiter(req, res, next)
    assert.throws(
      () => limiter(req, res, next),
      (err) => err.status === 429 && err.message.includes('rate limit')
    )
    assert.equal(headerKey, 'Retry-After')
    assert.ok(headerVal >= 1)
  })

  test('different users have independent rate limits', () => {
    const limiter = createUploadRateLimiter({ windowMs: 1000, max: 2 })
    const res = { setHeader: () => {} }
    const next = () => {}

    limiter({ user: { id: 'user-a' } }, res, next)
    limiter({ user: { id: 'user-a' } }, res, next)

    // user-a is now at limit
    assert.throws(() => limiter({ user: { id: 'user-a' } }, res, next))

    // user-b still has full capacity
    assert.doesNotThrow(() => limiter({ user: { id: 'user-b' } }, res, next))
  })
})
