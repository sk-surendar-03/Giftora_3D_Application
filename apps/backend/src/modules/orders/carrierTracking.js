export const SUPPORTED_CARRIERS = [
  'Blue Dart',
  'Delhivery',
  'DTDC',
  'India Post',
  'FedEx',
  'DHL',
  'Other',
]

/**
 * Computes official carrier tracking URL for supported carriers.
 * If customUrl is provided, validates and returns it.
 */
export function resolveTrackingUrl(carrier, trackingNumber, customUrl) {
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    return customUrl.trim()
  }

  if (!carrier || !trackingNumber) return null

  const trimmedNum = encodeURIComponent(String(trackingNumber).trim())
  const normalizedCarrier = String(carrier).toLowerCase().replace(/[\s\-_]/g, '')

  if (normalizedCarrier.includes('bluedart')) {
    return `https://www.bluedart.com/trackdartresult.html?trackFor=0&trackNo=${trimmedNum}`
  }
  if (normalizedCarrier.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${trimmedNum}`
  }
  if (normalizedCarrier.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?trckNo=${trimmedNum}`
  }
  if (normalizedCarrier.includes('indiapost') || normalizedCarrier.includes('speedpost')) {
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`
  }
  if (normalizedCarrier.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${trimmedNum}`
  }
  if (normalizedCarrier.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${trimmedNum}`
  }

  return null
}
