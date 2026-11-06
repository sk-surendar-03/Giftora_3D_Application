export default function StatCard({ label, value, hint, delta, icon }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-center justify-between text-muted">
        <p className="font-sans text-[13px] font-medium text-muted m-0">{label}</p>
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-soft text-accent">
          {icon || (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />
            </svg>
          )}
        </span>
      </div>
      <p className="mt-2 font-display text-[28px] max-[760px]:text-[22px] font-bold text-ink leading-none tracking-[-0.01em] m-0">
        {value}
      </p>
      {hint && (
        <div className="mt-2.5 flex items-center gap-2">
          {delta && (
            <span className="rounded-full bg-[#e3f4ea] px-2 py-0.5 text-[11px] font-semibold text-[#17683f]">
              {delta}
            </span>
          )}
          <p className="text-[12.5px] text-muted m-0">{hint}</p>
        </div>
      )}
    </div>
  )
}
