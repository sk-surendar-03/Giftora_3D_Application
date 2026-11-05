export default function CustomizerStepCard({ step, title, description, children }) {
  return (
    <section className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-dark">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-3.5 pl-9">{children}</div>
    </section>
  )
}
