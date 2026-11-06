import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { LocalStorageDriver } from '../src/modules/storage/localDriver.js'
import { createStorage } from '../src/modules/storage/storage.js'

async function withDriver(fn) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'giftora-storage-'))
  try {
    await fn(new LocalStorageDriver(dir), dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

test('put / get / exists / delete round-trip', () =>
  withDriver(async (storage) => {
    const key = 'designs/u1/d1/abc.stl'
    assert.equal(await storage.exists(key), false)
    await storage.put(key, Buffer.from('hello'))
    assert.equal(await storage.exists(key), true)
    assert.equal((await storage.get(key)).toString(), 'hello')
    await storage.delete(key)
    assert.equal(await storage.exists(key), false)
    await storage.delete(key) // deleting a missing file is not an error
  }))

test('files survive a brand-new driver instance (i.e. a server restart)', () =>
  withDriver(async (storage, dir) => {
    await storage.put('designs/u/d/f.stl', Buffer.from('persisted'))
    const afterRestart = new LocalStorageDriver(dir)
    assert.equal((await afterRestart.get('designs/u/d/f.stl')).toString(), 'persisted')
  }))

test('keys that could escape the storage root are refused', () =>
  withDriver(async (storage) => {
    for (const key of ['../evil.stl', 'designs/../../evil', '/etc/passwd', 'C:/Windows/x', 'a//b', 'a/b/', '', 'designs/u1/..', 'a\\b', null, 42]) {
      await assert.rejects(() => storage.put(key, Buffer.from('x')), /Invalid storage key/, `put ${JSON.stringify(key)}`)
      await assert.rejects(() => storage.get(key), /Invalid storage key/, `get ${JSON.stringify(key)}`)
    }
  }))

test('immutable puts never overwrite an existing identical-size file', () =>
  withDriver(async (storage) => {
    await storage.put('designs/u/d/h.stl', Buffer.from('AAAA'), { immutable: true })
    await storage.put('designs/u/d/h.stl', Buffer.from('BBBB'), { immutable: true })
    assert.equal((await storage.get('designs/u/d/h.stl')).toString(), 'AAAA')
  }))

test('writes are atomic: no temp files are left behind', () =>
  withDriver(async (storage, dir) => {
    await storage.put('designs/u/d/p.png', Buffer.alloc(1000, 7))
    await storage.put('designs/u/d/p.png', Buffer.alloc(2000, 9)) // overwrite (previews)
    const files = await readdir(path.join(dir, 'designs/u/d'))
    assert.deepEqual(files, ['p.png'])
    assert.equal((await stat(path.join(dir, 'designs/u/d/p.png'))).size, 2000)
  }))

test('driver selection is configurable; S3 is explicitly reserved, not silently faked', () => {
  assert.ok(createStorage({}) instanceof LocalStorageDriver)
  assert.ok(createStorage({ STORAGE_DRIVER: 'local', STORAGE_LOCAL_DIR: os.tmpdir() }) instanceof LocalStorageDriver)
  assert.throws(() => createStorage({ STORAGE_DRIVER: 's3' }), /not implemented yet/)
  assert.throws(() => createStorage({ STORAGE_DRIVER: 'ftp' }), /Unknown STORAGE_DRIVER/)
})
