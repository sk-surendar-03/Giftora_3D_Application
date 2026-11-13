import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function Hero() {
  const customiseLink = '/customise'

  return (
    <section className="relative overflow-hidden bg-bg text-ink border-b border-line">

      <div className="mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] pt-10 min-[901px]:pt-10 min-[901px]:min-h-[620px] grid grid-cols-1 min-[901px]:grid-cols-[1.02fr_0.98fr] gap-10 items-center max-[760px]:pt-7 max-[760px]:pb-2.5 max-[760px]:gap-2.5">
        
        {/* Left Column: Heading and CTAs */}
        <div className="self-center pb-8 min-[901px]:pb-12 max-[760px]:pb-2 z-10">
          <div className="flex items-center gap-2.5">
            <span className="hidden min-[761px]:block w-7 h-[2px] bg-accent" />
            <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
              Personalised gifts, made to order
            </span>
          </div>

          <h1 className="font-display font-semibold text-[36px] min-[761px]:text-[52px] min-[1041px]:text-[64px] leading-[1.12] tracking-[-0.02em] text-ink my-5 max-[760px]:my-3.5">
            Gifts that carry their name.
          </h1>

          <p className="font-sans text-[16px] min-[761px]:text-[18px] leading-[1.55] text-accent max-w-[46ch]">
            Design a keepsake in 3D, preview it from every angle, and we will make it just for them. Crystal, figurines, mugs, frames and more.
          </p>

          <div className="mt-8 mb-9 flex flex-wrap items-center gap-3 max-[760px]:my-5 max-[760px]:flex-row">
            <Link to={customiseLink} className="max-[760px]:flex-1">
              <Button variant="hero" size="lg" className="w-full">
                <span>Start personalising</span>
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Button>
            </Link>
            <Link to="/products" className="max-[760px]:flex-1">
              <Button variant="hero2" size="lg" className="w-full">
                Shop all gifts
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-7 text-[13.5px] font-medium text-accent max-[760px]:gap-x-4 max-[760px]:gap-y-2.5 max-[760px]:text-[12.5px]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="17" cy="18" r="2" />
              </svg>
              <span>Ships in 3 days</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent fill-accent" viewBox="0 0 24 24">
                <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" stroke="none" />
              </svg>
              <span>4.8 average rating</span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Photography */}
        <div className="relative self-end w-full max-w-[560px] mx-auto min-[901px]:max-w-none flex justify-center">
          {/* Floating 'Preview in 3D' Badge */}
          <div className="hidden min-[761px]:flex absolute left-[-8px] top-[120px] z-20 items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.85)]">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-soft text-accent">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
                <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
              </svg>
            </span>
            <div>
              <div className="text-[14px] font-semibold text-ink leading-tight">Preview in 3D</div>
              <div className="text-[13px] text-muted leading-tight">Before we print</div>
            </div>
          </div>

          <img
            src="/hero-products.png"
            alt="Jasvel 3D Prints — Ganesha idol, spiritual figurines and personalised gifts"
            className="block w-full h-auto max-h-[560px] object-contain drop-shadow-2xl"
          />
        </div>

      </div>
    </section>
  )
}
