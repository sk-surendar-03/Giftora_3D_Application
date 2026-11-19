import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  priceForNameplate,
  buildPublicOptions,
  DEFAULT_NAMEPLATE_CONFIG,
} from '../src/modules/nameplateDesigner/nameplateDesignOptions.js'
import { validateNameplateDesignInput } from '../src/modules/nameplateDesigner/nameplateDesignValidator.js'

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
})
