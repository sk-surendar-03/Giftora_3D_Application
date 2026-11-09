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
    </div>
  )
}
