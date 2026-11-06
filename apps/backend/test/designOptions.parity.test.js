import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  FONTS,
  KEYRING_POSITIONS,
  MATERIALS,
  TEMPLATES,
  THICKNESSES,
  textSizeMmForSize,
} from '../src/modules/customizer/designOptions.js'

// These tests fail if the server's allow-lists drift from what the customer
// frontend's geometry engine actually supports.
const frontend = (relative) => fileURLToPath(new URL(`../../customer-frontend/src/features/customiser/${relative}`, import.meta.url))
const text = (relative) => readFile(frontend(relative), 'utf8')
const load = (relative) => import(pathToFileURL(frontend(relative)).href)

test('fonts: same ids and same articulated-capable set as the engine catalog', async () => {
  const source = await text('geometry/fonts/catalog.js')
  const engine = new Map()
  for (const match of source.matchAll(/\{ id: '([a-z0-9-]+)', name: '([^']+)', file: '[^']+'[^}]*?supportsArticulated: (true|false)/g)) {
    engine.set(match[1], { name: match[2], supportsArticulated: match[3] === 'true' })
  }
  assert.equal(engine.size, 23)
  assert.deepEqual([...Object.keys(FONTS)].sort(), [...engine.keys()].sort())
  for (const [id, font] of engine) assert.deepEqual(FONTS[id], font, `font ${id}`)
})

test('templates: ids, styles and capabilities match the engine template catalog', async () => {
  const source = await text('geometry/templates/templateBuilder.js')
  const list = (name) => [...source.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`))[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
  const allStyles = list('ALL_STYLE_IDS')
  const nameKeychainStyles = [...allStyles, 'ribbon', 'heart-split']
  assert.deepEqual(TEMPLATES['name-keychain'].styles, nameKeychainStyles)
  assert.match(source, /id: 'name-keychain'[\s\S]*?supportsKeyring: true,\s*supportsSubtitle: true/)
  assert.match(source, /id: 'articulated-name'[\s\S]*?supportsKeyring: true,\s*supportsSubtitle: false,\s*styles: \[\]/)
  assert.match(source, /id: 'nameplate'[\s\S]*?supportsKeyring: false,\s*supportsSubtitle: true,\s*styles: \[\]/)
  assert.equal(TEMPLATES['articulated-name'].supportsSubtitle, false)
  assert.equal(TEMPLATES.nameplate.supportsKeyring, false)
})

test('thickness and keyring options come from the engine', async () => {
  const { THICKNESS_OPTIONS } = await load('thicknessOptions.js')
  assert.deepEqual(Object.keys(THICKNESSES), Object.keys(THICKNESS_OPTIONS))
  for (const id of Object.keys(THICKNESS_OPTIONS)) assert.equal(THICKNESSES[id].baseThicknessMm, THICKNESS_OPTIONS[id].baseThicknessMm)
  const { KEYRING_POSITIONS: engine } = await load('geometry/model/keyringPosition.js')
  assert.deepEqual(KEYRING_POSITIONS, [...engine])
})

test('size -> text size mapping is identical to the frontend for every offered size', async () => {
  const { shapeDefaultsForSize } = await load('geometry/productMapping.js')
  const sizes = new Set(Object.values(TEMPLATES).flatMap((t) => t.sizes))
  assert.ok(sizes.size >= 5)
  for (const size of sizes) assert.equal(textSizeMmForSize(size), shapeDefaultsForSize(size).textSizeMm, size)
})

test('every template material exists and colours match the seeded catalog palettes', async () => {
  for (const template of Object.values(TEMPLATES)) for (const material of template.materials) assert.ok(MATERIALS[material], material)
  const seed = await readFile(fileURLToPath(new URL('../prisma/seedCatalog.js', import.meta.url)), 'utf8')
  const palette = (name) => [...seed.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n\\]`))[1].matchAll(/label: '([^']+)', hex: '(#[0-9a-fA-F]{6})'/g)].map((m) => ({ label: m[1], hex: m[2].toUpperCase() }))
  assert.deepEqual(MATERIALS['Standard PLA'].colors, palette('STANDARD_PLA_COLORS'))
  assert.deepEqual(MATERIALS['Silk Metallic PLA'].colors, palette('SILK_METALLIC_PLA_COLORS'))
  assert.deepEqual(MATERIALS.Metal.colors, palette('METAL_COLORS'))
  assert.deepEqual(MATERIALS.Acrylic.colors, palette('ACRYLIC_COLORS'))
})
