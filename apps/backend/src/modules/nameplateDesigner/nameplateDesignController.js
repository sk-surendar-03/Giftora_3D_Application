import { HttpError } from '../../utils/httpError.js'
import { getNameplatePricingConfig } from '../settings/settingsService.js'
import { buildPublicOptions } from './nameplateDesignOptions.js'
import {
  createNameplateDesign,
  getOwnedNameplateDesign,
  readPreview,
  storePreview,
  storeStl,
  toPublicNameplateDesign,
} from './nameplateDesignService.js'

export async function getOptions(req, res) {
  const config = await getNameplatePricingConfig()
  res.json({ options: buildPublicOptions(config) })
}

export async function create(req, res) {
  const { design, created } = await createNameplateDesign(req.user.id, req.body)
  res.status(created ? 201 : 200).json({ design: toPublicNameplateDesign(design) })
}

export async function getById(req, res) {
  const design = await getOwnedNameplateDesign(req.user.id, req.params.id)
  res.json({ design: toPublicNameplateDesign(design) })
}

export async function uploadStl(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'An STL file body is required.')
  }
  const claimedSha256 = req.get('x-stl-sha256') || req.get('x-content-sha256')
  const design = await storeStl(req.user.id, req.params.id, req.body, claimedSha256)
  res.json({ design: toPublicNameplateDesign(design) })
}

export async function uploadPreview(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'A PNG preview body is required.')
  }
  const design = await storePreview(req.user.id, req.params.id, req.body)
  res.json({ design: toPublicNameplateDesign(design) })
}

export async function getPreview(req, res) {
  const design = await getOwnedNameplateDesign(req.user.id, req.params.id)
  const buffer = await readPreview(design)
  res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' }).send(buffer)
}
