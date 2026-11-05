import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDesignInput } from '../src/modules/customizer/designValidator.js'
import { calculateTotalCustomizationPriceCents } from '../src/modules/settings/pricingCalculator.js'
import { validDesign } from './helpers.js'

const rejects = (overrides, pattern) =>
  assert.throws(() => validateDesignInput(validDesign(overrides)), (err) => err.status === 400 && pattern.test(err.message), `expected 400 ${pattern}`)

test('a valid design is canonicalised from the server palette, not the client labels', () => {
  const { params, title } = validateDesignInput(validDesign())
  assert.deepEqual(params.color, { label: 'White', hex: '#F5F3EE' })
  assert.deepEqual(params.textColor, { label: 'Black', hex: '#1A1A1A' })
  assert.equal(title, 'Name keychain "Alex"')
  assert.equal(params.keyringPosition, 'left')
  assert.equal(params.allowDisconnected, false)
})

test('the same design always hashes the same way, regardless of client key order, labels or hex case', () => {
  const a = validateDesignInput(validDesign())
  const b = validateDesignInput({ ...validDesign({ color: '#F5F3EE', textColor: { label: 'x', hex: '#1a1a1a' } }) })
  assert.equal(a.paramsHash, b.paramsHash)
  assert.notEqual(a.paramsHash, validateDesignInput(validDesign({ text: 'Alexa' })).paramsHash)
})

test('engine parameters are derived on the server', () => {
  const { engineParams } = validateDesignInput(validDesign({ size: 'Large (7 cm)', thickness: 'premium', styleId: 'bubble', keyringPosition: 'top' }))
  assert.equal(engineParams.textSizeMm, 22) // round(7 * 3.2)
  assert.equal(engineParams.baseThicknessMm, 3.6)
  assert.equal(engineParams.styleId, 'bubble')
  assert.equal(engineParams.keyringPosition, 'top')
  assert.equal(engineParams.fontId, 'bungee')
  assert.equal(engineParams.subtitleFontId, 'bungee')
})

test('templates without selectable styles use the default style; nameplates have no keyring', () => {
  const plate = validateDesignInput(validDesign({ templateId: 'nameplate', styleId: undefined, material: 'Acrylic', color: '#EEF2F3', textColor: '#161412', size: 'Desk (15 cm)', keyringPosition: undefined, subtitle: 'Dr' }))
  assert.equal(plate.params.styleId, null)
  assert.equal(plate.engineParams.styleId, 'contour')
  assert.equal('keyringPosition' in plate.engineParams, false)
  assert.equal(plate.params.subtitle, 'Dr')
})

test('text rules', () => {
  rejects({ text: '' }, /text is required/)
  rejects({ text: '   ' }, /text is required/)
  rejects({ text: 'x'.repeat(25) }, /at most 24/)
  rejects({ text: 'bad\u0000text' }, /cannot be printed/)
  rejects({ text: 123 }, /must be a string/)
  assert.equal(validateDesignInput(validDesign({ text: '  Alex  ' })).params.text, 'Alex')
  assert.equal(validateDesignInput(validDesign({ text: 'x'.repeat(24) })).params.text.length, 24)
})

test('subtitle only where the template supports it', () => {
  assert.equal(validateDesignInput(validDesign({ subtitle: 'Est. 2026' })).params.subtitle, 'Est. 2026')
  rejects({ templateId: 'articulated-name', subtitle: 'nope', styleId: undefined, size: 'Large (7 cm)' }, /does not support a subtitle/)
})

test('template, style, font, material, colour, size, thickness and keyring are all allow-listed', () => {
  rejects({ templateId: 'magnet' }, /not a supported template/)
  rejects({ templateId: undefined }, /not a supported template/)
  rejects({ styleId: 'plain' }, /styleId is not available/)
  rejects({ fontId: 'comic-sans' }, /not a supported font/)
  rejects({ material: 'Wood' }, /material is not available/)
  rejects({ material: 'Acrylic' }, /material is not available/) // not offered for keychains
  rejects({ color: '#123456' }, /not available for the selected material/)
  rejects({ textColor: { hex: '#C9A227' } }, /not available for the selected material/) // Silk colour on Standard PLA
  rejects({ color: undefined }, /color is required/)
  rejects({ size: 'Huge (50 cm)' }, /size is not available/)
  rejects({ size: 'Desk (15 cm)' }, /size is not available/) // a nameplate size on a keychain
  rejects({ thickness: 'ultra' }, /thickness is not a supported/)
  rejects({ keyringPosition: 'middle' }, /keyringPosition is not supported/)
  rejects({ allowDisconnected: 'yes' }, /allowDisconnected/)
})

test('articulated names need an articulated-capable font and a supported size', () => {
  const base = { templateId: 'articulated-name', styleId: undefined, size: 'Medium (5.5 cm)' }
  assert.equal(validateDesignInput(validDesign({ ...base, fontId: 'montserrat' })).params.fontId, 'montserrat')
  rejects({ ...base, fontId: 'nunito' }, /cannot be used for an articulated name/)
  rejects({ ...base, fontId: 'bungee', size: 'Small (4 cm)' }, /size is not available/)
})

test('a nameplate rejects a keyring position', () => {
  rejects({ templateId: 'nameplate', styleId: undefined, material: 'Acrylic', color: '#EEF2F3', textColor: '#161412', size: 'Desk (15 cm)', keyringPosition: 'left' }, /no keyring hole/)
})

test('non-object input is rejected', () => {
  for (const input of [null, undefined, 'x', 5, []]) assert.throws(() => validateDesignInput(input), (err) => err.status === 400)
})

test('price is per non-space character (name + subtitle), matching the existing calculator', () => {
  const { params } = validateDesignInput(validDesign({ text: 'AB C', subtitle: 'D E' }))
  assert.equal(calculateTotalCustomizationPriceCents(params.text, params.subtitle, 500), 5 * 500)
})
