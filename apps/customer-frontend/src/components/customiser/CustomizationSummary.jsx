import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth.js'
import { PHASE_LABELS, useAddCustomDesignToCart } from '../../features/customDesign/useAddCustomDesignToCart.js'
import { saveDraft } from '../../features/customDesign/designDraft.js'
import { describeDesign } from '../../features/customDesign/designLabels.js'
import Button from '../ui/Button'

export default function CustomizationSummary({
  design,
  quantity,
  totalPriceRupees,
  canAdd,
  engineClient,
  engineParams,
  fontDefinition,
  subtitleFontDefinition,
  allowDisconnected,
  capturePreview,
}) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { addToCart, phase, error, added, busy, clearAdded } = useAddCustomDesignToCart()

  const rows = [...describeDesign(design), { label: 'Quantity', value: quantity }]

  const calculatedTotal = totalPriceRupees != null ? `₹${(totalPriceRupees * quantity).toFixed(2)}` : null

  // A change after adding makes the "Added to cart" notice stale.
  useEffect(() => {
    clearAdded()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the design/quantity changing
  }, [design, quantity])

  async function handleAddToCart() {
    if (!isAuthenticated) {
      // Keep the design through the sign-in redirect; the customiser restores it.
      saveDraft({ ...design, quantity })
      navigate('/login', { state: { from: '/customise' } })
      return
    }
    await addToCart({
      client: engineClient,
      params: engineParams,
      fontDefinition,
      subtitleFontDefinition,
      allowDisconnected,
      design,
      quantity,
      capturePreview,
    })
  }

  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-center justify-between pb-3.5 border-b border-line">
        <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0">
          Your specification
        </h3>
        {calculatedTotal && (
          <span className="font-sans text-[22px] font-bold text-ink">
            {calculatedTotal}
          </span>
        )}
      </div>

      <dl className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 text-[13.5px]">
            <dt className="text-muted">{row.label}</dt>
            <dd className="flex items-center gap-1.5 text-right font-medium text-ink">
              {row.hex && <span className="inline-block h-3 w-3 rounded-full border border-border" style={{ backgroundColor: row.hex }} aria-hidden="true" />}
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {added && (
        <p className="mt-4 text-[13.5px] font-semibold text-[#17683f] bg-[#e3f4ea] px-3.5 py-2 rounded-control">
          ✓ Added to cart.{' '}
          <Link to="/cart" className="underline">
            View cart
          </Link>
        </p>
      )}
      {error && (
        <p className="mt-4 text-[13.5px] font-semibold text-danger bg-[#fbe6e2] px-3.5 py-2 rounded-control">
          {error}
          {phase !== 'idle' && (
            <span className="block text-[11.5px] font-normal mt-0.5 opacity-70">
              Failed while: {PHASE_LABELS[phase] ?? phase}
            </span>
          )}
        </p>
      )}
      {!canAdd && !busy && (
        <p className="mt-4 text-[12.5px] text-muted">
          Enter your text and wait for the 3D preview to be ready and printable to add this design to your cart.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          disabled={busy || !canAdd}
          className="w-full text-base font-semibold"
        >
          {busy ? PHASE_LABELS[phase] : 'Add Custom Design to Cart'}
        </Button>
        <div className="flex gap-3">
          <Link to="/cart" className="flex-1">
            <Button variant="secondary" size="md" className="w-full">View Cart</Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button variant="ghost" size="md" className="w-full">Shop All</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
