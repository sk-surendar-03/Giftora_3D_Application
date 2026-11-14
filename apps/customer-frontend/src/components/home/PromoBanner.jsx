import { Link } from 'react-router-dom'
import Button from '../ui/Button'

export default function PromoBanner() {
  return (
    <section className="py-21 max-[1040px]:py-16 max-[760px]:py-12 bg-bg">
      <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px]">
        <div className="rounded-[16px] border border-line bg-band overflow-hidden grid grid-cols-1 min-[761px]:grid-cols-2 min-[1041px]:grid-cols-[1fr_1.05fr]">
          
          {/* Left Text Block */}
          <div className="p-14 max-[1040px]:px-9 max-[1040px]:py-11 max-[760px]:px-5.5 max-[760px]:py-8 flex flex-col justify-center">
            <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-secondary">
              3D Customiser
            </span>
            <h2 className="font-display text-[38px] max-[760px]:text-[30px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] my-4">
              Design it. Rotate it. See it before we make it.
            </h2>
            <p className="font-sans text-[15px] text-muted max-w-[44ch] leading-relaxed">
              Type a name, choose an industrial font and finish, and watch the real 3D geometry update live in the browser. What you see is what we print.
            </p>

            <ul className="my-7 space-y-3 list-none p-0 text-[14.5px] text-ink font-medium">
              <li className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10" />
                </svg>
                <span>Live 3D preview with true dimensions</span>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10" />
                </svg>
                <span>Industrial font library & dual-tone finishes</span>
              </li>
              <li className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-secondary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10" />
                </svg>
                <span>Automated manifold & print-readiness check</span>
              </li>
            </ul>

            <div>
              <Link to="/customise">
                <Button variant="primary" size="lg" className="gap-2.5">
                  <span>Open the customiser</span>
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Light Viewport Island */}
          <div className="relative min-h-[420px] max-[760px]:min-h-[320px] flex items-center justify-center overflow-hidden bg-[#f3f6fb]"
            style={{
              backgroundImage: 'linear-gradient(#dbe4f0 1px, transparent 1px), linear-gradient(90deg, #dbe4f0 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          >
            {/* Hint Chip */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-3.5 py-1 text-[12px] font-medium text-[#1d2230] shadow-sm select-none">
              Drag to rotate · Scroll to zoom
            </div>

            {/* Viewport tool buttons */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button type="button" aria-label="Reset view" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-[#1d2230] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.3)] hover:bg-white/90">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
                </svg>
              </button>
              <button type="button" aria-label="Layers" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-[#1d2230] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.3)] hover:bg-white/90">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5" />
                </svg>
              </button>
            </div>

            {/* Dimension Pill */}
            <div className="absolute bottom-4 left-4.5 rounded-[8px] bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-[#1d2230] shadow-sm select-none">
              62 × 24 × 4 mm
            </div>

            {/* Mini Floating Config Panel (Desktop only) */}
            <div className="hidden min-[761px]:flex absolute bottom-5 right-5 w-[210px] flex-col gap-2.5 rounded-[14px] bg-white p-3.5 shadow-[0_20px_40px_-16px_rgba(20,20,30,0.25)] border border-[#dbe1ea]">
              <div className="h-8 rounded-[4px] border border-[#dbe1ea] bg-white px-2.5 font-sans text-[13px] font-semibold tracking-wider text-[#1d2230] flex items-center">
                AARAV
              </div>
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-accent ring-2 ring-accent ring-offset-2 ring-offset-white cursor-pointer" />
                <span className="h-6 w-6 rounded-full bg-white border border-[#dbe1ea] cursor-pointer" />
                <span className="h-6 w-6 rounded-full bg-[#111111] cursor-pointer" />
                <span className="h-6 w-6 rounded-full bg-secondary cursor-pointer" />
              </div>
            </div>

            {/* Artwork Keychain SVG in Island */}
            <div className="w-[min(86%,430px)]">
              <svg className="w-full h-auto" viewBox="0 0 400 400" role="img" aria-label="Keychain 3D illustration">
                <ellipse cx="200" cy="338" rx="130" ry="12" fill="#000" opacity="0.15" />
                <circle cx="200" cy="62" r="34" fill="none" stroke="#9fa4ad" strokeWidth="9" />
                <circle cx="200" cy="62" r="34" fill="none" stroke="#e5e8ed" strokeWidth="3" strokeDasharray="40 200" transform="rotate(-50 200 62)" />
                <ellipse cx="200" cy="112" rx="9" ry="16" fill="none" stroke="#9fa4ad" strokeWidth="6" />
                <ellipse cx="200" cy="140" rx="9" ry="16" fill="none" stroke="#b5bac2" strokeWidth="6" />
                <rect x="60" y="178" width="280" height="130" rx="32" fill="#A9823A" />
                <rect x="60" y="162" width="280" height="130" rx="32" fill="#D9AE4E" />
                <circle cx="200" cy="184" r="10" fill="#000" opacity="0.35" />
                <text x="203" y="258" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="58" fill="#000" opacity="0.25">AARAV</text>
                <text x="200" y="254" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="58" fill="#ffffff">AARAV</text>
              </svg>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
