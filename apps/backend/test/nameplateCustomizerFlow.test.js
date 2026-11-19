import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  priceForNameplate,
  buildPublicOptions,
  DEFAULT_NAMEPLATE_CONFIG,
} from '../src/modules/nameplateDesigner/nameplateDesignOptions.js'
import { validateNameplateDesignInput } from '../src/modules/nameplateDesigner/nameplateDesignValidator.js'
import { toPublicNameplateDesign, readPreview } from '../src/modules/nameplateDesigner/nameplateDesignService.js'
import { toCartResponse } from '../src/modules/cart/cartController.js'
import { serializeOrder } from '../src/modules/orders/orderService.js'
import { getStorage } from '../src/modules/storage/storage.js'

describe('Nameplate Customizer Core Suite', () => {
  it('buildPublicOptions returns 10 types and valid parameters', () => {
    const opts = buildPublicOptions()
    assert.equal(opts.schemaVersion, 1)
    assert.equal(opts.types.length, 10)
    assert.ok(opts.types.some((t) => t.id === 'desk' && t.basePriceCents === 55000))
    assert.ok(opts.types.some((t) => t.id === 'door' && t.basePriceCents === 65000))
    assert.ok(opts.types.some((t) => t.id === 'led' && t.basePriceCents === 95000))
    assert.equal(opts.pricePerCm3Cents, 120)
    assert.equal(opts.ledGlowSurchargeCents, 15000)
    assert.equal(opts.layeredBackingSurchargeCents, 10000)
    assert.ok(opts.shapes.includes('rectangle'))
    assert.ok(opts.shapes.includes('rounded-rectangle'))
    assert.ok(opts.shapes.includes('arch'))
  })

  it('priceForNameplate calculates base + volumetric cm³ + feature surcharges correctly', () => {
    // 100 cm³ volume on 'desk' (base: 55000, 100 * 120 = 12000 => 67000 cents = ₹670)
    const p1 = priceForNameplate('desk', 100, { ledGlowEnabled: false, mountingStyle: 'freestanding-desk' })
    assert.equal(p1, 67000)

    // With LED glow (+15000)
    const p2 = priceForNameplate('desk', 100, { ledGlowEnabled: true, mountingStyle: 'freestanding-desk' })
    assert.equal(p2, 82000)

    // With layered-background (+10000)
    const p3 = priceForNameplate('desk', 100, { ledGlowEnabled: false, mountingStyle: 'layered-background' })
    assert.equal(p3, 77000)

    // With both LED glow and layered-background
    const p4 = priceForNameplate('desk', 100, { ledGlowEnabled: true, mountingStyle: 'layered-background' })
    assert.equal(p4, 92000)
  })

  it('validateNameplateDesignInput validates input and generates deterministic paramsHash', () => {
    const input1 = {
      nameplateType: 'desk',
      shape: 'rounded-rectangle',
      mountingStyle: 'freestanding-desk',
      designConfig: {
        widthMm: 180,
        heightMm: 50,
        baseThicknessMm: 4,
        lines: [{ text: 'SURENDAR', fontId: 'cinzel', fontSize: 16 }],
      },
    }

    const { canonical, paramsHash, title } = validateNameplateDesignInput(input1)
    assert.equal(canonical.nameplateType, 'desk')
    assert.equal(canonical.shape, 'rounded-rectangle')
    assert.equal(canonical.dimensions.widthMm, 180)
    assert.equal(canonical.lines[0].text, 'SURENDAR')
    assert.equal(title, 'DESK NAMEPLATE: SURENDAR')
    assert.ok(typeof paramsHash === 'string' && paramsHash.length === 64)

    // Identical input with different key order yields identical paramsHash
    const input2 = {
      mountingStyle: 'freestanding-desk',
      nameplateType: 'desk',
      shape: 'rounded-rectangle',
      designConfig: {
        heightMm: 50,
        widthMm: 180,
        baseThicknessMm: 4,
        lines: [{ fontId: 'cinzel', text: 'SURENDAR', fontSize: 16 }],
      },
    }
    const { paramsHash: hash2 } = validateNameplateDesignInput(input2)
    assert.equal(paramsHash, hash2)
  })

  it('rejects invalid nameplate types or malicious parameters', () => {
    assert.throws(() => {
      validateNameplateDesignInput({ nameplateType: 'unsupported-type' })
    })
  })

  it('toPublicNameplateDesign hides private storage keys and reveals admin metadata properly', () => {
    const dbRecord = {
      id: 'np-123',
      userId: 'user-456',
      paramsHash: 'a'.repeat(64),
      nameplateType: 'desk',
      shape: 'rounded-rectangle',
      mountingStyle: 'freestanding-desk',
      title: 'DESK NAMEPLATE: SURENDAR',
      status: 'READY',
      schemaVersion: 1,
      designConfig: { widthMm: 180, heightMm: 50 },
      solidVolumeCm3: 45.2,
      unitPriceCents: 65000,
      previewKey: 'nameplate-designs/user-456/np-123/preview.png',
      stlKey: 'nameplate-designs/user-456/np-123/model.stl',
      stlSizeBytes: 524288,
      stlSha256: 'b'.repeat(64),
      triangleCount: 15000,
      bboxMm: { x: 180, y: 50, z: 12 },
      createdAt: new Date('2026-11-19T10:00:00Z'),
      updatedAt: new Date('2026-11-19T10:00:00Z'),
    }

    const customerView = toPublicNameplateDesign(dbRecord, { admin: false })
    assert.equal(customerView.id, 'np-123')
    assert.equal(customerView.title, 'DESK NAMEPLATE: SURENDAR')
    assert.equal(customerView.hasPreview, true)
    assert.equal(customerView.hasStl, true)
    assert.equal(customerView.unitPriceCents, 65000)
    assert.equal('previewKey' in customerView, false)
    assert.equal('stlKey' in customerView, false)
    assert.equal('schemaVersion' in customerView, false)
    assert.equal('solidVolumeCm3' in customerView, false)
    assert.equal('stl' in customerView, false)

    const adminView = toPublicNameplateDesign(dbRecord, { admin: true })
    assert.equal(adminView.schemaVersion, 1)
    assert.equal(adminView.solidVolumeCm3, 45.2)
    assert.deepEqual(adminView.stl, {
      sizeBytes: 524288,
      sha256: 'b'.repeat(64),
      triangleCount: 15000,
      bboxMm: { x: 180, y: 50, z: 12 },
    })
  })

  it('toCartResponse serializes a cart containing NAMEPLATE_DESIGN correctly', () => {
    const dummyCart = {
      id: 'cart-np-1',
      userId: 'user-789',
      items: [
        {
          id: 'item-np-1',
          itemType: 'NAMEPLATE_DESIGN',
          productId: null,
          quantity: 1,
          unitPriceCents: 65000,
          customization: { shippingMethod: { name: 'Standard Delivery', priceCents: 0 } },
          product: null,
          customDesign: null,
          standDesign: null,
          nameplateDesign: {
            id: 'np-999',
            title: 'LED NAMEPLATE: STUDIO',
            nameplateType: 'led',
            shape: 'rectangle',
            mountingStyle: 'wall-mount',
            status: 'READY',
            designConfig: { widthMm: 200, heightMm: 70 },
            unitPriceCents: 65000,
            previewKey: 'previews/np-999.png',
            stlKey: 'stls/np-999.stl',
          },
        },
      ],
    }

    const response = toCartResponse(dummyCart)
    assert.equal(response.items.length, 1)
    assert.equal(response.items[0].itemType, 'NAMEPLATE_DESIGN')
    assert.equal(response.items[0].nameplate.id, 'np-999')
    assert.equal(response.items[0].nameplate.hasPreview, true)
    assert.equal(response.items[0].nameplate.hasStl, true)
    assert.equal('previewKey' in response.items[0].nameplate, false)
    assert.equal('stlKey' in response.items[0].nameplate, false)
  })

  it('serializeOrder preserves nameplate summary in customer and admin views', () => {
    const dummyOrder = {
      id: 'order-np-1',
      orderNumber: 'ORD-2026-NP',
      totalCents: 65000,
      items: [
        {
          id: 'order-item-1',
          itemType: 'NAMEPLATE_DESIGN',
          productName: 'LED NAMEPLATE: STUDIO',
          quantity: 1,
          unitPriceCents: 65000,
          nameplateDesign: {
            id: 'np-999',
            title: 'LED NAMEPLATE: STUDIO',
            nameplateType: 'led',
            shape: 'rectangle',
            mountingStyle: 'wall-mount',
            status: 'READY',
            designConfig: { widthMm: 200, heightMm: 70 },
            unitPriceCents: 65000,
            previewKey: 'previews/np-999.png',
            stlKey: 'stls/np-999.stl',
            stlSizeBytes: 1024,
            stlSha256: 'c'.repeat(64),
            triangleCount: 500,
            bboxMm: { x: 200, y: 70, z: 15 },
          },
        },
      ],
    }

    const customerOrder = serializeOrder(dummyOrder, { admin: false })
    assert.ok(customerOrder.items[0].nameplate)
    assert.equal(customerOrder.items[0].nameplate.id, 'np-999')
    assert.equal('previewKey' in customerOrder.items[0].nameplate, false)

    const adminOrder = serializeOrder(dummyOrder, { admin: true })
    assert.ok(adminOrder.items[0].nameplate)
    assert.equal(adminOrder.items[0].nameplate.stl.sizeBytes, 1024)
  })

  it('readPreview retrieves image buffer from storage driver', async () => {
    const storage = getStorage()
    const testKey = 'test-previews/np-test.png'
    const testBuffer = Buffer.from('FAKE_PNG_DATA')
    await storage.put(testKey, testBuffer)

    const design = { previewKey: testKey }
    const retrieved = await readPreview(design)
    assert.ok(Buffer.isBuffer(retrieved))
    assert.equal(retrieved.toString(), 'FAKE_PNG_DATA')

    await assert.rejects(
      () => readPreview({ previewKey: null }),
      /No preview for this nameplate design/
    )
  })
})
