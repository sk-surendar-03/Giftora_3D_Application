import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import QuantitySelector from '../product/QuantitySelector'

export default function NameplateCustomizationSummary({
  design,
  volumeCm3 = 0,
  quantity = 1,
  onQuantityChange,
  totalPriceRupees,
  shippingMethod,
  shippingOptions = [],
  onShippingChange,
  canAdd = true,
  busy = false,
  phase,
  added = false,
  error,
  onAddToCart,
}) {
  const typeLabel = design.type.replace('-', ' ')
  const shapeLabel = design.shape.replace('-', ' ')
  const mountingLabel = design.mountingStyle.replace('-', ' ')
  const finishLabel = design.materialFinish.replace('-', ' ')
  const calculatedTotal = totalPriceRupees != null ? `₹${totalPriceRupees.toFixed(2)}` : null

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
        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Type</dt>
          <dd className="font-medium text-ink capitalize">{typeLabel}</dd>
        </div>
        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Shape</dt>
          <dd className="font-medium text-ink capitalize">{shapeLabel}</dd>
        </div>
        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Mounting</dt>
          <dd className="font-medium text-ink capitalize">{mountingLabel}</dd>
        </div>
        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Finish</dt>
          <dd className="font-medium text-ink capitalize">{finishLabel}</dd>
        </div>
        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Dimensions</dt>
          <dd className="font-medium text-ink font-mono">{design.widthMm} × {design.heightMm} mm</dd>
        </div>
        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Solid volume</dt>
          <dd className="font-medium text-ink font-mono">{volumeCm3.toFixed(1)} cm³</dd>
        </div>
        <div className="flex justify-between items-center gap-4 text-[13.5px]">
          <dt className="text-muted">Quantity</dt>
          <dd>
            <QuantitySelector value={quantity} onChange={onQuantityChange} />
          </dd>
        </div>
        {shippingOptions.length > 0 && (
          <div className="flex justify-between items-center gap-4 text-[13.5px] pt-1 border-t border-line">
            <dt className="text-muted">Shipping</dt>
            <dd>
              <select
                value={shippingMethod?.name ?? ''}
                onChange={(e) => {
                  const m = shippingOptions.find((x) => x.name === e.target.value)
                  if (m) onShippingChange(m)
                }}
                className="rounded-control border border-line bg-alt px-2.5 py-1 text-[12.5px] text-ink focus:border-accent focus:outline-none"
              >
                {shippingOptions.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.priceCents === 0 ? '(FREE)' : `(₹${(m.priceCents / 100).toFixed(2).replace(/\.00$/, '')})`}
                  </option>
                ))}
              </select>
            </dd>
          </div>
        )}
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
        </p>
      )}

      {!canAdd && !busy && (
        <p className="mt-4 text-[12.5px] text-muted">
          Adjust your nameplate dimensions so it fits within the print bed boundaries ($220 \times 220\text{ mm}$) to add this design to your cart.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onAddToCart}
          disabled={busy || !canAdd}
          className="w-full text-base font-semibold"
        >
          {busy ? (phase || 'Adding to cart...') : 'Add Nameplate to Cart'}
        </Button>
        <div className="flex gap-3">
          <Link to="/cart" className="flex-1">
            <Button variant="secondary" size="md" className="w-full">
              View Cart
            </Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button variant="ghost" size="md" className="w-full">
              Shop All
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
