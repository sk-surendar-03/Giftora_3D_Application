export default function Input({ label, hint, error, className = '', id, ...props }) {
  return (
    <label className="block text-[13px] font-semibold text-ink" htmlFor={id}>
      {label}
      <input
        id={id}
        className={`mt-1.5 block w-full h-[46px] rounded-control border px-3.5 text-[15px] text-ink placeholder:text-muted bg-surface focus:outline-none transition-colors ${
          error
            ? 'border-danger focus:border-danger'
            : 'border-border focus:border-accent focus:ring-1 focus:ring-accent'
        } disabled:bg-alt disabled:text-muted disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error ? (
        <span className="mt-1.5 block text-[12.5px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12.5px] text-muted">{hint}</span>
      ) : null}
    </label>
  )
}
