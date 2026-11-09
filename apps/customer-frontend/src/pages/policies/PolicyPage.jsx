import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { POLICIES } from './policyContent.js'

const PLACEHOLDER_SPLIT = /(\[\[[^\]]+\]\])/g

// Renders [[PLACEHOLDER]] segments as highlighted, clearly-marked text.
function RichText({ text }) {
  return text.split(PLACEHOLDER_SPLIT).map((part, index) =>
    part.startsWith('[[') ? (
      <mark key={index} className="rounded-[3px] bg-accent/15 px-1 py-px font-semibold text-ink">
        [{part.slice(2, -2)}]
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
}

export default function PolicyPage({ slug }) {
  const policy = POLICIES[slug]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!policy) return null

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[860px] px-10 max-[760px]:px-[18px] py-12">
        <div className="pb-6 border-b border-line mb-8">
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">{policy.eyebrow}</span>
          <h1 className="font-display text-[40px] max-[760px]:text-[30px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-2">
            {policy.title}
          </h1>
          <p className="mt-2 text-base text-muted leading-relaxed">{policy.intro}</p>
        </div>

        <div className="mb-8 rounded-card border border-line bg-alt/60 p-4 text-[13px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">Draft for owner review.</span> Highlighted items in brackets are placeholders that must be replaced with approved,
          business-specific information before this page is published.
        </div>

        <div className="space-y-8">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-semibold text-ink m-0 mb-2">{section.heading}</h2>
              <div className="space-y-2.5 text-[15px] leading-relaxed text-muted">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="m-0">
                    <RichText text={paragraph} />
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-line pt-5 text-[13px] text-muted">
          Questions? Visit our{' '}
          <Link to="/contact" className="font-semibold text-accent hover:underline">
            Contact page
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
