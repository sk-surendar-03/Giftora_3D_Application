const items = [
  {
    title: 'Free shipping',
    sub: 'Over ₹999 across India',
    icon: (
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7 M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    ),
  },
  {
    title: '3D preview',
    sub: 'True geometry before we print',
    icon: (
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3ZM12 12 4 7.5M12 12l8-4.5M12 12v9" />
    ),
  },
  {
    title: 'Secure checkout',
    sub: 'UPI, Cards & Netbanking',
    icon: (
      <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3ZM9 12l2 2 4-4" />
    ),
  },
  {
    title: 'Gift ready',
    sub: 'Packed with industrial precision',
    icon: (
      <path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8c-3 0-5-1-5-3s3-3 5 0c2-3 5-2 5 0s-2 3-5 3" />
    ),
  },
]

export default function TrustBar() {
  return (
    <section className="border-b border-line bg-surface py-6">
      <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px]">
        <div className="grid grid-cols-1 min-[761px]:grid-cols-2 min-[1041px]:grid-cols-4 gap-5">
          {items.map((item) => (
            <div key={item.title} className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soft text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
              </span>
              <div>
                <h4 className="font-sans text-[14px] font-semibold text-ink m-0 leading-tight">
                  {item.title}
                </h4>
                <p className="font-sans text-[13px] text-muted m-0 mt-0.5 leading-tight">
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
