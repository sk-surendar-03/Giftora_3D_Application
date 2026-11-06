export default function QuantitySelector({ value, onChange, min = 1, max = 10, isCart = false }) {
  function clamp(next) {
    onChange(Math.min(max, Math.max(min, next)))
  }

  const heightClass = isCart ? 'h-[40px]' : 'h-[54px]'
  const btnWidthClass = isCart ? 'w-[36px]' : 'w-[44px]'

  return (
    <div>
      {!isCart && <span className="block font-sans text-[13px] font-bold tracking-[0.04em] text-ink mb-2">Quantity</span>}
      <div className={`inline-flex items-center rounded-control border border-line bg-surface ${heightClass}`}>
        <button
          type="button"
          onClick={() => clamp(value - 1)}
          disabled={value <= min}
          aria-label="Decrease quantity"
          className={`flex h-full ${btnWidthClass} items-center justify-center text-lg text-ink font-semibold disabled:opacity-30 hover:text-accent cursor-pointer`}
        >
          −
        </button>
        <span className="min-w-[34px] px-2 text-center font-sans text-[15px] font-semibold text-ink" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => clamp(value + 1)}
          disabled={value >= max}
          aria-label="Increase quantity"
          className={`flex h-full ${btnWidthClass} items-center justify-center text-lg text-ink font-semibold disabled:opacity-30 hover:text-accent cursor-pointer`}
        >
          +
        </button>
      </div>
    </div>
  )
}
