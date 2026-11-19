import test from 'node:test'
import assert from 'node:assert/strict'
import { validateStandDesignInput } from '../src/modules/standDesigner/standDesignValidator.js'
import { priceForStand, CATEGORIES, FINISHES, THEMES, buildPublicOptions } from '../src/modules/standDesigner/standDesignOptions.js'
import { toPublicStandDesign } from '../src/modules/standDesigner/standDesignService.js'
import { toCartResponse } from '../src/modules/cart/cartController.js'
import { serializeOrder } from '../src/modules/orders/orderService.js'

function makeValidStandInput(overrides = {}) {
  return {
    category: 'phone-stand',
    phone: {
      baseWidth: 80,
      baseDepth: 80,
      baseThickness: 8,
      backHeight: 110,
      restingAngle: 72,
      lipHeight: 12,
      phoneThickness: 12,
      caseClearance: 2,
      cornerRadius: 8,
      cableSlotWidth: 16,
      orientation: 'portrait',
      cableRoutingHole: true,
      nonSlipRecesses: true,
      sidePenLoop: false,
    },
    pen: {},
    combined: {},
    personalization: {
      enabled: true,
      text: 'Alex Stand',
      fontStyle: 'modern-sans',
      motif: 'none',
      fontSize: 10,
      depth: 1.5,
      letterSpacing: 1,
      motifSize: 10,
    },
    appearance: {
      themeId: 'minimalist',
      finish: 'matte',
      colors: {
        base: '#2D3748',
        back: '#4A5568',
        cup: '#2D3748',
        text: '#FFFFFF',
        accent: '#3182CE',
      },
    },
    print: {},
    ...overrides,
  }
}

test('validateStandDesignInput canonicalises valid input and computes deterministic paramsHash', () => {
  const input = makeValidStandInput()
  const { canonical, paramsHash, title } = validateStandDesignInput(input)

  assert.equal(canonical.category, 'phone-stand')
  assert.equal(canonical.personalization.text, 'Alex Stand')
  assert.equal(title, 'Phone Stand "Alex Stand"')
  assert.ok(typeof paramsHash === 'string' && paramsHash.length === 64)

  // Re-validating identical input yields exact same paramsHash
  const second = validateStandDesignInput(makeValidStandInput())
  assert.equal(second.paramsHash, paramsHash)

  // Changing personalized text changes the paramsHash and title
  const altered = validateStandDesignInput(makeValidStandInput({
    personalization: { ...input.personalization, text: 'Custom Workspace' },
  }))
  assert.notEqual(altered.paramsHash, paramsHash)
  assert.equal(altered.title, 'Phone Stand "Custom Workspace"')
})

test('validateStandDesignInput validates category, ranges, and text rules', () => {
  assert.throws(
    () => validateStandDesignInput(makeValidStandInput({ category: 'invalid-cat' })),
    /category is not supported/
  )

  assert.throws(
    () => validateStandDesignInput(makeValidStandInput({
      phone: { ...makeValidStandInput().phone, baseWidth: 500 },
    })),
    /phone\.baseWidth must be between/
  )

  assert.throws(
    () => validateStandDesignInput(makeValidStandInput({
      personalization: { ...makeValidStandInput().personalization, text: 'This text is way too long for a stand customizer title' },
    })),
    /personalization\.text exceeds 22 characters/
  )
})

test('priceForStand calculates consistent price from volume and category base prices', () => {
  const pricingConfig = {
    pricePerCm3Cents: 500, // ₹5.00 per cm³
    categories: {
      'phone-stand': { basePriceCents: 120000 }, // ₹1,200.00
      'combined': { basePriceCents: 150000 },    // ₹1,500.00
    },
  }

  // 100 cm³ phone stand: 120000 + (100 * 500) = 170000 cents (₹1,700.00)
  const phoneStandPrice = priceForStand('phone-stand', 100, pricingConfig)
  assert.equal(phoneStandPrice, 170000)

  // 100 cm³ combined stand: 150000 + (100 * 500) = 200000 cents (₹2,000.00)
  const combinedPrice = priceForStand('combined', 100, pricingConfig)
  assert.equal(combinedPrice, 200000)
})

