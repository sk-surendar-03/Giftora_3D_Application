import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import QuantitySelector from '../product/QuantitySelector'

const SHAPE_NAMES = {
  cylinder: 'Cylindrical Lamp',
  rectangle: 'Rectangular Light Box',
  four_sided: 'Four-Sided Memory Lamp',
  prism_4: 'Four-Sided Memory Lamp',
  heart: 'Heart-Shaped Lamp',
  curved: 'Curved Portrait Lamp',
  moon: 'Moon Photo Lamp',
  hexagonal: 'Hexagonal Lantern',
  lantern_6: 'Hexagonal Lantern',
  circular: 'Circular Medallion',
  medallion: 'Circular Medallion',
  rotating: 'Rotating Photo Lamp',
  carousel_3: 'Rotating Photo Lamp',
}

export default function PhotoLampCustomizationSummary({
  project,
  volumeCm3 = 0,
  quantity = 1,
  onQuantityChange,
  totalPriceRupees,
  unitPriceRupees,
  shippingMethod,
  shippingOptions = [],
  onShippingChange,
  canAdd = true,
  busy = false,
  phase,
  added = false,
  error,
  note = '',
  onNoteChange,
  onAddToCart,
  onOpenEstimator,
}) {
  const shapeName = SHAPE_NAMES[project?.shape] || 'Custom Photo Lamp'
  const photosCount = project?.photos?.length || 0
  const heightMm = project?.printSettings?.modelHeightMm || 120
  const widthOrDiaMm = project?.printSettings?.modelDiameterMm || project?.printSettings?.modelWidthMm || 90
  const baseEnabled = project?.baseSettings?.enabled !== false
  const hasEngraving = Boolean(project?.baseSettings?.engravedText?.trim())
  const lightEnabled = project?.lighting?.isOn !== false
  const lightPreset = project?.lighting?.colorPreset || 'Warm'

  const calculatedTotal =
    totalPriceRupees != null && !Number.isNaN(totalPriceRupees)
      ? `₹${Math.round(totalPriceRupees).toLocaleString('en-IN')}`
      : null

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-sm">
      {/* Header with Live Calculated Price */}
      <div className="flex items-center justify-between pb-3.5 border-b border-line">
        <div>
          <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0">
            Your Photo Lamp Summary
          </h3>
          {unitPriceRupees != null && !Number.isNaN(unitPriceRupees) && (
            <p className="text-[11px] text-muted mt-0.5">
              Unit: ₹{Math.round(unitPriceRupees).toLocaleString('en-IN')} &bull; Volume: {volumeCm3} cm³
            </p>
          )}
        </div>
        {calculatedTotal ? (
          <span className="font-sans text-[22px] font-bold text-ink">
            {calculatedTotal}
          </span>
        ) : (
          <span className="font-sans text-[14px] text-muted animate-pulse">
            Calculating price…
          </span>
        )}
      </div>

      {/* Specifications Breakdown */}
      <dl className="mt-4 space-y-2">
        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Lamp Shape</dt>
          <dd className="font-medium text-ink">{shapeName}</dd>
        </div>

        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Dimensions</dt>
          <dd className="font-medium text-ink font-mono">
            {heightMm} mm (H) &times; {widthOrDiaMm} mm
          </dd>
        </div>

        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">Photos Configured</dt>
          <dd className="font-medium text-ink">
            {photosCount} photo{photosCount === 1 ? '' : 's'}
          </dd>
        </div>

        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">LED Pedestal Base</dt>
          <dd className="font-medium text-ink">
            {baseEnabled ? (
              <span className="text-emerald-600 font-semibold">Included (USB Puck Cavity)</span>
            ) : (
              'None (Shade Only)'
            )}
          </dd>
        </div>

        {hasEngraving && (
          <div className="flex justify-between gap-4 text-[13.5px]">
            <dt className="text-muted">Base Engraving</dt>
            <dd className="font-medium text-ink font-mono truncate max-w-[180px]">
              &ldquo;{project.baseSettings.engravedText}&rdquo;
            </dd>
          </div>
        )}

        <div className="flex justify-between gap-4 text-[13.5px]">
          <dt className="text-muted">LED Backlight</dt>
          <dd className="font-medium text-ink capitalize">
            {lightEnabled ? `${lightPreset} (Included)` : 'Off'}
          </dd>
        </div>

        {/* Quantity Row */}
        <div className="flex justify-between items-center gap-4 text-[13.5px] pt-1">
          <dt className="text-muted">Quantity</dt>
          <dd>
            <QuantitySelector value={quantity} onChange={onQuantityChange} />
          </dd>
        </div>

        {/* Shipping Method Selector */}
        {shippingOptions.length > 0 && (
          <div className="flex justify-between items-center gap-4 text-[13.5px] pt-2 border-t border-line">
            <dt className="text-muted">Shipping</dt>
            <dd>
              <select
                value={shippingMethod?.name ?? shippingMethod?.id ?? ''}
                onChange={(e) => {
                  const m = shippingOptions.find(
                    (x) => (x.name || x.id) === e.target.value
                  )
                  if (m) onShippingChange(m)
                }}
                className="rounded-control border border-line bg-alt px-2.5 py-1 text-[12.5px] text-ink focus:border-accent focus:outline-none"
              >
                {shippingOptions.map((m) => {
                  const rawRate = Number(m.rate ?? m.priceCents ?? m.feeCents ?? 0)
                  const fee = !Number.isFinite(rawRate) || rawRate <= 0
                    ? 0
                    : (rawRate > 500 ? Math.round(rawRate / 100) : Math.round(rawRate))
                  const feeLabel = fee === 0 ? 'FREE' : `₹${fee}`
                  return (
                    <option key={m.id || m.name} value={m.name || m.id}>
                      {m.name} ({feeLabel})
                    </option>
                  )
                })}
              </select>
            </dd>
          </div>
        )}
      </dl>

      {/* Item-level Customer Note */}
      <div className="mt-4 pt-3.5 border-t border-line">
        <label
          htmlFor="photolamp-note-input"
          className="block font-sans text-[12px] font-bold tracking-[0.06em] uppercase text-accent mb-1.5"
        >
          Special Instructions / Gift Message <span className="text-muted font-normal lowercase tracking-normal">(optional)</span>
        </label>
        <textarea
          id="photolamp-note-input"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => onNoteChange && onNoteChange(e.target.value)}
          placeholder="e.g. Gift wrap message, specific lighting temperature preference, or delivery note…"
          className="w-full rounded-control border border-line bg-alt px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none resize-none"
        />
        <div className="flex justify-between items-center text-[10.5px] text-muted mt-1">
          {note.trim() ? (
            <button
              type="button"
              onClick={() => onNoteChange && onNoteChange('')}
              className="text-danger hover:underline cursor-pointer"
            >
              Clear note
            </button>
          ) : (
            <span />
          )}
          <span>{note.length}/500</span>
        </div>
      </div>

      {/* Added to Cart Success Banner */}
      {added && (
        <p className="mt-4 text-[13.5px] font-semibold text-[#17683f] bg-[#e3f4ea] px-3.5 py-2 rounded-control">
          &check; Added to cart.{' '}
          <Link to="/cart" className="underline font-bold">
            View cart
          </Link>
        </p>
      )}

      {/* Error Alert Banner */}
      {error && (
        <p className="mt-4 text-[13.5px] font-semibold text-danger bg-[#fbe6e2] px-3.5 py-2 rounded-control">
          {error}
        </p>
      )}

      {/* Validation Prompt when not ready */}
      {!canAdd && !busy && (
        <p className="mt-4 text-[12.5px] text-muted">
          Please upload your photo and verify 3D preview generation before adding to cart.
        </p>
      )}

      {/* Primary Action Buttons */}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onAddToCart}
          disabled={busy || !canAdd}
          className="w-full text-base font-semibold"
        >
          {busy
            ? (phase || 'Adding Photo Lamp to cart...')
            : calculatedTotal
            ? `Add Photo Lamp to Cart • ${calculatedTotal}`
            : 'Add Photo Lamp to Cart'}
        </Button>

        <div className="flex gap-3">
          <Link to="/cart" className="flex-1">
            <Button variant="secondary" size="md" className="w-full">
              View Cart
            </Button>
          </Link>
          {onOpenEstimator ? (
            <Button
              variant="ghost"
              size="md"
              onClick={onOpenEstimator}
              className="flex-1"
            >
              Cost Estimator
            </Button>
          ) : (
            <Link to="/products" className="flex-1">
              <Button variant="ghost" size="md" className="w-full">
                Shop All
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
