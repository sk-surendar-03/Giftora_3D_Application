const items = [
  {
    title: 'Made to order',
    description: 'Every piece is produced only after you place your order.',
    icon: (
      <path d="M12 3v6m0 0 3-3m-3 3-3-3M5 12h14M7 16h2m-2 4h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    title: 'Quality materials',
    description: 'Wood, acrylic and steel finishes built to last.',
    icon: (
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    title: 'Nationwide shipping',
    description: 'Delivered to your door, wherever you are.',
    icon: (
      <path d="M3 7h11v9H3zm11 3h4l3 3v3h-7zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    title: 'Here to help',
    description: 'Reach our team with questions before or after you order.',
    icon: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
    ),
  },
]

export default function TrustBar() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-ink/5 text-ink">
              <svg width="20" height="20" viewBox="0 0 24 24">
                {item.icon}
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
