export default function Input({ label, hint, error, className = '', id, ...props }) {
  return (
    <label className="block text-sm font-medium text-ink" htmlFor={id}>
      {label}
      <input
        id={id}
        className={`mt-1.5 block w-full rounded-control border px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 ${
          error ? 'border-danger' : 'border-border focus:border-accent'
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}
