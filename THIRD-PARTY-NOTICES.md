# Third-party notices

Giftora's customer-frontend 3D customizer (`apps/customer-frontend/src/features/customiser/geometry/`)
reuses source code, an approach, and bundled fonts from **Open Keychain**
(https://github.com/capynq/open-keychain), used under the MIT License.
Giftora is an independent project and is not affiliated with, endorsed by,
or an official distribution of Open Keychain — see Open Keychain's own
`TRADEMARKS.md` for why that distinction is called out explicitly here.

## Open Keychain — MIT License

```
MIT License

Copyright (c) 2026 capynq

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### What was reused and how

- `src/features/customiser/geometry/textOutline.js` is a direct TypeScript-to-
  JavaScript port of Open Keychain's `src/domain/keychain/text/outline.ts`
  (curve-flattening and text-layout logic only; type annotations removed,
  behaviour unchanged).
- `src/features/customiser/geometry/meshToBufferGeometry.js`'s mesh-conversion
  function and its `MANIFOLD_SCALE = 1000` convention follow the same approach
  as Open Keychain's `src/infrastructure/geometry/manifold-utils.ts`
  (`asMesh`), reimplemented against three.js's `BufferGeometry` instead of
  Giftora having its own equivalent type.
- `src/features/customiser/geometry/manifoldRuntime.js`'s WASM-loading
  pattern (`Module({ locateFile })` then `wasm.setup()`) follows Open
  Keychain's `createWasm()` in `src/domain/keychain/build/keychain-builder.ts`.
- `src/features/customiser/geometry/keychainGeometry.js` is Giftora's own new
  code, written to the same font-outline → `CrossSection` → `extrude` →
  `Manifold.union` pipeline Open Keychain uses, adapted to Giftora's own
  (much simpler) keychain shape and product data — not copied from Open
  Keychain's own `keychain-builder.ts`, which implements a larger set of
  template styles Giftora doesn't use.

## Bundled fonts — SIL Open Font License 1.1

Two font files were copied from Open Keychain's `public/fonts/` (themselves
sourced from Google Fonts) into `apps/customer-frontend/public/fonts/`, each
under the SIL Open Font License 1.1. Per the OFL, each font's own license
text travels with it at `apps/customer-frontend/public/fonts/licenses/`:

- **Montserrat** — Copyright 2024 The Montserrat.Git Project Authors
  (https://github.com/JulietaUla/Montserrat.git) — `fonts/licenses/montserrat.txt`
- **Nunito** — Copyright 2014 The Nunito Project Authors
  (https://github.com/googlefonts/nunito) — `fonts/licenses/nunito.txt`

The OFL permits bundling and redistributing these fonts with software; it
does not permit selling the font files by themselves, and any modified
version must keep the OFL and must not use the fonts' own reserved names.
Neither condition is affected by Giftora's use here.

## manifold-3d and opentype.js

`manifold-3d` (WASM CSG kernel) and `opentype.js` (font parsing) are used as
ordinary npm dependencies of `apps/customer-frontend`, each under their own
MIT licenses (see `node_modules/manifold-3d/LICENSE` and
`node_modules/opentype.js/LICENSE` after `npm install`). `manifold-3d`'s
`manifold.wasm` binary is copied into `apps/customer-frontend/public/` so it
can be served as a static asset; it is not modified.
