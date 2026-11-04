import Badge from '../ui/Badge'

const STATUS_LABELS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

const STATUS_TONES = {
  PENDING: 'neutral',
  PAID: 'accent',
  PROCESSING: 'accent',
  SHIPPED: 'accent',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
}

export default function OrderStatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{STATUS_LABELS[status] ?? status}</Badge>
}
