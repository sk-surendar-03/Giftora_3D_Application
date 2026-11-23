import test from 'node:test'
import assert from 'node:assert/strict'
import { HttpError } from '../src/utils/httpError.js'
import {
  getPhotoLampPricing,
  updatePhotoLampPricing,
} from '../src/modules/settings/settingsController.js'
import {
  DEFAULT_LITHOPHANE_PRICE_PER_CM3_CENTS,
  DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES,
  DEFAULT_LITHOPHANE_ADDON_PRICES,
  LITHOPHANE_TEMPLATES,
} from '../src/modules/lithophaneDesigner/lithophaneDesignOptions.js'

test('DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES defines valid base prices for all 9 archetypes', () => {
  assert.equal(LITHOPHANE_TEMPLATES.length, 9)
  for (const template of LITHOPHANE_TEMPLATES) {
    const basePrice = DEFAULT_LITHOPHANE_TEMPLATE_BASE_PRICES[template.id]
    assert.ok(
      Number.isInteger(basePrice) && basePrice > 0,
      `Template ${template.id} should have a positive integer base price in cents`
    )
  }
})

test('DEFAULT_LITHOPHANE_ADDON_PRICES defines valid add-on surcharges', () => {
  assert.equal(DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckWarmWhiteCents, 15000)
  assert.equal(DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckCoolWhiteCents, 15000)
  assert.equal(DEFAULT_LITHOPHANE_ADDON_PRICES.ledPuckRgbRemoteCents, 25000)
  assert.equal(DEFAULT_LITHOPHANE_ADDON_PRICES.woodenBaseSurchargeCents, 25000)
  assert.equal(DEFAULT_LITHOPHANE_ADDON_PRICES.baseEngravingSurchargeCents, 10000)
  assert.equal(DEFAULT_LITHOPHANE_ADDON_PRICES.premiumGiftBoxCents, 7500)
  assert.equal(DEFAULT_LITHOPHANE_PRICE_PER_CM3_CENTS, 120)
})

test('updatePhotoLampPricing validates input types and rejects invalid values', async () => {
  // Negative volumetric price
  await assert.rejects(
    () => updatePhotoLampPricing({ body: { pricePerCm3Cents: -5 } }, {}),
    (err) => err instanceof HttpError && err.status === 400
  )

  // Non-integer volumetric price
  await assert.rejects(
    () => updatePhotoLampPricing({ body: { pricePerCm3Cents: 1.5 } }, {}),
    (err) => err instanceof HttpError && err.status === 400
  )

  // Non-object templates
  await assert.rejects(
    () => updatePhotoLampPricing({ body: { templates: 'not-an-object' } }, {}),
    (err) => err instanceof HttpError && err.status === 400
  )

  // Negative template base price
  await assert.rejects(
    () => updatePhotoLampPricing({ body: { templates: { cylinder: { basePriceCents: -100 } } } }, {}),
    (err) => err instanceof HttpError && err.status === 400
  )

  // Negative add-on surcharge
  await assert.rejects(
    () => updatePhotoLampPricing({ body: { addOns: { ledPuckWarmWhiteCents: -50 } } }, {}),
    (err) => err instanceof HttpError && err.status === 400
  )
})
