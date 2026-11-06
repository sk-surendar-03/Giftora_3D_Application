import { fileURLToPath } from 'node:url'
import { LocalStorageDriver } from './localDriver.js'

// File storage for generated STLs and design previews. The database only ever
// stores the returned *key*, never a path or a temporary URL.
//
// Driver contract (every driver implements the same four methods):
//   put(key, buffer, { immutable })  -> Promise<void>
//   get(key)                         -> Promise<Buffer>
//   exists(key)                      -> Promise<boolean>
//   delete(key)                      -> Promise<void>
//
// Configuration (environment):
//   STORAGE_DRIVER     "local" (default). "s3" is reserved for a future
//                      S3-compatible driver and is not implemented yet.
//   STORAGE_LOCAL_DIR  Root folder for the local driver. Defaults to
//                      apps/backend/storage (git-ignored).
const DEFAULT_LOCAL_DIR = fileURLToPath(new URL('../../../storage', import.meta.url))

let instance

export function createStorage(env = process.env) {
  const driver = (env.STORAGE_DRIVER ?? 'local').toLowerCase()
  if (driver === 'local') return new LocalStorageDriver(env.STORAGE_LOCAL_DIR || DEFAULT_LOCAL_DIR)
  if (driver === 's3') {
    throw new Error('STORAGE_DRIVER=s3 is not implemented yet. Add an S3-compatible driver with the same put/get/exists/delete contract in src/modules/storage/.')
  }
  throw new Error(`Unknown STORAGE_DRIVER "${env.STORAGE_DRIVER}".`)
}

export function getStorage() {
  instance ??= createStorage()
  return instance
}
