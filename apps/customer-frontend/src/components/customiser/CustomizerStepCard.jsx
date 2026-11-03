export default function CustomizerStepCard({ step, title, description, children }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}
