const steps = [
  {
    step: '01',
    title: 'Choose a product',
    description: 'Pick a keychain, nameplate or metal tag as your starting shape.',
  },
  {
    step: '02',
    title: 'Personalize in 3D',
    description: 'Add your name or text, pick a colour, and preview it rotating in real time.',
  },
  {
    step: '03',
    title: 'Review & order',
    description: 'Confirm your design, add it to your cart, and place your order.',
  },
  {
    step: '04',
    title: 'Made & shipped',
    description: 'Your piece is produced to your exact design and shipped to your door.',
  },
]

export default function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">How customization works</h2>
          <p className="mt-2 text-sm text-muted sm:text-base">
            From idea to doorstep, in four simple steps.
          </p>
        </div>
        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <li key={item.step}>
              <span className="font-display text-3xl font-semibold text-accent">{item.step}</span>
              <h3 className="mt-3 text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
