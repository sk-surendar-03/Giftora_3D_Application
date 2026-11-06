import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function Hero() {
  const customiseLink = '/customise'

  return (
    <section className="relative overflow-hidden bg-bg text-ink border-b border-line">
      {/* Hidden SVG Symbols & Filter Defs for Hero Products */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="hero-blur6" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id="hero-gGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#dcebf6" stopOpacity="0.55" />
            <stop offset="1" stopColor="#bcd3e6" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="hero-gShadeV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#000" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="hero-gStreak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-gShadeR" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="hero-gMug" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.25" stopColor="#fff" />
            <stop offset="0.75" stopColor="#e9e9ee" />
            <stop offset="1" stopColor="#cfcfd8" />
          </linearGradient>
          <linearGradient id="hero-gSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9d3ea" />
            <stop offset="1" stopColor="#eef4fa" />
          </linearGradient>

          <symbol id="hero-p-crystal" viewBox="0 0 400 400">
            <ellipse cx="200" cy="356" rx="140" ry="13" fill="#000" opacity="0.2" filter="url(#hero-blur6)" />
            <path d="M78 322h244l12 26H66z" fill="#17171c" />
            <rect x="66" y="344" width="268" height="10" rx="3" fill="#0d0d11" />
            <rect x="86" y="316" width="228" height="8" fill="var(--color-accent, #D9AE4E)" opacity="0.9" />
            <path d="M290 74l24-14v250l-24 14z" fill="#aac4da" opacity="0.85" />
            <path d="M110 74l24-14h180l-24 14z" fill="#fff" opacity="0.8" />
            <rect x="110" y="74" width="180" height="250" rx="6" fill="url(#hero-gGlass)" stroke="#fff" strokeOpacity="0.9" />
            <rect x="126" y="92" width="148" height="206" rx="3" fill="var(--color-soft, #161616)" />
            <circle cx="170" cy="168" r="23" fill="var(--color-accent, #D9AE4E)" />
            <path d="M128 298v-34c0-26 18-40 42-40s42 14 42 40v34z" fill="var(--color-accent, #D9AE4E)" />
            <circle cx="232" cy="176" r="21" fill="var(--color-accent-dark, #A9823A)" />
            <path d="M190 298v-30c0-24 18-38 42-38s42 14 42 38v30z" fill="var(--color-accent-dark, #A9823A)" opacity="0.96" />
            <rect x="126" y="92" width="148" height="206" rx="3" fill="url(#hero-gShadeV)" opacity="0.35" />
            <path d="M118 74h58l-74 250H110z" fill="url(#hero-gStreak)" opacity="0.7" transform="translate(40 0) skewX(-6)" />
          </symbol>

          <symbol id="hero-p-couple" viewBox="0 0 400 400">
            <ellipse cx="200" cy="350" rx="150" ry="14" fill="#000" opacity="0.22" filter="url(#hero-blur6)" />
            <ellipse cx="200" cy="334" rx="118" ry="22" fill="#14141a" />
            <ellipse cx="200" cy="324" rx="118" ry="22" fill="#262630" />
            <ellipse cx="200" cy="322" rx="104" ry="17" fill="#30303b" />
            <path d="M148 224c20-14 80-14 104 0" stroke="var(--color-accent, #D9AE4E)" strokeWidth="22" fill="none" strokeLinecap="round" />
            <path d="M132 322c-4-62 2-104 24-122 14-10 30-10 42-2l8 124z" fill="var(--color-accent, #D9AE4E)" />
            <path d="M132 322c-4-62 2-104 24-122 14-10 30-10 42-2l8 124z" fill="url(#hero-gShadeR)" />
            <circle cx="176" cy="156" r="33" fill="var(--color-accent, #D9AE4E)" />
            <circle cx="176" cy="156" r="33" fill="url(#hero-gShadeR)" />
            <path d="M144 150c2-26 22-38 42-34 18 4 28 16 24 30-14-14-44-16-66 4z" fill="#000" opacity="0.28" />
            <path d="M200 322l8-124c14-8 34-6 48 8 20 20 20 66 14 116z" fill="var(--color-accent-dark, #A9823A)" />
            <path d="M200 322l8-124c14-8 34-6 48 8 20 20 20 66 14 116z" fill="url(#hero-gShadeR)" />
            <circle cx="238" cy="164" r="31" fill="var(--color-accent-dark, #A9823A)" />
            <circle cx="238" cy="164" r="31" fill="url(#hero-gShadeR)" />
            <path d="M210 160c0-28 20-40 40-36 20 4 28 22 22 40-6-22-34-22-62-4z" fill="#000" opacity="0.22" />
            <path d="M200 112c-10-14-34-6-26 12 6 12 26 24 26 24s20-12 26-24c8-18-16-26-26-12z" fill="var(--color-secondary, #3D6AA3)" transform="translate(0 -40) scale(1)" opacity="0.95" />
          </symbol>

          <symbol id="hero-p-mug" viewBox="0 0 400 400">
            <ellipse cx="190" cy="346" rx="130" ry="13" fill="#000" opacity="0.2" filter="url(#hero-blur6)" />
            <path d="M292 150c62-8 62 112-2 108" fill="none" stroke="#d9d9e1" strokeWidth="22" strokeLinecap="round" />
            <path d="M292 150c62-8 62 112-2 108" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
            <path d="M100 112h200l-6 196c0 22-30 34-94 34s-94-12-94-34z" fill="url(#hero-gMug)" />
            <ellipse cx="200" cy="112" rx="100" ry="18" fill="#f4f4f7" stroke="#d6d6de" />
            <ellipse cx="200" cy="114" rx="90" ry="13" fill="#3a271e" />
            <path d="M108 176c60 12 124 12 184 0v90c-60 12-124 12-184 0z" fill="var(--color-soft, #161616)" />
            <text x="200" y="214" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontStyle="italic" fontSize="25" fill="var(--color-accent, #D9AE4E)">Priya &amp; Arjun</text>
            <text x="200" y="238" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="3" fill="var(--color-accent, #D9AE4E)" opacity="0.8">EST. 2019</text>
            <path d="M100 112h200l-6 196c0 22-30 34-94 34s-94-12-94-34z" fill="url(#hero-gShadeR)" opacity="0.55" />
          </symbol>

          <symbol id="hero-p-frame" viewBox="0 0 400 400">
            <ellipse cx="200" cy="354" rx="130" ry="12" fill="#000" opacity="0.2" filter="url(#hero-blur6)" />
            <path d="M200 300l66 54h-18l-48-40z" fill="#1c1c21" />
            <rect x="76" y="60" width="248" height="280" rx="5" fill="#1c1c21" />
            <rect x="76" y="60" width="248" height="280" rx="5" fill="url(#hero-gShadeV)" opacity="0.5" />
            <rect x="92" y="76" width="216" height="248" fill="#f7f7f9" />
            <rect x="116" y="100" width="168" height="200" fill="url(#hero-gSky)" />
            <circle cx="238" cy="150" r="20" fill="#fff" opacity="0.9" />
            <path d="M116 260c30-34 62-40 96-22 26 14 48 8 72-10v72H116z" fill="var(--color-accent, #D9AE4E)" opacity="0.78" />
            <path d="M116 284c36-22 74-24 112-6 22 10 38 8 56 0v22H116z" fill="var(--color-accent-dark, #A9823A)" opacity="0.9" />
            <circle cx="186" cy="226" r="8" fill="#1c1c21" />
            <path d="M176 262c0-20 4-28 10-28s10 8 10 28z" fill="#1c1c21" />
            <circle cx="208" cy="230" r="7" fill="#1c1c21" />
            <path d="M199 262c0-18 3-26 9-26s9 8 9 26z" fill="#1c1c21" />
            <path d="M92 76h216L284 100H116z" fill="#000" opacity="0.06" />
          </symbol>
        </defs>
      </svg>

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

        {/* Right Column: Hero Figure with Studio Arrangement & Floating Badge */}
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

          {/* Hero Scene SVG matching Preview Arrangement */}
          <svg
            className="block w-full h-auto max-h-[560px] overflow-visible"
            viewBox="0 0 640 560"
            role="img"
            aria-label="Studio arrangement of personalised gifts: crystal photo cube, couple figurine, story mug and photo frame"
          >
            <defs>
              <linearGradient id="hero-hLight" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity="0.30" />
                <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Dark Arch Background */}
            <path d="M40 560V250a280 280 0 0 1 560 0v310Z" fill="#161616" />

            {/* Blue Accent Circle */}
            <circle cx="548" cy="96" r="54" fill="#3D6AA3" opacity="0.85" />

            {/* Ground Shadow */}
            <ellipse cx="320" cy="486" rx="330" ry="30" fill="#FFFFFF" opacity="0.12" filter="url(#hero-blur6)" />

            {/* Preview Products Studio Arrangement */}
            <use href="#hero-p-crystal" x="70" y="132" width="340" height="340" />
            <use href="#hero-p-couple" x="320" y="176" width="290" height="290" />
            <use href="#hero-p-mug" x="-6" y="352" width="200" height="200" />
            <use href="#hero-p-frame" x="432" y="350" width="200" height="200" />

            {/* Arch Top Sheen Overlay */}
            <path d="M40 560V250a280 280 0 0 1 560 0v310Z" fill="url(#hero-hLight)" />
          </svg>
        </div>

      </div>
    </section>
  )
}
