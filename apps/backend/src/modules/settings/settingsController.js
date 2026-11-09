import { HttpError } from '../../utils/httpError.js'
import {
  getPricingConfig,
  updatePricingConfig,
  getAnnouncementConfig,
  updateAnnouncementConfig,
} from './settingsService.js'

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

export async function getAnnouncement(req, res) {
  res.json({ announcement: await getAnnouncementConfig() })
}

export async function updateAnnouncement(req, res) {
  const { text, enabled } = req.body ?? {}
  if (text !== undefined && typeof text !== 'string') {
    throw new HttpError(400, 'text must be a string.')
  }
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    throw new HttpError(400, 'enabled must be a boolean.')
  }
  const announcement = await updateAnnouncementConfig({ text, enabled })
  res.json({ announcement })
}
