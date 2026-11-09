import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveTrackingUrl, SUPPORTED_CARRIERS } from '../src/modules/orders/carrierTracking.js'

test('resolveTrackingUrl generates proper tracking URL for Blue Dart', () => {
  const url = resolveTrackingUrl('Blue Dart', 'BD123456789')
  assert.equal(url, 'https://www.bluedart.com/trackdartresult.html?trackFor=0&trackNo=BD123456789')
})

test('resolveTrackingUrl generates proper tracking URL for Delhivery', () => {
  const url = resolveTrackingUrl('Delhivery', 'DLH987654321')
  assert.equal(url, 'https://www.delhivery.com/track/package/DLH987654321')
})

test('resolveTrackingUrl generates proper tracking URL for DTDC', () => {
  const url = resolveTrackingUrl('DTDC', 'D123456')
  assert.equal(url, 'https://www.dtdc.in/tracking/shipment-tracking.asp?trckNo=D123456')
})

test('resolveTrackingUrl generates proper tracking URL for India Post', () => {
  const url = resolveTrackingUrl('India Post', 'EM123456789IN')
  assert.equal(url, 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx')
})

test('resolveTrackingUrl generates proper tracking URL for FedEx', () => {
  const url = resolveTrackingUrl('FedEx', '123456789012')
  assert.equal(url, 'https://www.fedex.com/fedextrack/?trknbr=123456789012')
})

test('resolveTrackingUrl generates proper tracking URL for DHL', () => {
  const url = resolveTrackingUrl('DHL', '9876543210')
  assert.equal(url, 'https://www.dhl.com/en/express/tracking.html?AWB=9876543210')
})

test('resolveTrackingUrl uses customUrl when provided', () => {
  const custom = 'https://custom-carrier.example.com/track/ABC123'
  const url = resolveTrackingUrl('Custom Carrier', 'ABC123', custom)
  assert.equal(url, custom)
})

test('resolveTrackingUrl handles unknown carrier gracefully without customUrl', () => {
  const url = resolveTrackingUrl('Unknown Courier', '12345')
  assert.equal(url, null)
})
