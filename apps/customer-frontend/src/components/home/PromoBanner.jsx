import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function PromoBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="flex flex-col items-start gap-6 rounded-card bg-ink px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <h2 className="font-display text-2xl font-semibold text-paper sm:text-3xl">
            Good for birthdays, good for everyday
          </h2>
          <p className="mt-2 max-w-md text-sm text-paper/70">
            A personalised keychain is a small gift with a lot of thought behind it —
            for someone else, or for yourself.
          </p>
        </div>
        <Link to="/products" className="shrink-0">
          <Button variant="accent" size="lg">
            Start Designing
          </Button>
        </Link>
      </div>
    </section>
  )
}
