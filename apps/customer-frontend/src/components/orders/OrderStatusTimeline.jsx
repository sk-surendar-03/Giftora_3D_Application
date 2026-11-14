const HAPPY_PATH = [
  { status: 'PENDING', label: 'Order placed' },
  { status: 'PAID', label: 'Payment confirmed' },
  { status: 'PROCESSING', label: 'Manufacturing' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
]

export default function OrderStatusTimeline({ status }) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="rounded-card border border-danger/40 bg-[#fbe6e2] p-4 text-[13.5px] font-semibold text-danger">
        This order was {status === 'CANCELLED' ? 'cancelled' : 'refunded'}.
      </div>
    )
  }

  const currentIndex = HAPPY_PATH.findIndex((step) => step.status === status)

  return (
    <ol className="flex flex-col gap-0 min-[761px]:flex-row min-[761px]:items-start list-none p-0 m-0">
      {HAPPY_PATH.map((step, index) => {
        const reached = index <= currentIndex
        const isLast = index === HAPPY_PATH.length - 1
        return (
          <li key={step.status} className="flex flex-1 items-start gap-3 min-[761px]:flex-col min-[761px]:items-center min-[761px]:gap-2 min-[761px]:text-center">
            <div className="flex items-center min-[761px]:w-full">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  reached ? 'bg-accent text-on-accent font-bold' : 'border border-line bg-surface text-muted'
                }`}
              >
                {reached ? '✓' : index + 1}
              </span>
              {!isLast && <span className={`hidden h-[2px] flex-1 min-[761px]:block ${index < currentIndex ? 'bg-accent' : 'bg-line'}`} />}
            </div>
            <span className={`text-[12.5px] font-medium ${reached ? 'text-ink font-semibold' : 'text-muted'}`}>{step.label}</span>
            {!isLast && <span className={`ml-3.5 h-6 w-[2px] min-[761px]:hidden ${index < currentIndex ? 'bg-accent' : 'bg-line'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
