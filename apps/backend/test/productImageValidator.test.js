import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
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
import { getStorage } from '../src/modules/storage/storage.js'

// Minimal synthetic image buffers whose headers pass signature validation but
// whose contents sharp cannot decode (used to exercise conversion failures).
const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52])
const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
const validWebp = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x20, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.from('VP8 ', 'ascii'),
])

const rejects = (fn, status = 400) => assert.throws(fn, (e) => e.status === status)
const missingSharp = async () => {
  throw new Error("Cannot find package 'sharp'")
}

async function createImage(format, { width = 640, height = 480 } = {}) {
  const pipeline = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 90, b: 60 },
    },
  })
  if (format === 'jpeg') return pipeline.jpeg({ quality: 90 }).toBuffer()
  if (format === 'png') return pipeline.png().toBuffer()
  if (format === 'webp') return pipeline.webp({ quality: 90 }).toBuffer()
  throw new Error(`Unsupported test format: ${format}`)
}

function storageFilename(result) {
  return result.url.split('/').pop()
}

function createMockResponse() {
  return {
    statusCode: null,
    jsonResponse: null,
    ended: false,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.jsonResponse = data
      return this
    },
    set(headers) {
      this.headers = { ...this.headers, ...headers }
      return this
    },
    send(body) {
      this.body = body
      return this
    },
    end() {
      this.ended = true
      return this
    },
  }
}

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

test('storeProductImage converts JPEG to WebP and resizes to a maximum width of 1200px', async () => {
  const jpeg = await createImage('jpeg', { width: 1600, height: 900 })
  const result = await storeProductImage('camera-shot.jpg', jpeg)
  const filename = storageFilename(result)

  try {
    assert.equal(result.filename, 'camera-shot.jpg')
    assert.equal(result.format, 'webp')
    assert.match(filename, /\.webp$/)
    assert.equal(result.sizeBytes, (await readProductImage(filename)).buffer.length)

    const loaded = await readProductImage(filename)
    assert.equal(loaded.mimeType, 'image/webp')
    assert.equal(loaded.buffer.subarray(0, 4).toString('ascii'), 'RIFF')
    assert.equal(loaded.buffer.subarray(8, 12).toString('ascii'), 'WEBP')
    assert.notDeepEqual(loaded.buffer, jpeg)

    const metadata = await sharp(loaded.buffer).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.width, 1200)
  } finally {
    await deleteProductImage(filename)
  }
})

test('storeProductImage converts PNG to WebP', async () => {
  const png = await createImage('png')
  const result = await storeProductImage('gift-box.png', png)
  const filename = storageFilename(result)

  try {
    assert.equal(result.filename, 'gift-box.png')
    assert.equal(result.format, 'webp')
    assert.match(filename, /\.webp$/)

    const loaded = await readProductImage(filename)
    assert.equal(loaded.mimeType, 'image/webp')
    assert.equal(loaded.buffer.subarray(8, 12).toString('ascii'), 'WEBP')
    assert.notDeepEqual(loaded.buffer, png)

    const metadata = await sharp(loaded.buffer).metadata()
    assert.equal(metadata.format, 'webp')
  } finally {
    await deleteProductImage(filename)
  }
})

test('storeProductImage keeps an existing WebP input unchanged', async () => {
  const webp = await createImage('webp')
  const result = await storeProductImage('already-webp.webp', webp)
  const filename = storageFilename(result)

  try {
    assert.equal(result.format, 'webp')
    assert.equal(result.sizeBytes, webp.length)
    assert.match(filename, /\.webp$/)

    const loaded = await readProductImage(filename)
    assert.equal(loaded.mimeType, 'image/webp')
    assert.deepEqual(loaded.buffer, webp)
  } finally {
    await deleteProductImage(filename)
  }
})

test('storeProductImage falls back to original JPEG bytes when sharp is missing', async () => {
  const jpeg = await createImage('jpeg')
  const result = await storeProductImage('no-sharp.jpg', jpeg, { sharpLoader: missingSharp })
  const filename = storageFilename(result)

  try {
    assert.equal(result.format, 'jpeg')
    assert.match(filename, /\.jpg$/)
    assert.doesNotMatch(filename, /\.webp$/)
    assert.equal(result.sizeBytes, jpeg.length)

    const loaded = await readProductImage(filename)
    assert.equal(loaded.mimeType, 'image/jpeg')
    assert.deepEqual(loaded.buffer, jpeg)
  } finally {
    await deleteProductImage(filename)
  }
})

test('storeProductImage falls back to the original format and bytes when conversion fails', async () => {
  const pngResult = await storeProductImage('broken-image.png', validPng)
  const pngFilename = storageFilename(pngResult)

  try {
    assert.equal(pngResult.format, 'png')
    assert.match(pngFilename, /\.png$/)
    assert.doesNotMatch(pngFilename, /\.webp$/)
    assert.equal(pngResult.sizeBytes, validPng.length)

    const loadedPng = await readProductImage(pngFilename)
    assert.equal(loadedPng.mimeType, 'image/png')
    assert.deepEqual(loadedPng.buffer, validPng)
  } finally {
    await deleteProductImage(pngFilename)
  }

  const jpegResult = await storeProductImage('broken-image.jpg', validJpeg)
  const jpegFilename = storageFilename(jpegResult)

  try {
    assert.equal(jpegResult.format, 'jpeg')
    assert.match(jpegFilename, /\.jpg$/)
    assert.doesNotMatch(jpegFilename, /\.webp$/)
    assert.equal(jpegResult.sizeBytes, validJpeg.length)

    const loadedJpeg = await readProductImage(jpegFilename)
    assert.equal(loadedJpeg.mimeType, 'image/jpeg')
    assert.deepEqual(loadedJpeg.buffer, validJpeg)
  } finally {
    await deleteProductImage(jpegFilename)
  }
})

