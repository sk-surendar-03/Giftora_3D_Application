import { Link } from 'react-router-dom'

const categories = [
  {
    label: 'Wooden Keychains',
    description: 'Warm, engraved name keychains.',
    icon: (
      <path d="M8 2v6M8 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    ),
  },
  {
    label: 'Acrylic Nameplates',
    description: 'Sleek plates for desks and doors.',
    icon: (
      <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    ),
  },
  {
    label: 'Metal Keychains',
    description: 'Durable, laser-engraved steel.',
    icon: (
      <>
        <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M11.5 10.5 19 18m0 0v-4m0 4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
]

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-8 max-w-xl">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Shop by category</h2>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Every piece starts as a blank canvas — choose a style, then make it yours.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.label}
            to="/products"
            className="group flex items-start gap-4 rounded-card border border-border bg-surface p-5 transition-shadow hover:shadow-card"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-dark">
              <svg width="20" height="20" viewBox="0 0 24 24">
                {category.icon}
              </svg>
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink group-hover:text-accent-dark">
                {category.label}
              </span>
              <span className="mt-1 block text-sm text-muted">{category.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