test('toPublicStandDesign strictly hides internal storage keys for customer and reveals metadata for admin', () => {
  const dbRecord = {
    id: 'stand-123',
    userId: 'user-456',
    paramsHash: 'a'.repeat(64),
    category: 'phone-stand',
    title: 'Phone Stand "Alex"',
    status: 'READY',
    schemaVersion: 1,
    designConfig: { sample: 'config' },
    solidVolumeCm3: 85.5,
    unitPriceCents: 150000,
    previewKey: 'previews/stand-123.png',
    stlKey: 'stls/stand-123.stl',
    stlSizeBytes: 1048576,
    stlSha256: 'b'.repeat(64),
    triangleCount: 42000,
    bboxMm: { x: 80, y: 80, z: 110 },
    createdAt: new Date('2026-11-18T10:00:00Z'),
    updatedAt: new Date('2026-11-18T10:00:00Z'),
  }

  const customerView = toPublicStandDesign(dbRecord, { admin: false })
  assert.equal(customerView.id, 'stand-123')
  assert.equal(customerView.title, 'Phone Stand "Alex"')
  assert.equal(customerView.hasPreview, true)
  assert.equal(customerView.hasStl, true)
  assert.equal(customerView.unitPriceCents, 150000)
  // Ensure private storage keys and internal server fields are NEVER exposed to customer
  assert.equal('previewKey' in customerView, false)
  assert.equal('stlKey' in customerView, false)
  assert.equal('schemaVersion' in customerView, false)
  assert.equal('solidVolumeCm3' in customerView, false)
  assert.equal('stl' in customerView, false)

  const adminView = toPublicStandDesign(dbRecord, { admin: true })
  assert.equal(adminView.schemaVersion, 1)
  assert.equal(adminView.solidVolumeCm3, 85.5)
  assert.deepEqual(adminView.stl, {
    sizeBytes: 1048576,
    sha256: 'b'.repeat(64),
    triangleCount: 42000,
    bboxMm: { x: 80, y: 80, z: 110 },
  })
})

test('toCartResponse serializes a mixed cart (catalog product, custom keychain, stand design) consistently', () => {
  const dummyCart = {
    id: 'cart-abc',
    userId: 'user-123',
    items: [
      // 1. Catalog product line
      {
        id: 'item-1',
        itemType: 'PRODUCT',
        productId: 'prod-1',
        quantity: 2,
        unitPriceCents: 50000, // ₹500
        customization: null,
        product: {
          id: 'prod-1',
          slug: 'minimalist-lamp',
          name: 'Minimalist Lamp',
          images: ['lamp.jpg'],
          isActive: true,
          shippingCents: 5000, // ₹50
        },
        customDesign: null,
        standDesign: null,
      },
      // 2. Keychain custom design line
      {
        id: 'item-2',
        itemType: 'CUSTOM_DESIGN',
        productId: null,
        quantity: 1,
        unitPriceCents: 75000, // ₹750
        customization: { shippingMethod: { name: 'Standard', priceCents: 4000 } },
        product: null,
        customDesign: {
          id: 'design-keychain-1',
          userId: 'user-123',
          paramsHash: 'c'.repeat(64),
          templateId: 'name-keychain',
          styleId: 'contour',
          title: 'Name Keychain "Alex"',
          status: 'READY',
          schemaVersion: 1,
          params: { text: 'Alex' },
          unitPriceCents: 75000,
          previewKey: 'keychain.png',
          stlKey: 'keychain.stl',
          createdAt: new Date(),
        },
        standDesign: null,
      },
      // 3. Stand custom design line
      {
        id: 'item-3',
        itemType: 'STAND_DESIGN',
        productId: null,
        quantity: 1,
        unitPriceCents: 150000, // ₹1,500
        customization: { shippingMethod: { name: 'Express', priceCents: 6000 } },
        product: null,
        customDesign: null,
        standDesign: {
          id: 'stand-design-1',
          userId: 'user-123',
          paramsHash: 'd'.repeat(64),
          category: 'phone-stand',
          title: 'Phone Stand "Alex"',
          status: 'READY',
          schemaVersion: 1,
          designConfig: { sample: 'stand-config' },
          unitPriceCents: 150000,
          previewKey: 'stand.png',
          stlKey: 'stand.stl',
          createdAt: new Date(),
        },
      },
    ],
  }

  const response = toCartResponse(dummyCart)
  assert.equal(response.items.length, 3)

  // Item 1: Catalog Product
  const prodItem = response.items[0]
  assert.equal(prodItem.itemType, 'PRODUCT')
  assert.ok(prodItem.product)
  assert.equal(prodItem.product.name, 'Minimalist Lamp')
  assert.equal(prodItem.design, null)
  assert.equal(prodItem.stand, null)
  assert.equal(prodItem.lineTotalCents, 100000)

  // Item 2: Keychain Custom Design
  const customItem = response.items[1]
  assert.equal(customItem.itemType, 'CUSTOM_DESIGN')
  assert.equal(customItem.product, null)
  assert.ok(customItem.design)
  assert.equal(customItem.design.title, 'Name Keychain "Alex"')
  assert.equal(customItem.stand, null)
  assert.equal(customItem.lineTotalCents, 75000)

  // Item 3: Stand Design
  const standItem = response.items[2]
  assert.equal(standItem.itemType, 'STAND_DESIGN')
  assert.equal(standItem.product, null)
  assert.equal(standItem.design, null)
  assert.ok(standItem.stand)
  assert.equal(standItem.stand.title, 'Phone Stand "Alex"')
  assert.equal(standItem.stand.hasPreview, true)
  assert.equal(standItem.stand.hasStl, true)
  assert.equal(standItem.lineTotalCents, 150000)

  // Subtotal calculation across all lines: 100000 + 75000 + 150000 = 325000 cents (₹3,250.00)
  assert.equal(response.subtotalCents, 325000)
  assert.equal(response.totalCents, 325000)
})

