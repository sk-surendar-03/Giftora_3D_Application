export default function QuantitySelector({ value, onChange, min = 1, max = 10 }) {
  function clamp(next) {
    onChange(Math.min(max, Math.max(min, next)))
  }

  return (
    <div>
      <span className="block text-sm font-medium text-ink">Quantity</span>
      <div className="mt-2 inline-flex items-center rounded-control border border-border">
        <button
          type="button"
          onClick={() => clamp(value - 1)}
          disabled={value <= min}
          aria-label="Decrease quantity"
          className="flex h-10 w-10 items-center justify-center text-lg text-ink disabled:opacity-30"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-medium text-ink" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => clamp(value + 1)}
          disabled={value >= max}
          aria-label="Increase quantity"
          className="flex h-10 w-10 items-center justify-center text-lg text-ink disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  )
}
