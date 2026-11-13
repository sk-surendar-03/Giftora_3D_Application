import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function Hero() {
  const customiseLink = '/customise'

  return (
    <section className="relative overflow-hidden border-b border-line">

      <img
        src="/hero-products.png"
        alt="Jasvel 3D Prints — personalised spiritual gifts and figurines"
        className="block w-full h-auto"
      />

      {/* Base dark layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.42)' }}
      />

      {/* Left-heavy gradient — same angle on all screens */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.82) 25%, rgba(0,0,0,0.5) 48%, rgba(0,0,0,0.1) 65%, transparent 100%)'
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: '28%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
      />

      {/* Text overlay — centered on desktop, top-aligned on mobile */}
      <div className="absolute inset-0 flex items-center max-[760px]:items-start max-[760px]:pt-5">
        <div className="w-full mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-4">
          <div className="max-w-[520px] max-[760px]:max-w-[58%]">

            {/* Eyebrow — hidden on mobile to save space */}
            <div className="hidden min-[761px]:flex items-center gap-2 mb-3">
              <span className="w-6 h-[2px] shrink-0" style={{ background: '#D9AE4E' }} />
              <span
                className="font-bold uppercase tracking-[0.18em]"
                style={{ fontSize: 'clamp(8px, 1.8vw, 11px)', color: '#D9AE4E', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
              >
                Your Imagination. Our 3D Creation.
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-bold leading-[1.05] tracking-[-0.02em] mb-3 max-[760px]:mb-2"
              style={{
                fontSize: 'clamp(20px, 4.8vw, 62px)',
                color: '#ffffff',
                textShadow: '0 0 50px rgba(217,174,78,0.5), 0 2px 20px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,1)',
              }}
            >
              Gifts that carry<br />their name.
            </h1>

            {/* Body */}
            <p
              className="leading-[1.5] mb-4 max-[760px]:mb-3"
              style={{
                fontSize: 'clamp(10px, 1.4vw, 17px)',
                color: 'rgba(255,240,200,0.95)',
                textShadow: '0 1px 8px rgba(0,0,0,0.95)',
              }}
            >
              Design a keepsake in 3D, preview it from every angle, and we will make it just for them.
            </p>

            {/* Buttons — always one row, equal size */}
            <div className="flex flex-row items-center gap-2 max-[760px]:mb-0 min-[761px]:gap-3 min-[761px]:mb-5">
              <Link to={customiseLink} className="flex-1 min-[761px]:flex-none">
                <Button variant="hero" size="lg" className="w-full whitespace-nowrap max-[760px]:!text-[10px] max-[760px]:!py-0 max-[760px]:!px-2 max-[760px]:!h-7 max-[760px]:!leading-7">
                  <span>Start personalising</span>
                </Button>
              </Link>
              <Link to="/products" className="flex-1 min-[761px]:flex-none">
                <Button variant="hero2" size="lg" className="w-full whitespace-nowrap max-[760px]:!text-[10px] max-[760px]:!py-0 max-[760px]:!px-2 max-[760px]:!h-7 max-[760px]:!leading-7"
                  style={{ borderColor: 'rgba(217,174,78,0.5)', color: '#f0e0b4' }}>
                  Shop all gifts
                </Button>
              </Link>
            </div>

            {/* Trust badges — desktop only */}
            <div
              className="hidden min-[761px]:flex flex-wrap items-center gap-3 font-medium"
              style={{
                fontSize: 'clamp(9px, 1.2vw, 13px)',
                color: 'rgba(255,240,200,0.9)',
                textShadow: '0 1px 6px rgba(0,0,0,0.95)',
              }}
            >
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 min-[761px]:w-4 min-[761px]:h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: '#D9AE4E' }}>
                  <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
                </svg>
                Ships in 3 days
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 min-[761px]:w-4 min-[761px]:h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: '#D9AE4E' }}>
                  <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z" /><path d="m9 12 2 2 4-4" />
                </svg>
                Secure checkout
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 min-[761px]:w-4 min-[761px]:h-4 shrink-0" viewBox="0 0 24 24" style={{ color: '#D9AE4E', fill: '#D9AE4E' }}>
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" stroke="none" />
                </svg>
                4.8 rating
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Preview in 3D badge — shown on all screens, smaller on mobile */}
      <div
        className="flex absolute items-center gap-2 rounded-card max-[760px]:bottom-3 max-[760px]:right-3 max-[760px]:px-2.5 max-[760px]:py-2 min-[761px]:bottom-6 min-[761px]:right-8 min-[761px]:gap-3 min-[761px]:px-4 min-[761px]:py-3"
        style={{
          background: 'rgba(10,10,10,0.75)',
          border: '1px solid rgba(217,174,78,0.35)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,174,78,0.1)',
        }}
      >
        <span
          className="flex items-center justify-center rounded-full max-[760px]:h-[28px] max-[760px]:w-[28px] min-[761px]:h-[36px] min-[761px]:w-[36px]"
          style={{ background: 'rgba(217,174,78,0.15)', color: '#D9AE4E' }}
        >
          <svg className="max-[760px]:w-4 max-[760px]:h-4 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
          </svg>
        </span>
        <div>
          <div className="font-semibold leading-tight max-[760px]:text-[11px] min-[761px]:text-[14px]" style={{ color: '#fff' }}>Preview in 3D</div>
          <div className="leading-tight max-[760px]:text-[10px] min-[761px]:text-[12px]" style={{ color: 'rgba(217,174,78,0.8)' }}>Before we print</div>
        </div>
      </div>

    </section>
  )
}
