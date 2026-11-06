export default function CustomizerStepCard({ step, title, description, children, valueSummary }) {
  return (
    <section className="rounded-card border border-line bg-surface p-5 mb-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-on-accent">
            {step}
          </span>
          <div>
            <h2 className="font-sans text-[15px] font-semibold text-ink m-0 leading-tight">{title}</h2>
            {description && <p className="font-sans text-[12.5px] text-muted m-0 mt-0.5 leading-tight">{description}</p>}
          </div>
        </div>
        {valueSummary && (
          <span className="font-sans text-[13px] font-medium text-muted">
            {valueSummary}
          </span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
