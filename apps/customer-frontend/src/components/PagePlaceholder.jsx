export default function PagePlaceholder({ title, description }) {
  return (
    <div className="bg-bg text-ink min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="mx-auto max-w-lg text-center rounded-card border border-line bg-surface p-10">
        <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-soft text-accent mb-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </span>
        <h1 className="font-display text-[28px] font-semibold text-ink m-0">{title}</h1>
        {description && <p className="mt-2.5 font-sans text-[15px] text-muted leading-relaxed">{description}</p>}
      </div>
    </div>
  )
}
