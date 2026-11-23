import { HttpError } from '../../utils/httpError.js'
import { buildPublicOptions } from './qrStandDesignOptions.js'
import {
  createQrStandDesign,
  getOwnedQrStandDesign,
  readPreview,
  storePreview,
  storeStl,
  toPublicQrStandDesign,
} from './qrStandDesignService.js'

export async function getOptions(req, res) {
  let pricingConfig = null
  try {
    const { getQrStandPricingConfig } = await import('../settings/settingsService.js')
    if (typeof getQrStandPricingConfig === 'function') {
      pricingConfig = await getQrStandPricingConfig()
    }
  } catch {
    pricingConfig = null
  }

  res.json({ options: buildPublicOptions(pricingConfig) })
}

export async function create(req, res) {
  const { design, created } = await createQrStandDesign(req.user.id, req.body)
  res.status(created ? 201 : 200).json({ design: toPublicQrStandDesign(design) })
}

export async function getById(req, res) {
  const design = await getOwnedQrStandDesign(req.user.id, req.params.id)
  res.json({ design: toPublicQrStandDesign(design) })
}

export async function uploadStl(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'A binary STL file body is required.')
  }
  const claimedSha256 = req.get('x-stl-sha256') || req.get('x-content-sha256')
  const design = await storeStl(req.user.id, req.params.id, req.body, claimedSha256)
  res.json({ design: toPublicQrStandDesign(design) })
}

export async function uploadPreview(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'A PNG preview body is required.')
  }
  const design = await storePreview(req.user.id, req.params.id, req.body)
  res.json({ design: toPublicQrStandDesign(design) })
}

export async function getPreview(req, res) {
  const design = await getOwnedQrStandDesign(req.user.id, req.params.id)
  const buffer = await readPreview(design)
  res
    .set({
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    })
    .send(buffer)
}
