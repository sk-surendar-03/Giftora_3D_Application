import useProducts from '../features/products/useProducts'
import Hero from '../components/home/Hero'
import CategoryGrid from '../components/home/CategoryGrid'
import ProductSection from '../components/product/ProductSection'
import ProductGridSkeleton from '../components/product/ProductGridSkeleton'
import HowItWorks from '../components/home/HowItWorks'
import TrustBar from '../components/home/TrustBar'
import PromoBanner from '../components/home/PromoBanner'

export default function Home() {
  const { data: products, isLoading, error } = useProducts()
  const hasProducts = !isLoading && !error && products.length > 0

  return (
    <div>
      <Hero heroProduct={hasProducts ? products[0] : undefined} />
      <CategoryGrid />

      {isLoading && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <ProductGridSkeleton count={3} />
        </section>
      )}

      {!isLoading && error && (
        <section className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted sm:px-6">
          Couldn't load products right now. Please refresh the page.
        </section>
      )}

      {hasProducts && (
        <ProductSection
          eyebrow="New in"
          title="Featured products"
          subtitle="A few favourites to start your design from."
          products={products}
        />
      )}

      <HowItWorks />

      {hasProducts && (
        <ProductSection
          eyebrow="Loved by customers"
          title="Best sellers"
          subtitle="The designs customers come back for."
          products={[...products].reverse()}
          className="border-t border-border"
        />
      )}

      <TrustBar />
      <PromoBanner />
    </div>
  )
}
