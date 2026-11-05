import api from '../../services/api'

// A read-only revalidation call — never creates anything (order creation is
// a later phase). Safe to call both to render the page and again right
// before a future "place order" action.
export async function reviewCheckout(addressId) {
  const { data } = await api.post('/checkout/review', { addressId })
  return data
}
