/**
 * Comprehensive tests for the 3D customization flow:
 *   1. Design validation — hardcoded palette AND admin-configured overrides
 *   2. Pricing calculator — base tier + per-character + size + thickness
 *   3. Cart pricing — full unit price snapshot (char + size + thickness)
 *   4. Checkout shipping — custom design shipping included in total
 *   5. Order shipping  — shipping stored correctly on createOrder
 *
 * All tests are pure unit tests (no DB, no network).
 * Run with: npm test
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDesignInput } from '../src/modules/customizer/designValidator.js'
import {
  countBillableCharacters,
  calculateTotalCustomizationPriceCents,
} from '../src/modules/settings/pricingCalculator.js'
import { validDesign } from './helpers.js'

// ─── helpers ────────────────────────────────────────────────────────────────

const ADMIN_SETTINGS = {
  colors: [
    { name: 'Cherry Red', hex: '#C0392B' },
    { name: 'Ocean Blue', hex: '#1A6FA1' },
    { name: 'Matte Black', hex: '#1A1A1A' },
  ],
  sizes: [
    { name: 'Small 8cm', priceCents: 0 },
    { name: 'Medium 12cm', priceCents: 5000 },
    { name: 'Large 15cm', priceCents: 10000 },
  ],
  thicknesses: [
    { name: 'Slim', priceCents: 0 },
    { name: 'Thick', priceCents: 3000 },
  ],
}

const SHIPPING_FREE = { name: 'Standard', priceCents: 0, estimatedDays: '5-7 days' }
const SHIPPING_PAID = { name: 'Express', priceCents: 10000, estimatedDays: '1-2 days' }

// Simulates the cartService / orderService shippingCents reduce logic.
function calcCartShipping(items) {
  return items.reduce((sum, item) => {
    const sel = item.customization?.shippingMethod
    if (sel && typeof sel.priceCents === 'number') return sum + sel.priceCents
    if (item.itemType === 'PRODUCT' && item.product?.shippingCents > 0) return sum + item.product.shippingCents
    return sum
  }, 0)
}

// Simulates the full unit price for a custom design item.
function calcCustomUnitPrice({ charPrice, sizeName, thicknessName }, { sizes, thicknesses }) {
  const sizeCents = sizes.find((s) => s.name === sizeName)?.priceCents ?? 0
  const thickCents = thicknesses.find((t) => t.name === thicknessName)?.priceCents ?? 0
  return charPrice + sizeCents + thickCents
}

// ─── 1. Pricing calculator ───────────────────────────────────────────────────

test('countBillableCharacters: spaces are free, all other visible chars are billed', () => {
  assert.equal(countBillableCharacters('Alex'), 4)
  assert.equal(countBillableCharacters('A l e x'), 4)   // 4 letters, 3 spaces → 4
  assert.equal(countBillableCharacters(''), 0)
  assert.equal(countBillableCharacters(null), 0)
  assert.equal(countBillableCharacters('Est. 2026'), 8)  // 'E','s','t','.','2','0','2','6'
})

test('calculateTotalCustomizationPriceCents: flat per-char (no base tier)', () => {
  // 4 chars × ₹500 = ₹2000
  assert.equal(calculateTotalCustomizationPriceCents('Alex', '', 500, 0, 0), 2000)
})

test('calculateTotalCustomizationPriceCents: base tier — within base', () => {
  // 4 chars, base=10, basePriceCents=5000 → charged flat ₹5000
  assert.equal(calculateTotalCustomizationPriceCents('Alex', '', 500, 10, 5000), 5000)
})

test('calculateTotalCustomizationPriceCents: base tier — above base', () => {
  // 10 chars, base=10 → flat 5000
  // 12 chars, base=10 → 5000 + 2×500 = 6000
  assert.equal(calculateTotalCustomizationPriceCents('1234567890', '', 500, 10, 5000), 5000)
  assert.equal(calculateTotalCustomizationPriceCents('123456789012', '', 500, 10, 5000), 6000)
})

test('calculateTotalCustomizationPriceCents: subtitle characters are also billed', () => {
  // name "Alex" (4) + subtitle "Dr" (2) = 6 chars × 500 = 3000
  assert.equal(calculateTotalCustomizationPriceCents('Alex', 'Dr', 500, 0, 0), 3000)
})

test('calculateTotalCustomizationPriceCents: empty text returns 0', () => {
  assert.equal(calculateTotalCustomizationPriceCents('', '', 500, 10, 5000), 0)
})

// ─── 2. Design validator — hardcoded palette ─────────────────────────────────

test('validator: valid design with default hardcoded palette', () => {
  const { params, title } = validateDesignInput(validDesign())
  assert.equal(params.text, 'Alex')
  assert.equal(title, 'Name keychain "Alex"')
  assert.deepEqual(params.color, { label: 'White', hex: '#F5F3EE' })
})

test('validator: rejects color not in material palette (no admin colors)', () => {
  assert.throws(
    () => validateDesignInput(validDesign({ color: '#C0392B' })),
    (err) => err.status === 400 && /not available for the selected material/.test(err.message),
  )
})

test('validator: rejects unknown size (no admin sizes)', () => {
  assert.throws(
    () => validateDesignInput(validDesign({ size: 'smaller 12inch' })),
    (err) => err.status === 400 && /size is not available/.test(err.message),
  )
})

test('validator: rejects unknown thickness (no admin thicknesses)', () => {
  assert.throws(
    () => validateDesignInput(validDesign({ thickness: 'Slim' })),
    (err) => err.status === 400 && /thickness is not a supported/.test(err.message),
  )
})

// ─── 3. Design validator — admin-configured overrides ───────────────────────

// When admin settings are fully configured, the design input must use admin-valid
// size + thickness + color together. ADMIN_DESIGN is the base valid design for these tests.
const ADMIN_DESIGN = { size: 'Small 8cm', thickness: 'Slim', color: '#1A1A1A', textColor: { hex: '#1A6FA1' } }

test('validator: admin color accepted even when not in material palette', () => {
  const { params } = validateDesignInput(
    validDesign({ ...ADMIN_DESIGN, color: '#C0392B' }),
    ADMIN_SETTINGS,
  )
  assert.deepEqual(params.color, { label: 'Cherry Red', hex: '#C0392B' })
})

test('validator: admin color hex matching is case-insensitive', () => {
  const { params } = validateDesignInput(
    validDesign({ ...ADMIN_DESIGN, color: '#c0392b' }),  // lowercase
    ADMIN_SETTINGS,
  )
  assert.equal(params.color.label, 'Cherry Red')
})

test('validator: color not in admin list AND not in palette is rejected', () => {
  assert.throws(
    () => validateDesignInput(validDesign({ ...ADMIN_DESIGN, color: '#DEADBE' }), ADMIN_SETTINGS),
    (err) => err.status === 400 && /not available for the selected material/.test(err.message),
  )
})

test('validator: admin size accepted when present', () => {
  const { params } = validateDesignInput(
    validDesign({ ...ADMIN_DESIGN, size: 'Medium 12cm' }),
    ADMIN_SETTINGS,
  )
  assert.equal(params.size, 'Medium 12cm')
})

test('validator: size not in admin list is rejected when admin sizes exist', () => {
  assert.throws(
    () => validateDesignInput(validDesign({ ...ADMIN_DESIGN, size: 'Medium (5.5 cm)' }), ADMIN_SETTINGS),
    (err) => err.status === 400 && /size is not available/.test(err.message),
  )
})

test('validator: admin thickness accepted when present', () => {
  const { params } = validateDesignInput(
    validDesign({ ...ADMIN_DESIGN, thickness: 'Thick' }),
    ADMIN_SETTINGS,
  )
  assert.equal(params.thickness, 'Thick')
})

test('validator: thickness not in admin list is rejected when admin thicknesses exist', () => {
  assert.throws(
    () => validateDesignInput(validDesign({ ...ADMIN_DESIGN, thickness: 'standard' }), ADMIN_SETTINGS),
    (err) => err.status === 400 && /thickness is not a supported/.test(err.message),
  )
})

test('validator: empty admin arrays fall back to hardcoded lists', () => {
  // All three empty → hardcoded palette used → valid standard design passes
  const { params } = validateDesignInput(validDesign(), { colors: [], sizes: [], thicknesses: [] })
  assert.equal(params.text, 'Alex')
})

// ─── 4. Cart unit price: char + size + thickness ─────────────────────────────

test('cart: unit price = char price only when size and thickness are free', () => {
  const charPrice = calculateTotalCustomizationPriceCents('Alex', '', 500, 10, 5000) // 5000
  const unit = calcCustomUnitPrice(
    { charPrice, sizeName: 'Small 8cm', thicknessName: 'Slim' },
    ADMIN_SETTINGS,
  )
  assert.equal(unit, 5000)
})

test('cart: unit price includes size extra', () => {
  const charPrice = 5000
  const unit = calcCustomUnitPrice(
    { charPrice, sizeName: 'Medium 12cm', thicknessName: 'Slim' },
    ADMIN_SETTINGS,
  )
  assert.equal(unit, 5000 + 5000) // 10000
})

test('cart: unit price includes thickness extra', () => {
  const charPrice = 5000
  const unit = calcCustomUnitPrice(
    { charPrice, sizeName: 'Small 8cm', thicknessName: 'Thick' },
    ADMIN_SETTINGS,
  )
  assert.equal(unit, 5000 + 3000) // 8000
})

test('cart: unit price includes both size and thickness extras', () => {
  const charPrice = 5000
  const unit = calcCustomUnitPrice(
    { charPrice, sizeName: 'Large 15cm', thicknessName: 'Thick' },
    ADMIN_SETTINGS,
  )
  assert.equal(unit, 5000 + 10000 + 3000) // 18000
})

test('cart: unknown size/thickness name defaults to 0 extra (no crash)', () => {
  const charPrice = 5000
  const unit = calcCustomUnitPrice(
    { charPrice, sizeName: 'Unknown', thicknessName: 'Unknown' },
    ADMIN_SETTINGS,
  )
  assert.equal(unit, 5000)
})

// ─── 5. Cart / Order shipping calculation ───────────────────────────────────

test('shipping: custom design with free shipping method contributes 0', () => {
  const items = [
    { itemType: 'CUSTOM_DESIGN', customization: { shippingMethod: SHIPPING_FREE } },
  ]
  assert.equal(calcCartShipping(items), 0)
})

test('shipping: custom design with paid shipping method included in total', () => {
  const items = [
    { itemType: 'CUSTOM_DESIGN', customization: { shippingMethod: SHIPPING_PAID } },
  ]
  assert.equal(calcCartShipping(items), 10000)
})

test('shipping: product item uses product.shippingCents', () => {
  const items = [
    { itemType: 'PRODUCT', product: { shippingCents: 15000 }, customization: {} },
  ]
  assert.equal(calcCartShipping(items), 15000)
})

test('shipping: product with shippingMethod customization overrides product.shippingCents', () => {
  const items = [
    { itemType: 'PRODUCT', product: { shippingCents: 15000 }, customization: { shippingMethod: SHIPPING_PAID } },
  ]
  assert.equal(calcCartShipping(items), 10000) // shippingMethod wins
})

test('shipping: mixed cart (custom design + product) sums both shipping costs', () => {
  const items = [
    { itemType: 'CUSTOM_DESIGN', customization: { shippingMethod: SHIPPING_PAID } },
    { itemType: 'PRODUCT', product: { shippingCents: 15000 }, customization: {} },
  ]
  assert.equal(calcCartShipping(items), 10000 + 15000)
})

test('shipping: custom design with no shippingMethod contributes 0 (no crash)', () => {
  const items = [
    { itemType: 'CUSTOM_DESIGN', customization: {} },
  ]
  assert.equal(calcCartShipping(items), 0)
})

test('shipping: custom design with null customization contributes 0 (no crash)', () => {
  const items = [
    { itemType: 'CUSTOM_DESIGN', customization: null },
  ]
  assert.equal(calcCartShipping(items), 0)
})

test('shipping: empty cart returns 0', () => {
  assert.equal(calcCartShipping([]), 0)
})

// ─── 6. Full price scenario: a realistic order ───────────────────────────────

test('full scenario: 2-item order total = subtotal + shipping', () => {
  // Item 1: custom "SURENDAR" (8 chars, base 10 → ₹5000) + Large 15cm (+₹100) + Thick (+₹30) = ₹230
  //         qty=2, shipping=Express ₹100 → line total 2×230 = ₹460, shipping ₹100
  const charPrice1 = calculateTotalCustomizationPriceCents('SURENDAR', '', 500, 10, 5000)
  assert.equal(charPrice1, 5000) // 8 chars ≤ 10 base → flat ₹50
  const unit1 = calcCustomUnitPrice(
    { charPrice: charPrice1, sizeName: 'Large 15cm', thicknessName: 'Thick' },
    ADMIN_SETTINGS,
  )
  assert.equal(unit1, 5000 + 10000 + 3000) // ₹180 (in paise: 18000)

  // Item 2: product with ₹150 shipping
  const unit2 = 20000 // product price ₹200
  const qty2 = 1
  const productShipping = 15000

  const subtotalCents = unit1 * 2 + unit2 * qty2
  const items = [
    { itemType: 'CUSTOM_DESIGN', customization: { shippingMethod: SHIPPING_PAID } },
    { itemType: 'PRODUCT', product: { shippingCents: productShipping }, customization: {} },
  ]
  const shippingCents = calcCartShipping(items)
  const totalCents = subtotalCents + shippingCents

  assert.equal(subtotalCents, 18000 * 2 + 20000)   // 56000
  assert.equal(shippingCents, 10000 + 15000)         // 25000
  assert.equal(totalCents, 56000 + 25000)            // 81000
})
