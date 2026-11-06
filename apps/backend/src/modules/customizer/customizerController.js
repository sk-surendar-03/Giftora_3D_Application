import { HttpError } from '../../utils/httpError.js'
import { buildPublicOptions } from './designOptions.js'
import { createDesign, getOwnedDesign, readPreview, storePreview, storeStl, toPublicDesign } from './designService.js'

const SHA256_HEX = /^[a-fA-F0-9]{64}$/

export function getOptions(req, res) {
  res.json({ options: buildPublicOptions() })
}

export async function create(req, res) {
  const { design, created } = await createDesign(req.user.id, req.body)
  res.status(created ? 201 : 200).json({ design: toPublicDesign(design), needsStl: design.status !== 'READY' })
}

export async function getById(req, res) {
  res.json({ design: toPublicDesign(await getOwnedDesign(req.user.id, req.params.id)) })
}

export async function uploadStl(req, res) {
  if (!Buffer.isBuffer(req.body)) throw new HttpError(415, 'Send the STL with Content-Type: application/octet-stream.')
  const claimed = req.get('x-content-sha256')
  if (claimed !== undefined && !SHA256_HEX.test(claimed)) throw new HttpError(400, 'X-Content-SHA256 must be a 64-character hex SHA-256.')
  const design = await storeStl(req.user.id, req.params.id, req.body, claimed)
  res.json({ design: toPublicDesign(design) })
}

export async function uploadPreview(req, res) {
  if (!Buffer.isBuffer(req.body)) throw new HttpError(415, 'Send the preview with Content-Type: image/png.')
  const design = await storePreview(req.user.id, req.params.id, req.body)
  res.json({ design: toPublicDesign(design) })
}

export async function getPreview(req, res) {
  const design = await getOwnedDesign(req.user.id, req.params.id)
  const buffer = await readPreview(design)
  res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' }).send(buffer)
}
