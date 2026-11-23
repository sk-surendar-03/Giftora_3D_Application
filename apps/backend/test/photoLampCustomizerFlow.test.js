import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import {
  priceForLithophane,
  buildPublicOptions,
  LITHOPHANE_TEMPLATES,
  DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES,
  DEFAULT_LITHOPHANE_ADDON_PRICES,
  DEFAULT_LITHOPHANE_PRICE_PER_CM3_CENTS,
} from '../src/modules/lithophaneDesigner/lithophaneDesignOptions.js'
import { validateLithophaneDesignInput } from '../src/modules/lithophaneDesigner/lithophaneDesignValidator.js'
import {
  toPublicLithophaneDesign,
  storePhoto,
} from '../src/modules/lithophaneDesigner/lithophaneDesignService.js'
import { toCartResponse } from '../src/modules/cart/cartController.js'
import { serializeOrder } from '../src/modules/orders/orderService.js'
import { validateBinaryStl, computeSignedVolumeCm3 } from '../src/modules/customizer/stlValidator.js'

function makeValidLithophaneInput(overrides = {}) {
  return {
    templateId: 'cylinder',
    title: 'Family Memories Cylindrical Lamp',
    photoKeys: [
      {
        slotIndex: 0,
        photoKey: 'photo-lamp-photos/user_123/a8f9c2d4e6b8a1c3.jpg',
        sha256: 'a8f9c2d4e6b8a1c3a8f9c2d4e6b8a1c3a8f9c2d4e6b8a1c3a8f9c2d4e6b8a1c3',
        width: 1200,
        height: 1600,
        crop: { x: 0, y: 0, width: 1200, height: 1600 },
        adjustments: { brightness: 5, contrast: 10, gamma: 1.1, sharpness: 15, invert: false },
      },
    ],
    designConfig: {
      dimensions: {
        diameterMm: 90,
        heightMm: 120,
        minThicknessMm: 0.8,
        maxThicknessMm: 3.2,
      },
      base: {
        type: 'printed',
        profile: 'circular',
        fitToleranceMm: 0.4,
      },
      lighting: {
        puckType: 'warm_white',
      },
      personalization: {
        engravedText: 'Together Forever',
        font: 'Cinzel',
      },
      packaging: {
        premiumGiftBox: true,
      },
    },
    ...overrides,
  }
}