test('readProductImage derives the MIME type from stored bytes for legacy mismatched extensions', async () => {
  const key = 'product-images/legacy-mismatch-test.webp'
  const jpeg = await createImage('jpeg')
  await getStorage().put(key, jpeg, { immutable: true })

  try {
    const loaded = await readProductImage('legacy-mismatch-test.webp')
    assert.equal(loaded.mimeType, 'image/jpeg')
    assert.deepEqual(loaded.buffer, jpeg)
  } finally {
    await deleteProductImage('legacy-mismatch-test.webp')
  }
})

test('productImageService: stored fallback image can be read and deleted', async () => {
  const result = await storeProductImage('test-front.png', validPng)
  assert.ok(result.url.startsWith('/api/v1/products/images/'))
  assert.equal(result.format, 'png')

  const filename = storageFilename(result)
  const loaded = await readProductImage(filename)
  assert.equal(loaded.mimeType, 'image/png')
  assert.deepEqual(loaded.buffer, validPng)

  await deleteProductImage(filename)
  await assert.rejects(() => readProductImage(filename), (e) => e.status === 404)
})

test('productController image handlers: upload, retrieval, and deletion for converted images', async () => {
  const png = await createImage('png')
  const uploadRes = createMockResponse()

  await uploadImage({ body: png, query: { filename: 'product-main.png' }, headers: {} }, uploadRes)
  assert.equal(uploadRes.statusCode, 201)
  assert.equal(uploadRes.jsonResponse.image.format, 'webp')
  assert.match(uploadRes.jsonResponse.image.url, /\.webp$/)

  const filename = storageFilename(uploadRes.jsonResponse.image)

  const getRes = createMockResponse()
  await getImage({ params: { filename } }, getRes)
  assert.equal(getRes.headers['Content-Type'], 'image/webp')
  assert.equal(getRes.body.subarray(8, 12).toString('ascii'), 'WEBP')
  assert.deepEqual(getRes.body, (await readProductImage(filename)).buffer)

  const deleteRes = createMockResponse()
  await deleteImage({ params: { filename } }, deleteRes)
  assert.equal(deleteRes.statusCode, 204)
  assert.ok(deleteRes.ended)
  await assert.rejects(() => readProductImage(filename), (e) => e.status === 404)
})

test('productController image handlers: upload, retrieval, and deletion for fallback images', async () => {
  const uploadRes = createMockResponse()

  await uploadImage({ body: validJpeg, query: { filename: 'my-product-angle1.jpg' }, headers: {} }, uploadRes)
  assert.equal(uploadRes.statusCode, 201)
  assert.equal(uploadRes.jsonResponse.image.format, 'jpeg')
  assert.ok(uploadRes.jsonResponse.image.url.includes('my-product-angle1.jpg'))
  assert.match(uploadRes.jsonResponse.image.url, /\.jpg$/)

  const filename = storageFilename(uploadRes.jsonResponse.image)

  const getRes = createMockResponse()
  await getImage({ params: { filename } }, getRes)
  assert.equal(getRes.headers['Content-Type'], 'image/jpeg')
  assert.deepEqual(getRes.body, validJpeg)

  const deleteRes = createMockResponse()
  await deleteImage({ params: { filename } }, deleteRes)
  assert.equal(deleteRes.statusCode, 204)
  assert.ok(deleteRes.ended)
  await assert.rejects(() => readProductImage(filename), (e) => e.status === 404)
})

test('storeProductImage rejects invalid images and unsupported formats', async () => {
  await assert.rejects(
    () => storeProductImage('bad.png', Buffer.from([0x89, 0x50, 0x00])),
    (e) => e.status === 400,
  )
  await assert.rejects(
    () => storeProductImage('bad.jpg', Buffer.from([0x00, 0x01, 0x02])),
    (e) => e.status === 400,
  )
  await assert.rejects(
    () => storeProductImage('bad.webp', Buffer.from('NOT_A_WEBP_IMAGE_FILE')),
    (e) => e.status === 400,
  )
  await assert.rejects(
    () => storeProductImage('photo.gif', validPng),
    (e) => e.status === 400,
  )
  await assert.rejects(
    () => storeProductImage('photo.exe', validJpeg),
    (e) => e.status === 400,
  )
  await assert.rejects(
    () => storeProductImage('mismatched.jpg', validPng),
    (e) => e.status === 400,
  )
  await assert.rejects(
    () => storeProductImage('empty.png', Buffer.alloc(0)),
    (e) => e.status === 400,
  )
})
