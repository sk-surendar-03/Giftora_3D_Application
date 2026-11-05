export default function PreviewUnavailable({ message }) {
  return (
    <div className="flex aspect-square w-full flex-col items-center justify-center rounded-card border border-line bg-soft p-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent mb-3">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
        </svg>
      </span>
      <p className="font-sans text-[15px] font-semibold text-ink m-0">3D preview unavailable</p>
      <p className="mt-1.5 max-w-xs font-sans text-[13px] text-muted leading-relaxed">{message}</p>
    </div>
  )
}
