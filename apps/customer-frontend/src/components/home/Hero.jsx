import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function Hero({ heroProduct }) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium tracking-wide text-accent-dark uppercase">
            Designed by you, made to order
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink text-balance sm:text-5xl">
            Gifts made personal, shaped in 3D
          </h1>
          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
            Pick a keychain or nameplate, add your own name, text and colours in our
            live 3D studio, and we print it exactly how you designed it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {heroProduct && (
              <Link to={`/customise/${heroProduct.id}`}>
                <Button variant="accent" size="lg">
                  Customize Your Keychain
                </Button>
              </Link>
            )}
            <Link to="/products">
              <Button variant="secondary" size="lg">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <div className="absolute inset-6 rounded-full bg-accent-soft" />
          <svg
            viewBox="0 0 220 220"
            className="relative h-full w-full"
            role="img"
            aria-label="Illustration of a personalised keychain"
          >
            <rect x="70" y="30" width="80" height="80" rx="18" fill="#ffffff" stroke="#1a1712" strokeWidth="3" />
            <circle cx="110" cy="52" r="10" fill="none" stroke="#1a1712" strokeWidth="3" />
            <line x1="110" y1="62" x2="110" y2="110" stroke="#1a1712" strokeWidth="3" />
            <rect x="60" y="110" width="100" height="70" rx="14" fill="#a8763e" />
            <text
              x="110"
              y="152"
              textAnchor="middle"
              fontFamily="Fraunces, Georgia, serif"
              fontSize="26"
              fill="#fbf9f6"
            >
              Giftora
            </text>
          </svg>
        </div>
      </div>
    </section>
  )
}
