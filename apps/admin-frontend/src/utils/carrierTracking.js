export const CARRIER_PRESETS = [
  'Blue Dart',
  'Delhivery',
  'DTDC',
  'India Post',
  'FedEx',
  'DHL',
]

export function computeTrackingUrl(carrier, trackingNumber, customUrl) {
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    return customUrl.trim()
  }
  if (!carrier || !trackingNumber) return ''
  const trimmedNum = encodeURIComponent(String(trackingNumber).trim())
  const normalized = String(carrier).toLowerCase().replace(/[\s\-_]/g, '')
  if (normalized.includes('bluedart')) {
    return `https://www.bluedart.com/trackdartresult.html?trackFor=0&trackNo=${trimmedNum}`
  }
  if (normalized.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${trimmedNum}`
  }
  if (normalized.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?trckNo=${trimmedNum}`
  }
  if (normalized.includes('indiapost') || normalized.includes('speedpost')) {
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`
  }
  if (normalized.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${trimmedNum}`
  }
  if (normalized.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${trimmedNum}`
  }
  return ''
}
