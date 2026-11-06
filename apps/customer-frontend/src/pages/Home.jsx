import useProducts from '../features/products/useProducts'
import Hero from '../components/home/Hero'
import ProductSection from '../components/product/ProductSection'
import ProductGridSkeleton from '../components/product/ProductGridSkeleton'
import HowItWorks from '../components/home/HowItWorks'
import TrustBar from '../components/home/TrustBar'
import PromoBanner from '../components/home/PromoBanner'

export default function Home() {
  const { data: products, isLoading, error } = useProducts()
  const hasProducts = !isLoading && !error && products.length > 0

  return (
    <div className="bg-bg text-ink">
      <Hero />
      <TrustBar />

      {isLoading && (
        <section className="mx-auto max-w-[1200px] px-10 py-16">
          <ProductGridSkeleton count={4} />
        </section>
      )}

      {!isLoading && error && (
        <section className="mx-auto max-w-[1200px] px-10 py-16 text-center text-[15px] text-muted">
          Couldn't load products right now. Please refresh the page.
        </section>
      )}

      {hasProducts && (
        <ProductSection
          eyebrow="Most loved"
          title="Best-selling gifts"
          subtitle="Chosen by customers, each one personalised and manufactured to order."
          products={products}
          className="bg-alt border-b border-line"
        />
      )}

      <PromoBanner />
      <HowItWorks />

      {/* Customer reviews section */}
      <section className="py-21 max-[1040px]:py-16 max-[760px]:py-12 bg-bg border-b border-line">
        <div className="mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px]">
          <div className="mb-9 max-[760px]:mb-6">
            <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
              Reviews
            </span>
            <h2 className="font-display text-[38px] max-[760px]:text-[28px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-3">
              Crafted for moments that matter
            </h2>
          </div>

          <div className="grid grid-cols-1 min-[761px]:grid-cols-3 gap-6">
            {[
              {
                text: "The 3D preview was completely true to scale. When the keychain arrived, the dual-colour layers were razor sharp. Outstanding engineering.",
                name: "Rohan Verma",
                city: "Bengaluru",
                initials: "RV"
              },
              {
                text: "Ordered bespoke nameplates for our team. The finish is solid and premium, not like flimsy consumer 3D prints. Dispatched in 3 days as promised.",
                name: "Pooja Sharma",
                city: "Mumbai",
                initials: "PS"
              },
              {
                text: "Being able to rotate the live 3D model gave me total confidence before ordering. Excellent quality and thoughtful gift packaging.",
                name: "Arjun Nair",
                city: "Delhi",
                initials: "AN"
              }
            ].map((rv, idx) => (
              <div key={idx} className="rounded-card border border-line bg-surface p-7 flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-accent mb-3.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-accent" viewBox="0 0 24 24">
                        <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" stroke="none" />
                      </svg>
                    ))}
                  </div>
                  <p className="font-sans text-[15px] leading-relaxed text-ink/90">
                    "{rv.text}"
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-line/60">
                  <div className="h-10 w-10 rounded-full bg-soft text-accent font-bold text-[13px] flex items-center justify-center">
                    {rv.initials}
                  </div>
                  <div>
                    <div className="font-sans text-[14px] font-semibold text-ink">{rv.name}</div>
                    <div className="font-sans text-[12.5px] text-muted">{rv.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
