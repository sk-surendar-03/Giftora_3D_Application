import { HttpError } from '../../utils/httpError.js'
import { isNonEmptyString } from '../../utils/validation.js'
import { reviewCheckout } from './checkoutService.js'

export async function review(req, res) {
  const { addressId } = req.body ?? {}
  if (!isNonEmptyString(addressId, 50)) throw new HttpError(400, 'addressId is required.')

  const result = await reviewCheckout(req.user.id, addressId)
  res.json(result)
}
