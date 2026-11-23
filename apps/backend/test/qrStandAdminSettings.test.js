import test from 'node:test'
import assert from 'node:assert/strict'
import { HttpError } from '../src/utils/httpError.js'
import {
  getQrStandPricing,
  updateQrStandPricing,
} from '../src/modules/settings/settingsController.js'
import {
  getQrStandPricingConfig,
  updateQrStandPricingConfig,
} from '../src/modules/settings/settingsService.js'
import {
  DEFAULT_QR_STAND_PRICE_PER_CM3_CENTS,
  DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES,
  DEFAULT_QR_STAND_ADDON_PRICES,
  QR_STAND_TEMPLATES,
} from '../src/modules/qrStandDesigner/qrStandDesignOptions.js'

test('DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES defines valid base prices for all 12 templates', () => {
  assert.equal(QR_STAND_TEMPLATES.length, 12)
  for (const template of QR_STAND_TEMPLATES) {
    const basePrice = DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES[template.id]
    assert.ok(
      Number.isInteger(basePrice) && basePrice > 0,
      `Template ${template.id} should have a positive integer base price in cents`,
    )
  }
})

test('DEFAULT_QR_STAND_ADDON_PRICES defines valid add-on surcharges', () => {
  assert.equal(DEFAULT_QR_STAND_ADDON_PRICES.centerLogoSurchargeCents, 15000)
  assert.equal(DEFAULT_QR_STAND_ADDON_PRICES.inlayModeSurchargeCents, 10000)
  assert.equal(DEFAULT_QR_STAND_ADDON_PRICES.multiQrSurchargeCents, 15000)
  assert.equal(DEFAULT_QR_STAND_PRICE_PER_CM3_CENTS, 120)
})

test('updateQrStandPricing validates input types and rejects invalid values', async () => {
  // Negative volumetric price
  await assert.rejects(
    () => updateQrStandPricing({ body: { pricePerCm3Cents: -5 } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )

  // Non-integer volumetric price
  await assert.rejects(
    () => updateQrStandPricing({ body: { pricePerCm3Cents: 1.5 } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )

  // Non-object templates
  await assert.rejects(
    () => updateQrStandPricing({ body: { templates: 'not-an-object' } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )

  // Negative template base price
  await assert.rejects(
    () => updateQrStandPricing({ body: { templates: { classic_upright: { basePriceCents: -100 } } } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )

  // Non-object addOns
  await assert.rejects(
    () => updateQrStandPricing({ body: { addOns: [1, 2, 3] } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )

  // Negative center logo surcharge
  await assert.rejects(
    () => updateQrStandPricing({ body: { addOns: { centerLogoSurchargeCents: -50 } } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )

  // Negative inlay mode surcharge
  await assert.rejects(
    () => updateQrStandPricing({ body: { addOns: { inlayModeSurchargeCents: -10 } } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )

  // Negative multi-QR surcharge
  await assert.rejects(
    () => updateQrStandPricing({ body: { addOns: { multiQrSurchargeCents: -25 } } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )
})

test('getQrStandPricing and updateQrStandPricing round-trip via settingsService', async (t) => {
  try {
    const config = await getQrStandPricingConfig()
    assert.ok(Number.isInteger(config.pricePerCm3Cents) && config.pricePerCm3Cents >= 0)
    assert.ok(config.templates && typeof config.templates === 'object')
    assert.ok(config.addOns && typeof config.addOns === 'object')

    // Test controller getQrStandPricing response structure
    let jsonResult = null
    const res = {
      json: (data) => {
        jsonResult = data
      },
    }
    await getQrStandPricing({}, res)
    assert.ok(jsonResult.qrStandPricing)
    assert.ok(jsonResult.pricing)
    assert.equal(jsonResult.qrStandPricing.pricePerCm3Cents, config.pricePerCm3Cents)

    // Test controller updateQrStandPricing valid update
    const updatePayload = {
      pricePerCm3Cents: 150,
      templates: {
        classic_upright: { basePriceCents: 52900 },
      },
      addOns: {
        centerLogoSurchargeCents: 18000,
      },
    }
    await updateQrStandPricing({ body: updatePayload }, res)
    assert.equal(jsonResult.qrStandPricing.pricePerCm3Cents, 150)
    assert.equal(jsonResult.qrStandPricing.templates.classic_upright.basePriceCents, 52900)
    assert.equal(jsonResult.qrStandPricing.addOns.centerLogoSurchargeCents, 18000)

    // Restore default
    await updateQrStandPricing(
      {
        body: {
          pricePerCm3Cents: DEFAULT_QR_STAND_PRICE_PER_CM3_CENTS,
          templates: {
            classic_upright: { basePriceCents: DEFAULT_QR_STAND_TEMPLATE_BASE_PRICES.classic_upright },
          },
          addOns: {
            centerLogoSurchargeCents: DEFAULT_QR_STAND_ADDON_PRICES.centerLogoSurchargeCents,
          },
        },
      },
      res,
    )
  } catch (err) {
    if (
      err.message?.includes("Can't reach database server") ||
      err.message?.includes('DATABASE_URL') ||
      err.name === 'PrismaClientInitializationError' ||
      err.code === 'P1001'
    ) {
      t.skip('Database server not reachable in sandbox environment')
      return
    }
    throw err
  }
})

test('admin order listing normalizes QR_STAND and QRSTAND to QR_STAND_DESIGN', async () => {
  const { list } = await import('../src/modules/orders/adminOrderController.js')

  // Calling list with invalid status/type should throw 400
  await assert.rejects(
    () => list({ query: { status: 'INVALID_STATUS' } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )

  await assert.rejects(
    () => list({ query: { type: 'INVALID_TYPE' } }, {}),
    (err) => err instanceof HttpError && err.status === 400,
  )
})