test('serializeOrder preserves stand summary in both customer and admin views', () => {
  const dummyOrder = {
    id: 'order-123',
    orderNumber: 'GFT-20261118-STAND',
    userId: 'user-123',
    status: 'PAID',
    subtotalCents: 150000,
    shippingCents: 5000,
    totalCents: 155000,
    items: [
      {
        id: 'order-item-1',
        orderId: 'order-123',
        itemType: 'STAND_DESIGN',
        standDesignId: 'stand-xyz',
        productName: 'Phone Stand "Alex"',
        quantity: 1,
        unitPriceCents: 150000,
        customization: { theme: 'slate' },
        standDesign: {
          id: 'stand-xyz',
          userId: 'user-123',
          category: 'phone-stand',
          title: 'Phone Stand "Alex"',
          status: 'READY',
          schemaVersion: 1,
          designConfig: { text: 'Alex' },
          solidVolumeCm3: 80,
          unitPriceCents: 150000,
          previewKey: 'preview.png',
          stlKey: 'stand.stl',
          stlSizeBytes: 524288,
          stlSha256: 'e'.repeat(64),
          triangleCount: 30000,
          bboxMm: { x: 80, y: 80, z: 100 },
          createdAt: new Date(),
        },
      },
    ],
  }

  const customerOrder = serializeOrder(dummyOrder, { admin: false })
  assert.ok(customerOrder.items[0].stand)
  assert.equal(customerOrder.items[0].stand.title, 'Phone Stand "Alex"')
  assert.equal(customerOrder.items[0].stand.hasStl, true)
  assert.equal('stl' in customerOrder.items[0].stand, false) // Hidden from customer

  const adminOrder = serializeOrder(dummyOrder, { admin: true })
  assert.ok(adminOrder.items[0].stand)
  assert.equal(adminOrder.items[0].stand.solidVolumeCm3, 80)
  assert.equal(adminOrder.items[0].stand.stl.sizeBytes, 524288)
  assert.equal(adminOrder.items[0].stand.stl.triangleCount, 30000)
})

test('buildPublicOptions returns expected options schema', async () => {
  const options = await buildPublicOptions()
  assert.equal(options.schemaVersion, 1)
  assert.equal(options.categories.length, 5)
  assert.ok(options.categories.some((c) => c.id === 'phone-stand' && typeof c.basePriceCents === 'number'))
  assert.ok(options.categories.some((c) => c.id === 'combined' && typeof c.basePriceCents === 'number'))
  assert.ok(Array.isArray(options.finishes) && options.finishes.includes('metallic-gold'))
  assert.ok(Array.isArray(options.themes) && options.themes.includes('luxury-executive'))
  assert.ok(Array.isArray(options.fonts) && options.fonts.includes('futuristic'))
  assert.ok(Array.isArray(options.motifs) && options.motifs.includes('star'))
  assert.equal(options.stl.maxBytes, 50 * 1024 * 1024)
  assert.equal(options.previewMaxBytes, 2 * 1024 * 1024)
})
