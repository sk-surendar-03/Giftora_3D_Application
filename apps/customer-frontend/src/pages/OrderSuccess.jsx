import { useParams } from 'react-router-dom'
import PagePlaceholder from '../components/PagePlaceholder'

export default function OrderSuccess() {
  const { orderId } = useParams()
  return <PagePlaceholder title="Order Confirmed" description={`Thank you for your order #${orderId}.`} />
}
