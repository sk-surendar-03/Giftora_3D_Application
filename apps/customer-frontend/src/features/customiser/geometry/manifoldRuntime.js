import Module from 'manifold-3d'
import { GeometryError } from './errors.js'

// manifold-3d ships as a WASM module; Giftora copies its manifold.wasm into
// public/ (served at the site root) so the browser can fetch it without a
// bundler import. Mirrors Open Keychain's createWasm() (MIT) — see
// THIRD-PARTY-NOTICES.md — but simplified: Giftora runs this on the main
// thread for now rather than in a dedicated worker (see Known limitations
// in DEVELOPMENT_PROGRESS.md).
let wasmPromise

export function getManifoldWasm() {
  if (!wasmPromise) {
    wasmPromise = Module({ locateFile: () => '/manifold.wasm' })
      .then((wasm) => {
        wasm.setup()
        return wasm
      })
      .catch((error) => {
        wasmPromise = undefined
        throw new GeometryError('Could not initialise the 3D geometry engine.', 'wasm-init-failed', {
          cause: error,
        })
      })
  }
  return wasmPromise
}
