import test, { before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { makeBoxStl, makePng, validDesign } from './helpers.js'

// End-to-end API tests for standalone custom designs. They need a running
// backend on a database you don't mind adding test rows to, so they only run
// when GIFTORA_API_TEST_BASE is set, e.g.:
//   GIFTORA_API_TEST_BASE=http://localhost:4100/api/v1 \
//   GIFTORA_TEST_ADMIN_EMAIL=... GIFTORA_TEST_ADMIN_PASSWORD=... npm test
const BASE = process.env.GIFTORA_API_TEST_BASE
const ADMIN_EMAIL = process.env.GIFTORA_TEST_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.GIFTORA_TEST_ADMIN_PASSWORD
const skip = !BASE || !ADMIN_EMAIL || !ADMIN_PASSWORD ? 'set GIFTORA_API_TEST_BASE and GIFTORA_TEST_ADMIN_EMAIL/PASSWORD to run' : false

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

async function call(method, path, { token, json, body, headers = {} } = {}) {
  const init = { method, headers: { ...headers } }
  if (token) init.headers.Authorization = `Bearer ${token}`
  if (json !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(json)
  } else if (body !== undefined) {
    init.body = body
  }
  const response = await fetch(BASE + path, init)
  const raw = Buffer.from(await response.arrayBuffer())
  let data
  try {
    data = JSON.parse(raw.toString('utf8'))
  } catch {
    data = undefined
  }
  return { status: response.status, headers: response.headers, data, raw }
}

const stamp = Date.now()
const ctx = {}

describe('standalone custom designs — API', { skip }, () => {
  before(async () => {
    for (const who of ['a', 'b']) {
      const email = `e2e-${who}-${stamp}@example.test`
      const reg = await call('POST', '/auth/register', { json: { name: `E2E ${who.toUpperCase()}`, email, password: 'Passw0rd!test' } })
      assert.ok([200, 201].includes(reg.status), `register ${who}: ${reg.status}`)
      const login = await call('POST', '/auth/login', { json: { email, password: 'Passw0rd!test' } })
      assert.equal(login.status, 200)
      ctx[`token${who.toUpperCase()}`] = login.data.token ?? login.data.accessToken
      assert.ok(ctx[`token${who.toUpperCase()}`], 'login returns a token')
    }
    const admin = await call('POST', '/auth/login', { json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
    assert.equal(admin.status, 200, 'admin login')
    ctx.tokenAdmin = admin.data.token ?? admin.data.accessToken

    const address = await call('POST', '/addresses', {
      token: ctx.tokenA,
      json: { fullName: 'E2E Customer', phone: '+91 98765 43210', line1: '14 Test Street', city: 'Pune', state: 'MH', postalCode: '411001', country: 'India', isDefault: true },
    })
    assert.equal(address.status, 201, JSON.stringify(address.data))
    ctx.addressId = address.data.address.id
    ctx.pricing = (await call('GET', '/settings/pricing')).data.pricing
  })

  test('public options are served', async () => {
    const r = await call('GET', '/customizer/options')
    assert.equal(r.status, 200)
    assert.equal(r.data.options.templates.length, 3)
    assert.ok(r.data.options.fonts.length >= 20)
  })

  test('design creation validates on the server and de-duplicates', async () => {
    const bad = await call('POST', '/custom-designs', { token: ctx.tokenA, json: validDesign({ material: 'Unobtainium' }) })
    assert.equal(bad.status, 400)
    const noColour = await call('POST', '/custom-designs', { token: ctx.tokenA, json: validDesign({ color: { hex: '#123456' } }) })
    assert.equal(noColour.status, 400)

    const design = validDesign({ text: `Zed ${String(stamp).slice(-4)}`, subtitle: '' })
    ctx.designInput = design
    const created = await call('POST', '/custom-designs', { token: ctx.tokenA, json: design })
    assert.equal(created.status, 201)
    assert.equal(created.data.design.status, 'PENDING')
    assert.equal(created.data.needsStl, true)
    ctx.designId = created.data.design.id
    const billable = [...design.text].filter((c) => c.trim()).length
    assert.equal(created.data.design.unitPriceCents, billable * ctx.pricing.perCharacterPriceCents, 'price is computed on the server')
    assert.equal(JSON.stringify(created.data).includes('stlKey'), false)

    const again = await call('POST', '/custom-designs', { token: ctx.tokenA, json: { ...design, color: design.color.hex } })
    assert.equal(again.status, 200)
    assert.equal(again.data.design.id, ctx.designId, 'identical design returns the same record')

    const other = await call('POST', '/custom-designs', { token: ctx.tokenB, json: design })
    assert.equal(other.status, 201)
    assert.notEqual(other.data.design.id, ctx.designId, 'another customer gets their own record')
  })

  test('unauthenticated access is rejected', async () => {
    for (const [method, path] of [['POST', '/custom-designs'], ['PUT', `/custom-designs/${ctx.designId}/stl`], ['GET', `/custom-designs/${ctx.designId}`], ['GET', `/custom-designs/${ctx.designId}/preview`], ['POST', '/cart/custom-items']]) {
      const r = await call(method, path, { headers: { 'Content-Type': 'application/octet-stream' }, body: method === 'PUT' ? Buffer.from('x') : undefined })
      assert.equal(r.status, 401, `${method} ${path}`)
    }
  })

  test('STL upload: validation, checksum, ownership, idempotency and immutability', async () => {
    const put = (token, body, headers = {}, id = ctx.designId) => call('PUT', `/custom-designs/${id}/stl`, { token, body, headers: { 'Content-Type': 'application/octet-stream', ...headers } })
    const stl = makeBoxStl({ x: 42, y: 13, z: 3 })
    ctx.stl = stl

    assert.equal((await call('PUT', `/custom-designs/${ctx.designId}/stl`, { token: ctx.tokenA, json: { not: 'binary' } })).status, 415)
    assert.equal((await put(ctx.tokenA, Buffer.from('garbage-not-an-stl'.repeat(10)))).status, 400)
    assert.equal((await put(ctx.tokenA, Buffer.from('solid x\n'.repeat(30) + 'endsolid x'))).status, 400)
    assert.equal((await put(ctx.tokenA, stl.subarray(0, stl.length - 5))).status, 400)
    assert.equal((await put(ctx.tokenA, stl, { 'X-Content-SHA256': 'f'.repeat(64) })).status, 400, 'wrong checksum')
    assert.equal((await put(ctx.tokenA, stl, { 'X-Content-SHA256': 'not-a-hash' })).status, 400)
    assert.equal((await put(ctx.tokenB, stl)).status, 404, "another customer cannot upload to someone else's design")

    const ok = await put(ctx.tokenA, stl, { 'X-Content-SHA256': sha256(stl) })
    assert.equal(ok.status, 200, JSON.stringify(ok.data))
    assert.equal(ok.data.design.status, 'READY')
    assert.equal(ok.data.design.hasStl, true)
    assert.equal(JSON.stringify(ok.data).includes('stlSha256'), false, 'customer view hides file internals')

    assert.equal((await put(ctx.tokenA, stl)).status, 200, 'same file again is idempotent')
    assert.equal((await put(ctx.tokenA, makeBoxStl({ x: 50 }))).status, 409, 'a READY design is immutable')
  })

  test('preview upload and access control', async () => {
    const png = makePng(640, 480, 2000)
    const put = (token, body, type = 'image/png') => call('PUT', `/custom-designs/${ctx.designId}/preview`, { token, body, headers: { 'Content-Type': type } })
    assert.equal((await put(ctx.tokenA, Buffer.from('not a png at all, just text'.repeat(3)))).status, 400)
    assert.equal((await put(ctx.tokenB, png)).status, 404)
    assert.equal((await put(ctx.tokenA, png)).status, 200)
    ctx.png = png

    const got = await call('GET', `/custom-designs/${ctx.designId}/preview`, { token: ctx.tokenA })
    assert.equal(got.status, 200)
    assert.equal(got.headers.get('content-type'), 'image/png')
    assert.ok(got.raw.equals(png))
    assert.equal((await call('GET', `/custom-designs/${ctx.designId}/preview`, { token: ctx.tokenB })).status, 404)
    assert.equal((await call('GET', `/custom-designs/${ctx.designId}`, { token: ctx.tokenB })).status, 404)
  })

  test('cart: only the owner can add a READY design; price is server-side; catalog items still work', async () => {
    const pending = await call('POST', '/custom-designs', { token: ctx.tokenA, json: validDesign({ text: `Pend ${String(stamp).slice(-3)}` }) })
    const notReady = await call('POST', '/cart/custom-items', { token: ctx.tokenA, json: { customDesignId: pending.data.design.id } })
    assert.equal(notReady.status, 409, 'a design without an STL cannot be carted')

    assert.equal((await call('POST', '/cart/custom-items', { token: ctx.tokenB, json: { customDesignId: ctx.designId } })).status, 404)
    assert.equal((await call('POST', '/cart/custom-items', { token: ctx.tokenA, json: {} })).status, 400)
    assert.equal((await call('POST', '/cart/custom-items', { token: ctx.tokenA, json: { customDesignId: ctx.designId, quantity: 11 } })).status, 400)
    assert.equal((await call('POST', '/cart/custom-items', { token: ctx.tokenA, json: { customDesignId: 'nope' } })).status, 404)

    const added = await call('POST', '/cart/custom-items', { token: ctx.tokenA, json: { customDesignId: ctx.designId, quantity: 2, unitPriceCents: 1, price: 1 } })
    assert.equal(added.status, 201, JSON.stringify(added.data))
    const line = added.data.cart.items.find((i) => i.itemType === 'CUSTOM_DESIGN')
    assert.ok(line)
    assert.equal(line.productId, null)
    assert.equal(line.product, null)
    assert.equal(line.design.params.text, ctx.designInput.text)
    const billable = [...ctx.designInput.text].filter((c) => c.trim()).length
    assert.equal(line.unitPriceCents, billable * ctx.pricing.perCharacterPriceCents, 'client-sent price is ignored')
    ctx.lineId = line.id

    const again = await call('POST', '/cart/custom-items', { token: ctx.tokenA, json: { customDesignId: ctx.designId, quantity: 1 } })
    assert.equal(again.data.cart.items.filter((i) => i.itemType === 'CUSTOM_DESIGN').length, 1, 'same design merges into one line')
    assert.equal(again.data.cart.items.find((i) => i.itemType === 'CUSTOM_DESIGN').quantity, 3)

    // Regression: a catalog product still goes through the original endpoint.
    const products = (await call('GET', '/products?pageSize=100')).data.products
    const product = products.find((p) => p.isActive && p.slug !== 'test')
    const catalog = await call('POST', '/cart/items', { token: ctx.tokenA, json: { productId: product.id, quantity: 1, customization: { text: 'Cat', font: 'Bungee' } } })
    assert.equal(catalog.status, 201)
    const catalogLine = catalog.data.cart.items.find((i) => i.itemType === 'PRODUCT')
    assert.equal(catalogLine.product.id, product.id)
    assert.equal(catalogLine.design, null)
    ctx.productName = product.name
  })

  test('checkout review handles both kinds of line', async () => {
    const review = await call('POST', '/checkout/review', { token: ctx.tokenA, json: { addressId: ctx.addressId } })
    assert.equal(review.status, 200, JSON.stringify(review.data))
    assert.equal(review.data.items.length, 2)
    assert.equal(review.data.canConfirm, true)
    const custom = review.data.items.find((i) => i.itemType === 'CUSTOM_DESIGN')
    assert.equal(custom.available, true)
    assert.equal(custom.product, null)
    assert.equal(custom.title, ctx.designInput.text ? `Name keychain "${ctx.designInput.text}"` : '')
    assert.equal(review.data.subtotalCents, review.data.items.reduce((sum, i) => sum + i.lineTotalCents, 0))
  })

  test('placing the order snapshots both kinds of line and clears the cart (idempotent)', async () => {
    const key = `e2e-order-${stamp}`
    const placed = await call('POST', '/orders', { token: ctx.tokenA, json: { addressId: ctx.addressId, idempotencyKey: key } })
    assert.equal(placed.status, 201, JSON.stringify(placed.data))
    const order = placed.data.order
    ctx.orderId = order.id
    ctx.orderNumber = order.orderNumber
    const custom = order.items.find((i) => i.itemType === 'CUSTOM_DESIGN')
    const catalog = order.items.find((i) => i.itemType === 'PRODUCT')
    assert.equal(custom.productId, null)
    assert.equal(custom.productSlug, null)
    assert.equal(custom.quantity, 3)
    assert.equal(custom.customization.text, ctx.designInput.text)
    assert.equal(custom.design.id, ctx.designId)
    assert.equal(catalog.productName, ctx.productName)
    assert.ok(catalog.productId)
    ctx.itemId = custom.id
    ctx.catalogItemId = catalog.id

    const text = JSON.stringify(placed.data)
    assert.equal(/stlKey|stlSha256|previewKey|storage/.test(text), false, 'no storage internals in customer responses')

    const cart = await call('GET', '/cart', { token: ctx.tokenA })
    assert.equal(cart.data.cart.items.length, 0, 'cart is cleared')

    const retry = await call('POST', '/orders', { token: ctx.tokenA, json: { addressId: ctx.addressId, idempotencyKey: key } })
    assert.equal(retry.data.order.id, order.id, 'a retried request returns the same order')

    const list = await call('GET', '/orders', { token: ctx.tokenA })
    assert.ok(list.data.orders.some((o) => o.id === order.id && o.items.some((i) => i.design?.params?.text === ctx.designInput.text)))
    assert.equal((await call('GET', `/orders/${order.id}`, { token: ctx.tokenB })).status, 404, "customers cannot read each other's orders")
  })

  test('an ordered design can no longer be changed', async () => {
    const preview = await call('PUT', `/custom-designs/${ctx.designId}/preview`, { token: ctx.tokenA, body: makePng(320, 240), headers: { 'Content-Type': 'image/png' } })
    assert.equal(preview.status, 409)
    const stl = await call('PUT', `/custom-designs/${ctx.designId}/stl`, { token: ctx.tokenA, body: makeBoxStl({ x: 99 }), headers: { 'Content-Type': 'application/octet-stream' } })
    assert.equal(stl.status, 409)
  })

  test('admin: orders list shows the custom order with type, filter and search', async () => {
    const list = await call('GET', '/admin/orders?pageSize=50', { token: ctx.tokenAdmin })
    assert.equal(list.status, 200)
    const found = list.data.orders.find((o) => o.id === ctx.orderId)
    assert.ok(found)
    assert.deepEqual(found.items.map((i) => i.itemType).sort(), ['CUSTOM_DESIGN', 'PRODUCT'])
    assert.equal(found.user.email.startsWith('e2e-a-'), true)

    const custom = await call('GET', '/admin/orders?type=CUSTOM_DESIGN&pageSize=100', { token: ctx.tokenAdmin })
    assert.ok(custom.data.orders.some((o) => o.id === ctx.orderId))
    assert.ok(custom.data.orders.every((o) => o.items.some((i) => i.itemType === 'CUSTOM_DESIGN')))
    const catalogOnly = await call('GET', '/admin/orders?type=PRODUCT&pageSize=100', { token: ctx.tokenAdmin })
    assert.ok(catalogOnly.data.orders.every((o) => o.items.some((i) => i.itemType === 'PRODUCT')))
    assert.equal((await call('GET', '/admin/orders?type=BOGUS', { token: ctx.tokenAdmin })).status, 400)

    const search = await call('GET', `/admin/orders?search=${encodeURIComponent(ctx.designInput.text)}`, { token: ctx.tokenAdmin })
    assert.ok(search.data.orders.some((o) => o.id === ctx.orderId), 'search finds the order by the design text')
    assert.equal((await call('GET', '/admin/orders', { token: ctx.tokenA })).status, 403)
  })

  test('admin: order detail exposes the full design record and STL metadata', async () => {
    const detail = await call('GET', `/admin/orders/${ctx.orderId}`, { token: ctx.tokenAdmin })
    assert.equal(detail.status, 200)
    const item = detail.data.order.items.find((i) => i.itemType === 'CUSTOM_DESIGN')
    assert.equal(item.design.params.templateId, 'name-keychain')
    assert.equal(item.design.engineParams.textSizeMm, 18)
    assert.equal(item.design.stl.sha256, sha256(ctx.stl))
    assert.equal(item.design.stl.sizeBytes, ctx.stl.length)
    assert.equal(item.design.stl.triangleCount, 12)
    assert.deepEqual(item.design.stl.bboxMm.size, [42, 13, 3])
    assert.equal(item.design.hasPreview, true)
    assert.equal(JSON.stringify(detail.data).includes('stlKey'), false, 'storage keys are never exposed, even to admins')
    assert.equal(detail.data.order.shippingAddress.phone, '+91 98765 43210')
    assert.equal(detail.data.order.user.name, 'E2E A')
  })

  test('admin: Download STL returns exactly the stored file, only through its own order', async () => {
    const url = `/admin/orders/${ctx.orderId}/items/${ctx.itemId}/stl`
    const r = await call('GET', url, { token: ctx.tokenAdmin })
    assert.equal(r.status, 200)
    assert.equal(r.headers.get('content-type'), 'model/stl')
    assert.match(r.headers.get('content-disposition'), new RegExp(`^attachment; filename="${ctx.orderNumber}_[a-z0-9-]+_[a-z0-9]+\\.stl"$`))
    assert.equal(r.headers.get('cache-control'), 'private, no-store')
    assert.ok(r.raw.equals(ctx.stl), 'byte-for-byte identical to the uploaded STL')
    assert.equal(sha256(r.raw), sha256(ctx.stl))

    assert.equal((await call('GET', url, { token: ctx.tokenA })).status, 403, 'customers cannot use the admin download')
    assert.equal((await call('GET', url)).status, 401)
    assert.equal((await call('GET', `/admin/orders/not-this-order/items/${ctx.itemId}/stl`, { token: ctx.tokenAdmin })).status, 404, "the item must belong to the order in the URL")
    assert.equal((await call('GET', `/admin/orders/${ctx.orderId}/items/${ctx.catalogItemId}/stl`, { token: ctx.tokenAdmin })).status, 404, 'catalog lines have no STL')
    assert.equal((await call('GET', `/admin/orders/${ctx.orderId}/items/nope/stl`, { token: ctx.tokenAdmin })).status, 404)

    const preview = await call('GET', `/admin/orders/${ctx.orderId}/items/${ctx.itemId}/preview`, { token: ctx.tokenAdmin })
    assert.equal(preview.status, 200)
    assert.ok(preview.raw.equals(ctx.png))
    assert.equal((await call('GET', `/admin/orders/${ctx.orderId}/items/${ctx.itemId}/preview`, { token: ctx.tokenA })).status, 403)
  })

  test('reports: custom designs are one bucket and never need a product id', async () => {
    const before = await call('GET', '/admin/reports/products', { token: ctx.tokenAdmin })
    assert.equal(before.status, 200)
    assert.equal(before.data.bestSellingByQuantity.some((p) => p.isCustomDesign && p.productId === null), false, 'PENDING orders are not revenue')

    for (const status of ['PAID']) {
      const patched = await call('PATCH', `/admin/orders/${ctx.orderId}/status`, { token: ctx.tokenAdmin, json: { status } })
      assert.equal(patched.status, 200)
      assert.ok(patched.data.order.items.find((i) => i.itemType === 'CUSTOM_DESIGN').design.stl.sha256, 'status update keeps the design record')
    }
    const after = await call('GET', '/admin/reports/products', { token: ctx.tokenAdmin })
    assert.equal(after.status, 200)
    const row = after.data.bestSellingByQuantity.find((p) => p.isCustomDesign)
    assert.ok(row, 'a "Custom 3D designs" row appears')
    assert.equal(row.productName, 'Custom 3D designs')
    assert.equal(row.productId, null)
    assert.ok(row.quantitySold >= 3 && row.revenueCents > 0)
    assert.equal((await call('GET', '/admin/reports/dashboard', { token: ctx.tokenAdmin })).status, 200)
    assert.equal((await call('GET', '/admin/reports/sales', { token: ctx.tokenAdmin })).status, 200)
  })

  test('regression: a catalog-only order is unaffected', async () => {
    const products = (await call('GET', '/products?pageSize=100')).data.products
    const product = products.find((p) => p.isActive && p.slug !== 'test')
    assert.equal((await call('POST', '/cart/items', { token: ctx.tokenB, json: { productId: product.id, quantity: 2, customization: { text: 'Plain' } } })).status, 201)
    const address = await call('POST', '/addresses', { token: ctx.tokenB, json: { fullName: 'E2E B', phone: '+91 98765 43211', line1: '1 B Street', city: 'Pune', state: 'MH', postalCode: '411002', country: 'India' } })
    const placed = await call('POST', '/orders', { token: ctx.tokenB, json: { addressId: address.data.address.id } })
    assert.equal(placed.status, 201)
    assert.equal(placed.data.order.items.length, 1)
    assert.equal(placed.data.order.items[0].itemType, 'PRODUCT')
    assert.equal(placed.data.order.items[0].productId, product.id)
    assert.equal(placed.data.order.items[0].productSlug, product.slug)
    assert.equal(placed.data.order.items[0].design, null)
  })
})
