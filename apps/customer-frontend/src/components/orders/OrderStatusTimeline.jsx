// The normal happy-path progression. CANCELLED/REFUNDED aren't steps on
// this line — they're terminal outcomes shown separately — since an order
// doesn't "pass through" cancelled on its way to delivered.
const HAPPY_PATH = [
  { status: 'PENDING', label: 'Order placed' },
  { status: 'PAID', label: 'Payment confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
]

export default function OrderStatusTimeline({ status }) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="rounded-card border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        This order was {status === 'CANCELLED' ? 'cancelled' : 'refunded'}.
      </div>
    )
  }

  const currentIndex = HAPPY_PATH.findIndex((step) => step.status === status)

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {HAPPY_PATH.map((step, index) => {
        const reached = index <= currentIndex
        const isLast = index === HAPPY_PATH.length - 1
        return (
          <li key={step.status} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
            <div className="flex items-center sm:w-full">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  reached ? 'bg-ink text-paper' : 'border border-border bg-surface text-muted'
                }`}
              >
                {reached ? '✓' : index + 1}
              </span>
              {!isLast && <span className={`hidden h-0.5 flex-1 sm:block ${index < currentIndex ? 'bg-ink' : 'bg-border'}`} />}
            </div>
            <span className={`text-xs font-medium ${reached ? 'text-ink' : 'text-muted'}`}>{step.label}</span>
            {!isLast && <span className={`ml-3 h-6 w-0.5 sm:hidden ${index < currentIndex ? 'bg-ink' : 'bg-border'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
