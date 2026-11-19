import { HttpError } from '../../utils/httpError.js'
import {
  getPricingConfig,
  updatePricingConfig,
  getAnnouncementConfig,
  updateAnnouncementConfig,
  getCustomizerColors,
  updateCustomizerColors,
  getCustomizerShipping,
  updateCustomizerShipping,
  getCustomizerSizes,
  updateCustomizerSizes,
  getCustomizerThicknesses,
  updateCustomizerThicknesses,
  getStandPricingConfig,
  updateStandPricingConfig,
  getNameplatePricingConfig,
  updateNameplatePricingConfig,
} from './settingsService.js'

export async function getPricing(req, res) {
  res.json({ pricing: await getPricingConfig() })
}

export async function updatePricing(req, res) {
  const { perCharacterPriceCents, baseCharacters, basePriceCents } = req.body ?? {}
  if (perCharacterPriceCents !== undefined && (!Number.isInteger(perCharacterPriceCents) || perCharacterPriceCents < 0)) {
    throw new HttpError(400, 'perCharacterPriceCents must be a non-negative whole number.')
  }
  if (baseCharacters !== undefined && (!Number.isInteger(baseCharacters) || baseCharacters < 0)) {
    throw new HttpError(400, 'baseCharacters must be a non-negative whole number.')
  }
  if (basePriceCents !== undefined && (!Number.isInteger(basePriceCents) || basePriceCents < 0)) {
    throw new HttpError(400, 'basePriceCents must be a non-negative whole number.')
  }
  res.json({ pricing: await updatePricingConfig({ perCharacterPriceCents, baseCharacters, basePriceCents }) })
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

export async function getColors(req, res) {
  res.json(await getCustomizerColors())
}

export async function updateColors(req, res) {
  const { colors } = req.body ?? {}
  if (!Array.isArray(colors)) throw new HttpError(400, 'colors must be an array.')
  res.json(await updateCustomizerColors({ colors }))
}

export async function getShipping(req, res) {
  res.json(await getCustomizerShipping())
}

export async function updateShipping(req, res) {
  const { methods } = req.body ?? {}
  if (!Array.isArray(methods)) throw new HttpError(400, 'methods must be an array.')
  res.json(await updateCustomizerShipping({ methods }))
}

export async function getSizes(req, res) {
  res.json(await getCustomizerSizes())
}

export async function updateSizes(req, res) {
  const { sizes } = req.body ?? {}
  if (!Array.isArray(sizes)) throw new HttpError(400, 'sizes must be an array.')
  res.json(await updateCustomizerSizes({ sizes }))
}

export async function getThicknesses(req, res) {
  res.json(await getCustomizerThicknesses())
}

export async function updateThicknesses(req, res) {
  const { thicknesses } = req.body ?? {}
  if (!Array.isArray(thicknesses)) throw new HttpError(400, 'thicknesses must be an array.')
  res.json(await updateCustomizerThicknesses({ thicknesses }))
}

export async function getStandPricing(req, res) {
  res.json({ standPricing: await getStandPricingConfig() })
}

export async function updateStandPricing(req, res) {
  const { pricePerCm3Cents, categories } = req.body ?? {}
  if (pricePerCm3Cents !== undefined && (!Number.isInteger(pricePerCm3Cents) || pricePerCm3Cents < 0)) {
    throw new HttpError(400, 'pricePerCm3Cents must be a non-negative whole number.')
  }
  if (categories !== undefined && (typeof categories !== 'object' || categories === null || Array.isArray(categories))) {
    throw new HttpError(400, 'categories must be an object.')
  }
  res.json({ standPricing: await updateStandPricingConfig({ pricePerCm3Cents, categories }) })
}

export async function getNameplatePricing(req, res) {
  res.json({ nameplatePricing: await getNameplatePricingConfig() })
}

export async function updateNameplatePricing(req, res) {
  const { pricePerCm3Cents, ledGlowSurchargeCents, layeredBackingSurchargeCents, types } = req.body ?? {}
  if (pricePerCm3Cents !== undefined && (!Number.isInteger(pricePerCm3Cents) || pricePerCm3Cents < 0)) {
    throw new HttpError(400, 'pricePerCm3Cents must be a non-negative whole number.')
  }
  if (ledGlowSurchargeCents !== undefined && (!Number.isInteger(ledGlowSurchargeCents) || ledGlowSurchargeCents < 0)) {
    throw new HttpError(400, 'ledGlowSurchargeCents must be a non-negative whole number.')
  }
  if (layeredBackingSurchargeCents !== undefined && (!Number.isInteger(layeredBackingSurchargeCents) || layeredBackingSurchargeCents < 0)) {
    throw new HttpError(400, 'layeredBackingSurchargeCents must be a non-negative whole number.')
  }
  if (types !== undefined && (typeof types !== 'object' || types === null || Array.isArray(types))) {
    throw new HttpError(400, 'types must be an object.')
  }
  res.json({
    nameplatePricing: await updateNameplatePricingConfig({
      pricePerCm3Cents,
      ledGlowSurchargeCents,
      layeredBackingSurchargeCents,
      types,
    }),
  })
}