describe('Lithophane Photo Lamp Customizer Core Suite', () => {
  it('buildPublicOptions returns all 9 archetypes, pricing, lighting, and base options', () => {
    const opts = buildPublicOptions()
    assert.equal(opts.templates.length, 9)
    assert.ok(opts.templates.some((t) => t.id === 'cylinder' && t.basePriceCents === 79900))
    assert.ok(opts.templates.some((t) => t.id === 'rectangle' && t.basePriceCents === 69900))
    assert.ok(opts.templates.some((t) => t.id === 'prism_4' && t.basePriceCents === 99900 && t.photoCount === 4))
    assert.ok(opts.templates.some((t) => t.id === 'heart' && t.basePriceCents === 84900))
    assert.ok(opts.templates.some((t) => t.id === 'curved' && t.basePriceCents === 74900))
    assert.ok(opts.templates.some((t) => t.id === 'moon' && t.basePriceCents === 109900))
    assert.ok(opts.templates.some((t) => t.id === 'lantern_6' && t.basePriceCents === 129900 && t.photoCount === 6))
    assert.ok(opts.templates.some((t) => t.id === 'medallion' && t.basePriceCents === 59900))
    assert.ok(opts.templates.some((t) => t.id === 'carousel_3' && t.basePriceCents === 139900 && t.photoCount === 3))

    assert.equal(opts.pricing.pricePerCm3Cents, 120)
    assert.equal(opts.pricing.addOns.ledPuckWarmWhiteCents, 15000)
    assert.equal(opts.pricing.addOns.ledPuckRgbRemoteCents, 25000)
    assert.equal(opts.pricing.addOns.woodenBaseSurchargeCents, 25000)
    assert.equal(opts.pricing.addOns.baseEngravingSurchargeCents, 10000)
    assert.equal(opts.pricing.addOns.premiumGiftBoxCents, 7500)

    assert.equal(opts.constraints.minThicknessMm, 0.8)
    assert.equal(opts.constraints.maxThicknessMm, 4.0)
    assert.ok(opts.lightingOptions.some((l) => l.id === 'warm_white'))
    assert.ok(opts.lightingOptions.some((l) => l.id === 'rgb_remote'))
    assert.ok(opts.baseOptions.some((b) => b.id === 'printed'))
    assert.ok(opts.baseOptions.some((b) => b.id === 'wooden'))
  })

  it('priceForLithophane calculates base + volumetric cm³ + add-ons correctly', () => {
    // 1. Cylinder base (79900 cents) + 70 cm³ volume (70 * 120 = 8400 cents) => 88300 cents (₹883)
    const p1 = priceForLithophane('cylinder', 70, { lighting: { puckType: 'none' } })
    assert.equal(p1, 88300)

    // 2. Add Warm White LED puck (+15000 cents)
    const p2 = priceForLithophane('cylinder', 70, { lighting: { puckType: 'warm_white' } })
    assert.equal(p2, 88300 + 15000)

    // 3. Add RGB Remote LED puck (+25000 cents)
    const p3 = priceForLithophane('cylinder', 70, { lighting: { puckType: 'rgb_remote' } })
    assert.equal(p3, 88300 + 25000)

    // 4. Add Wooden base (+25000 cents)
    const p4 = priceForLithophane('cylinder', 70, {
      lighting: { puckType: 'warm_white' },
      base: { type: 'wooden' },
    })
    assert.equal(p4, 88300 + 15000 + 25000)

    // 5. Add Base text engraving (+10000 cents)
    const p5 = priceForLithophane('cylinder', 70, {
      lighting: { puckType: 'warm_white' },
      base: { type: 'wooden' },
      personalization: { engravedText: 'Happy Anniversary' },
    })
    assert.equal(p5, 88300 + 15000 + 25000 + 10000)

    // 6. Add Premium Gift Box (+7500 cents)
    const p6 = priceForLithophane('cylinder', 70, {
      lighting: { puckType: 'warm_white' },
      base: { type: 'wooden' },
      personalization: { engravedText: 'Happy Anniversary' },
      packaging: { premiumGiftBox: true },
    })
    assert.equal(p6, 88300 + 15000 + 25000 + 10000 + 7500)
  })

  it('priceForLithophane respects custom admin pricing overrides', () => {
    const customConfig = {
      pricePerCm3Cents: 150, // ₹1.50 / cm³
      templates: {
        cylinder: { basePriceCents: 89900 },
      },
      addOns: {
        ledPuckWarmWhiteCents: 18000,
        woodenBaseSurchargeCents: 30000,
      },
    }

    const price = priceForLithophane(
      'cylinder',
      60,
      {
        lighting: { puckType: 'warm_white' },
        base: { type: 'wooden' },
      },
      customConfig
    )

    // 89900 + (60 * 150 = 9000) + 18000 + 30000 = 146900 cents
    assert.equal(price, 146900)
  })

  it('validateLithophaneDesignInput succeeds on valid canonical payload', () => {
    const input = makeValidLithophaneInput()
    const result = validateLithophaneDesignInput(input)

    assert.equal(result.title, 'Family Memories Cylindrical Lamp')
    assert.equal(result.templateId, 'cylinder')
    assert.equal(result.photoKeys.length, 1)
    assert.equal(result.photoKeys[0].photoKey, 'photo-lamp-photos/user_123/a8f9c2d4e6b8a1c3.jpg')
    assert.equal(result.designConfig.dimensions.diameterMm, 90)
    assert.equal(result.designConfig.lighting.puckType, 'warm_white')
    assert.ok(typeof result.paramsHash === 'string' && result.paramsHash.length === 64)
  })

  it('validateLithophaneDesignInput rejects invalid templateId', () => {
    assert.throws(
      () => validateLithophaneDesignInput(makeValidLithophaneInput({ templateId: 'unknown_spaceship' })),
      /Invalid templateId/
    )
  })

  it('validateLithophaneDesignInput rejects empty photoKeys', () => {
    assert.throws(
      () => validateLithophaneDesignInput(makeValidLithophaneInput({ photoKeys: [] })),
      /At least one uploaded photo is required/
    )
  })

  it('validateLithophaneDesignInput rejects excess photos for template slot count', () => {
    // Cylinder supports 1 photo; sending 2 must throw
    const twoPhotos = [
      { slotIndex: 0, photoKey: 'photo-lamp-photos/user_123/p1.jpg' },
      { slotIndex: 1, photoKey: 'photo-lamp-photos/user_123/p2.jpg' },
    ]
    assert.throws(
      () => validateLithophaneDesignInput(makeValidLithophaneInput({ photoKeys: twoPhotos })),
      /supports at most 1 photo/
    )
  })

  it('validateLithophaneDesignInput rejects unsafe photoKey paths', () => {
    const maliciousPhoto = [
      { slotIndex: 0, photoKey: '../../etc/passwd' },
    ]
    assert.throws(
      () => validateLithophaneDesignInput(makeValidLithophaneInput({ photoKeys: maliciousPhoto })),
      /Invalid or missing storage photoKey/
    )
  })

  it('storePhoto sanitizes image, strips EXIF and outputs progressive JPEG', async () => {
    // Create a 200x200 test PNG image buffer using sharp
    const testBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 100, b: 50 },
      },
    })
      .png()
      .toBuffer()

    const result = await storePhoto('test_user_42', testBuffer)

    assert.ok(result.photoKey.startsWith('photo-lamp-photos/test_user_42/'))
    assert.ok(result.photoKey.endsWith('.jpg'))
    assert.equal(result.width, 200)
    assert.equal(result.height, 200)
    assert.equal(result.format, 'jpeg')
    assert.ok(result.sizeBytes > 0)
    assert.equal(typeof result.sha256, 'string')
    assert.equal(result.sha256.length, 64)
  })

  it('storePhoto rejects corrupted or non-image buffers', async () => {
    const garbage = Buffer.from('NOT_AN_IMAGE_RANDOM_TEXT_BYTES')
    await assert.rejects(
      () => storePhoto('test_user_42', garbage),
      /Failed to decode image/
    )
  })

  it('toPublicLithophaneDesign serializes for customer vs admin cleanly', () => {
    const mockDesign = {
      id: 'litho_123',
      title: 'Moon Lamp',
      templateId: 'moon',
      status: 'READY',
      photoKeys: [{ slotIndex: 0, photoKey: 'photo-lamp-photos/u/1.jpg' }],
      designConfig: { dimensions: { diameterMm: 90 } },
      unitPriceCents: 109900,
      solidVolumeCm3: 88.5,
      previewKey: 'photo-lamp-designs/u/123/preview.png',
      stlKey: 'photo-lamp-designs/u/123/panel.stl',
      stlSha256: 'abc123sha',
      stlSizeBytes: 1024000,
      triangleCount: 7200,
      bboxMm: { min: [0, 0, 0], max: [90, 90, 90] },
      baseStlKey: 'photo-lamp-designs/u/123/base.stl',
      baseStlSha256: 'base123sha',
      baseStlSizeBytes: 512000,
      baseTriangleCount: 3600,
      baseBboxMm: { min: [0, 0, 0], max: [90, 20, 90] },
      createdAt: new Date(),
    }

    const customerView = toPublicLithophaneDesign(mockDesign)
    assert.equal(customerView.id, 'litho_123')
    assert.equal(customerView.hasStl, true)
    assert.equal(customerView.hasBaseStl, true)
    assert.equal(customerView.hasPreview, true)
    assert.equal(customerView.stl, undefined) // Sensitive path hidden from customer

    const adminView = toPublicLithophaneDesign(mockDesign, { admin: true })
    assert.equal(adminView.stl.triangleCount, 7200)
    assert.equal(adminView.stl.sha256, 'abc123sha')
    assert.equal(adminView.baseStl.triangleCount, 3600)
    assert.equal(adminView.baseStl.sha256, 'base123sha')
  })

  it('toCartResponse serializes Lithophane design items in cart', () => {
    const mockCart = {
      id: 'cart_1',
      items: [
        {
          id: 'item_1',
          itemType: 'LITHOPHANE_DESIGN',
          productId: null,
          quantity: 2,
          unitPriceCents: 114900,
          customization: { note: 'Deliver before Friday' },
          product: null,
          customDesign: null,
          standDesign: null,
          nameplateDesign: null,
          qrStandDesign: null,
          lithophaneDesign: {
            id: 'litho_99',
            title: 'Heart Lamp',
            templateId: 'heart',
            status: 'READY',
            unitPriceCents: 114900,
            photoKeys: [],
            designConfig: {},
            stlKey: 'stl.key',
            createdAt: new Date(),
          },
        },
      ],
    }

    const res = toCartResponse(mockCart)
    assert.equal(res.items.length, 1)
    assert.equal(res.items[0].itemType, 'LITHOPHANE_DESIGN')
    assert.equal(res.items[0].lithophane.id, 'litho_99')
    assert.equal(res.items[0].lineTotalCents, 229800)
    assert.equal(res.subtotalCents, 229800)
  })

  it('serializeOrder exposes Lithophane design details for order tracking', () => {
    const mockOrder = {
      id: 'ord_1',
      orderNumber: 'JAS-2026-9999',
      items: [
        {
          id: 'ord_item_1',
          itemType: 'LITHOPHANE_DESIGN',
          lithophaneDesignId: 'litho_99',
          productName: 'Heart Lamp',
          quantity: 1,
          unitPriceCents: 114900,
          lithophaneDesign: {
            id: 'litho_99',
            title: 'Heart Lamp',
            templateId: 'heart',
            status: 'READY',
            unitPriceCents: 114900,
            stlKey: 'key.stl',
            stlSha256: 'sha999',
            stlSizeBytes: 800000,
            triangleCount: 8880,
            createdAt: new Date(),
          },
        },
      ],
    }

    const serializedCustomer = serializeOrder(mockOrder, { admin: false })
    assert.equal(serializedCustomer.items[0].lithophane.id, 'litho_99')
    assert.equal(serializedCustomer.items[0].lithophane.stl, undefined)

    const serializedAdmin = serializeOrder(mockOrder, { admin: true })
    assert.equal(serializedAdmin.items[0].lithophane.stl.triangleCount, 8880)
    assert.equal(serializedAdmin.items[0].lithophane.stl.sha256, 'sha999')
  })

  it('validateBinaryStl and computeSignedVolumeCm3 validate watertight models', () => {
    // Construct a minimal valid 12-triangle cube binary STL (10x10x10 mm = 1.0 cm³)
    const triangleCount = 12
    const buffer = Buffer.alloc(84 + 50 * triangleCount)
    // 80 bytes header (zeros)
    buffer.writeUInt32LE(triangleCount, 80)

    const vertices = [
      // Front (Z = 10)
      [0, 0, 10], [10, 0, 10], [10, 10, 10],
      [0, 0, 10], [10, 10, 10], [0, 10, 10],
      // Back (Z = 0)
      [0, 0, 0], [10, 10, 0], [10, 0, 0],
      [0, 0, 0], [0, 10, 0], [10, 10, 0],
      // Left (X = 0)
      [0, 0, 0], [0, 0, 10], [0, 10, 10],
      [0, 0, 0], [0, 10, 10], [0, 10, 0],
      // Right (X = 10)
      [10, 0, 0], [10, 10, 10], [10, 0, 10],
      [10, 0, 0], [10, 10, 0], [10, 10, 10],
      // Top (Y = 10)
      [0, 10, 0], [0, 10, 10], [10, 10, 10],
      [0, 10, 0], [10, 10, 10], [10, 10, 0],
      // Bottom (Y = 0)
      [0, 0, 0], [10, 0, 10], [0, 0, 10],
      [0, 0, 0], [10, 0, 0], [10, 0, 10],
    ]

    for (let t = 0; t < triangleCount; t++) {
      const offset = 84 + t * 50
      // Normal (0,0,0)
      buffer.writeFloatLE(0, offset)
      buffer.writeFloatLE(0, offset + 4)
      buffer.writeFloatLE(0, offset + 8)
      // 3 vertices
      for (let v = 0; v < 3; v++) {
        const [x, y, z] = vertices[t * 3 + v]
        buffer.writeFloatLE(x, offset + 12 + v * 12)
        buffer.writeFloatLE(y, offset + 12 + v * 12 + 4)
        buffer.writeFloatLE(z, offset + 12 + v * 12 + 8)
      }
      // Attribute byte count (0)
      buffer.writeUInt16LE(0, offset + 48)
    }

    const meta = validateBinaryStl(buffer)
    assert.equal(meta.triangleCount, 12)
    assert.equal(meta.bboxMm.size[0], 10)
    assert.equal(meta.bboxMm.size[1], 10)
    assert.equal(meta.bboxMm.size[2], 10)

    const volume = computeSignedVolumeCm3(buffer)
    assert.ok(Math.abs(volume - 1.0) < 0.001) // Exactly 1.0 cm³
  })
})
