import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function Hero() {
  const customiseLink = '/customise'

  return (
    <section className="relative overflow-hidden border-b border-line max-[760px]:min-h-[500px]">

      <img
        src="/hero-products.png"
        alt="Jasvel 3D Prints — personalised spiritual gifts and figurines"
        className="block w-full h-auto max-[760px]:absolute max-[760px]:inset-0 max-[760px]:h-full max-[760px]:object-cover max-[760px]:object-[center_30%]"
      />

      {/* Base dark layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.45)' }}
      />

      {/* Desktop: left-heavy gradient */}
      <div
        className="absolute inset-0 pointer-events-none max-[760px]:hidden"
        style={{
          background: 'linear-gradient(105deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.80) 25%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.2) 65%, transparent 100%)'
        }}
      />

      {/* Mobile: top-to-bottom gradient so text at top is readable */}
      <div
        className="absolute inset-0 pointer-events-none min-[761px]:hidden"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.75) 100%)'
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: '35%', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
      />

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center max-[760px]:items-start max-[760px]:pt-8">
        <div className="w-full mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-4">
          <div className="max-w-[520px] max-[760px]:max-w-full">

            <div className="flex items-center gap-2.5 mb-4 max-[760px]:mb-3">
              <span className="w-7 h-[2px] shrink-0" style={{ background: '#D9AE4E' }} />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: '#D9AE4E', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
              >
                Your Imagination. Our 3D Creation.
              </span>
            </div>

            <h1
              className="font-display font-bold leading-[1.08] tracking-[-0.02em] mb-5 max-[760px]:mb-3"
              style={{
                fontSize: 'clamp(26px, 5vw, 62px)',
                color: '#ffffff',
                textShadow: '0 0 60px rgba(217,174,78,0.5), 0 2px 24px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,1)',
              }}
            >
              Gifts that carry<br />their name.
            </h1>

            <p
              className="leading-[1.6] mb-7 max-[760px]:mb-5 max-w-[42ch]"
              style={{
                fontSize: 'clamp(14px, 2vw, 17px)',
                color: 'rgba(255,240,200,0.95)',
                textShadow: '0 1px 8px rgba(0,0,0,0.95)',
              }}
            >
              Design a keepsake in 3D, preview it from every angle, and we will make it just for them.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6 max-[760px]:mb-4">
              <Link to={customiseLink} className="max-[760px]:flex-1">
                <Button variant="hero" size="lg" className="w-full whitespace-nowrap">
                  <span>Start personalising</span>
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Button>
              </Link>
              <Link to="/products" className="max-[760px]:flex-1">
                <Button variant="hero2" size="lg" className="w-full whitespace-nowrap"
                  style={{ borderColor: 'rgba(217,174,78,0.5)', color: '#f0e0b4' }}>
                  Shop all gifts
                </Button>
              </Link>
            </div>

            <div
              className="flex flex-wrap items-center gap-5 font-medium max-[760px]:gap-x-4 max-[760px]:gap-y-2"
              style={{
                fontSize: 'clamp(11px, 1.5vw, 13px)',
                color: 'rgba(255,240,200,0.9)',
                textShadow: '0 1px 6px rgba(0,0,0,0.95)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: '#D9AE4E' }}>
                  <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
                </svg>
                Ships in 3 days
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: '#D9AE4E' }}>
                  <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z" /><path d="m9 12 2 2 4-4" />
                </svg>
                Secure checkout
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" style={{ color: '#D9AE4E', fill: '#D9AE4E' }}>
                  <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" stroke="none" />
                </svg>
                4.8 average rating
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Preview in 3D badge — desktop only */}
      <div
        className="hidden min-[761px]:flex absolute bottom-6 right-8 items-center gap-3 rounded-card px-4 py-3"
        style={{
          background: 'rgba(10,10,10,0.75)',
          border: '1px solid rgba(217,174,78,0.35)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(217,174,78,0.1)',
        }}
      >
        <span
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full"
          style={{ background: 'rgba(217,174,78,0.15)', color: '#D9AE4E' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
          </svg>
        </span>
        <div>
          <div className="text-[14px] font-semibold leading-tight" style={{ color: '#fff' }}>Preview in 3D</div>
          <div className="text-[12px] leading-tight" style={{ color: 'rgba(217,174,78,0.8)' }}>Before we print</div>
        </div>
      </div>

    </section>
  )
}
