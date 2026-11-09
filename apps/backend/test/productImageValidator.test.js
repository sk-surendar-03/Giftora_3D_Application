import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseImageFilename,
  validateImageContent,
  MAX_IMAGE_BYTES,
} from '../src/modules/products/productImageValidator.js'
import {
  storeProductImage,
  readProductImage,
  deleteProductImage,
} from '../src/modules/products/productImageService.js'
import {
  uploadImage,
  getImage,
  deleteImage,
} from '../src/modules/products/productController.js'

// Minimal synthetic valid image buffers
const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52])
const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
const validWebp = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x20, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.from('VP8 ', 'ascii'),
])

const rejects = (fn, status = 400) => assert.throws(fn, (e) => e.status === status)

test('filenames: .jpg/.jpeg/.png/.webp accepted case-insensitively, path stripped; others rejected', () => {
  assert.deepEqual(parseImageFilename('photo.JPG'), { filename: 'photo.JPG', format: 'jpeg', ext: '.jpg' })
  assert.deepEqual(parseImageFilename('banner.jpeg'), { filename: 'banner.jpeg', format: 'jpeg', ext: '.jpeg' })
  assert.deepEqual(parseImageFilename('item.PNG'), { filename: 'item.PNG', format: 'png', ext: '.png' })
  assert.deepEqual(parseImageFilename(String.raw`C:\photos\angle 1.WEBP`), { filename: 'angle 1.WEBP', format: 'webp', ext: '.webp' })

  for (const bad of ['photo.gif', 'script.exe', 'model.stl', 'doc.pdf', '', undefined, 'noext']) {
    rejects(() => parseImageFilename(bad))
  }
})

test('valid PNG, JPEG, and WEBP image content passes validation', () => {
  validateImageContent('png', validPng)
  validateImageContent('jpeg', validJpeg)
  validateImageContent('webp', validWebp)
})

test('invalid image content is rejected (empty, truncated, random bytes)', () => {
  rejects(() => validateImageContent('png', Buffer.alloc(0)))
  rejects(() => validateImageContent('jpeg', Buffer.alloc(0)))
  rejects(() => validateImageContent('webp', Buffer.alloc(0)))

  rejects(() => validateImageContent('png', Buffer.from([0x89, 0x50, 0x00]))) // truncated
  rejects(() => validateImageContent('jpeg', Buffer.from([0x00, 0x01, 0x02]))) // wrong header
  rejects(() => validateImageContent('webp', Buffer.from('NOT_A_WEBP_IMAGE_FILE')))
})

test('format mismatch: PNG data with JPEG format (or vice versa) is rejected', () => {
  rejects(() => validateImageContent('jpeg', validPng))
  rejects(() => validateImageContent('png', validJpeg))
  rejects(() => validateImageContent('webp', validJpeg))
})

test('size limit enforced with 413', () => {
  rejects(() => validateImageContent('png', Buffer.alloc(MAX_IMAGE_BYTES + 1)), 413)
})

test('productImageService: store, read, and delete round-trip', async () => {
  const result = await storeProductImage('test-front.png', validPng)
  assert.ok(result.url.startsWith('/api/v1/products/images/'))
  assert.equal(result.format, 'png')
  assert.equal(result.sizeBytes, validPng.length)

  const filename = result.url.split('/').pop()
  const loaded = await readProductImage(filename)
  assert.equal(loaded.mimeType, 'image/png')
  assert.deepEqual(loaded.buffer, validPng)

  await deleteProductImage(filename)
})

test('productController image handlers: upload, get, and delete', async () => {
  let jsonResponse = null
  let statusCode = null
  const res = {
    status(code) {
      statusCode = code
      return this
    },
    json(data) {
      jsonResponse = data
      return this
    },
    set(headers) {
      this.headers = headers
      return this
    },
    send(body) {
      this.body = body
      return this
    },
  }

  // Upload image
  const reqUpload = {
    body: validJpeg,
    query: { filename: 'my-product-angle1.jpg' },
    headers: {},
  }
  await uploadImage(reqUpload, res)
  assert.equal(statusCode, 201)
  assert.ok(jsonResponse.image.url.includes('my-product-angle1.jpg'))

  const filename = jsonResponse.image.url.split('/').pop()

  // Get image
  const reqGet = { params: { filename } }
  await getImage(reqGet, res)
  assert.equal(res.headers['Content-Type'], 'image/jpeg')
  assert.deepEqual(res.body, validJpeg)

  // Delete image
  let ended = false
  const resDel = {
    status(code) {
      statusCode = code
      return this
    },
    end() {
      ended = true
    },
  }
  await deleteImage({ params: { filename } }, resDel)
  assert.equal(statusCode, 204)
  assert.ok(ended)
})
