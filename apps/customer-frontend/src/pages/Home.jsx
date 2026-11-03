import { sampleProducts } from '../data/sampleProducts'
import Hero from '../components/home/Hero'
import CategoryGrid from '../components/home/CategoryGrid'
import ProductSection from '../components/product/ProductSection'
import HowItWorks from '../components/home/HowItWorks'
import TrustBar from '../components/home/TrustBar'
import PromoBanner from '../components/home/PromoBanner'

export default function Home() {
  return (
    <div>
      <Hero />
      <CategoryGrid />
      <ProductSection
        eyebrow="New in"
        title="Featured products"
        subtitle="A few favourites to start your design from."
        products={sampleProducts}
      />
      <HowItWorks />
      <ProductSection
        eyebrow="Loved by customers"
        title="Best sellers"
        subtitle="The designs customers come back for."
        products={[...sampleProducts].reverse()}
        className="border-t border-border"
      />
      <TrustBar />
      <PromoBanner />
    </div>
  )
}
