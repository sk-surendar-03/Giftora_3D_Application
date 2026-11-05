import { HttpError } from '../../utils/httpError.js'
import { getPricingConfig, updatePricingConfig } from './settingsService.js'

export async function getPricing(req, res) {
  res.json({ pricing: await getPricingConfig() })
}

export async function updatePricing(req, res) {
  const { perCharacterPriceCents } = req.body ?? {}
  if (!Number.isInteger(perCharacterPriceCents) || perCharacterPriceCents < 0) {
    throw new HttpError(400, 'perCharacterPriceCents must be a non-negative whole number of cents/paisa.')
  }
  res.json({ pricing: await updatePricingConfig({ perCharacterPriceCents }) })
}
