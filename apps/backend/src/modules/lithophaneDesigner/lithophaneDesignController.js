import { HttpError } from '../../utils/httpError.js'
import { buildPublicOptions } from './lithophaneDesignOptions.js'
import {
  createLithophaneDesign,
  getOwnedLithophaneDesign,
  readPhoto,
  readPreview,
  storeBaseStl,
  storePhoto,
  storePreview,
  storeStl,
  toPublicLithophaneDesign,
} from './lithophaneDesignService.js'

export async function getOptions(req, res) {
  let pricingConfig = null
  try {
    const { getPhotoLampPricingConfig } = await import('../settings/settingsService.js')
    if (typeof getPhotoLampPricingConfig === 'function') {
      pricingConfig = await getPhotoLampPricingConfig()
    }
  } catch {
    pricingConfig = null
  }

  res.json({ options: buildPublicOptions(pricingConfig) })
}

export async function create(req, res) {
  const { design, created } = await createLithophaneDesign(req.user.id, req.body)
  res.status(created ? 201 : 200).json({ design: toPublicLithophaneDesign(design) })
}

export async function getById(req, res) {
  const design = await getOwnedLithophaneDesign(req.user.id, req.params.id)
  res.json({ design: toPublicLithophaneDesign(design) })
}

export async function uploadPhoto(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'An image file body is required.')
  }
  const photo = await storePhoto(req.user.id, req.body)
  res.status(201).json({ photo })
}

export async function getPhoto(req, res) {
  const design = await getOwnedLithophaneDesign(req.user.id, req.params.id)
  const slotIndex = parseInt(req.params.slotIndex, 10) || 0
  const buffer = await readPhoto(design, slotIndex)
  res
    .set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    })
    .send(buffer)
}

export async function uploadStl(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'A binary STL file body is required.')
  }
  const claimedSha256 = req.get('x-stl-sha256') || req.get('x-content-sha256')
  const design = await storeStl(req.user.id, req.params.id, req.body, claimedSha256)
  res.json({ design: toPublicLithophaneDesign(design) })
}

export async function uploadBaseStl(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'A binary STL file body for the lamp base is required.')
  }
  const claimedSha256 = req.get('x-stl-sha256') || req.get('x-content-sha256')
  const design = await storeBaseStl(req.user.id, req.params.id, req.body, claimedSha256)
  res.json({ design: toPublicLithophaneDesign(design) })
}

export async function uploadPreview(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'A PNG preview body is required.')
  }
  const design = await storePreview(req.user.id, req.params.id, req.body)
  res.json({ design: toPublicLithophaneDesign(design) })
}

export async function getPreview(req, res) {
  const design = await getOwnedLithophaneDesign(req.user.id, req.params.id)
  const buffer = await readPreview(design)
  res
    .set({
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    })
    .send(buffer)
}
