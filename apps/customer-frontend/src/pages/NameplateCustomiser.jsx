import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NameplateCanvas } from '../features/nameplateStudio/components/NameplateCanvas'
import { ViewportControlsBar } from '../features/nameplateStudio/components/ViewportControlsBar'
import { StudioLeftPanel } from '../features/nameplateStudio/components/StudioLeftPanel'
import { TEMPLATES_LIBRARY } from '../features/nameplateStudio/core/presets'
import { useAddNameplateToCart, PHASE_LABELS } from '../features/nameplateStudio/hooks/useAddNameplateToCart'
import { fetchNameplateOptions } from '../features/nameplateStudio/api/nameplateDesignApi'
import { useAuth } from '../features/auth/useAuth'
import api from '../services/api'
import Button from '../components/ui/Button'
import NameplateFactsCard from '../components/customiser/NameplateFactsCard'
import NameplateCustomizationSummary from '../components/customiser/NameplateCustomizationSummary'

function createDefaultNameplateDesign() {
  return {
    id: `nameplate-${Date.now()}`,
    name: 'Executive Desk Nameplate',
    type: 'desk',
    shape: 'rounded-rectangle',
    mountingStyle: 'freestanding-desk',
    letteringMode: 'raised',
    materialFinish: 'metallic-pla',
    decoration: 'none',
    theme: 'Minimalist',
    widthMm: 180,
    heightMm: 50,
    baseThicknessMm: 4,
    cornerRadiusMm: 8,
    textExtrusionMm: 2.5,
    engravingDepthMm: 1.2,
    borderEnabled: true,
    borderThicknessMm: 3,
    borderWidthMm: 3,
    borderHeightMm: 2,
    textClearanceMm: 4,
    layerChangeHeightMm: 3.2,
    mountingHolesEnabled: false,
    mountingHoleDiameterMm: 4.5,
    mountingHoleInsetMm: 10,
    keyholeSlotEnabled: false,
    deskStandAngleDeg: 18,
    deskStandSupportRibs: true,
    baseColor: '#0D0D0D',
    secondaryBaseColor: '#1A1A1A',
    borderColor: '#D9AE4E',
    ledAccentColor: '#00E5FF',
    ledGlowEnabled: false,
    gradientPreviewEnabled: false,
    lines: [
      {
        id: 'line-1',
        text: 'SURENDAR',
        fontId: 'outfit',
        fontSize: 16,
        letterSpacing: 0.5,
        align: 'center',
        bold: true,
        italic: false,
        textTransform: 'uppercase',
        color: '#D9AE4E',
        yOffset: 0,
      },
    ],
  }
}

export default function NameplateCustomiser() {
  const [design, setDesign] = useState(createDefaultNameplateDesign)
  const [quantity, setQuantity] = useState(1)
  const [shippingOptions, setShippingOptions] = useState([])
  const [shippingMethod, setShippingMethod] = useState(null)
  const [pricingConfig, setPricingConfig] = useState(null)
  const [measurements, setMeasurements] = useState({ textWidthMm: 0, textHeightMm: 0, islandCount: 0 })

  const canvasRef = useRef(null)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { addToCart, phase, error: cartError, added, busy: cartBusy, clearAdded } = useAddNameplateToCart()

  const [cameraPreset, setCameraPreset] = useState('isometric')
  const [projection, setProjection] = useState('perspective')
  const [showBuildPlate, setShowBuildPlate] = useState(true)
  const [explodedPreview, setExplodedPreview] = useState(false)

  useEffect(() => {
    if (clearAdded) clearAdded()
  }, [design, quantity, clearAdded])

  // Load Shipping Methods
  useEffect(() => {
    let cancelled = false
    api
      .get('/settings/customizer/shipping')
      .then((res) => {
        if (cancelled) return
        const methods = Array.isArray(res.data?.methods) ? res.data.methods : []
        setShippingOptions(methods)
        if (methods.length > 0 && !shippingMethod) setShippingMethod(methods[0])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load Nameplate Pricing Options
  useEffect(() => {
    let cancelled = false
    fetchNameplateOptions()
      .then((opts) => {
        if (cancelled) return
        if (opts) {
          setPricingConfig(opts)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Approximate volume in cm³ for frontend guidance
  const estimatedVolumeCm3 = Math.max(
    10,
    Number(
      (
        ((design.widthMm * design.heightMm * design.baseThicknessMm * 0.75 +
          design.lines.length * 1200 +
          (design.borderEnabled ? 2800 : 0) +
          (design.mountingStyle === 'freestanding-desk' ? 4500 : 0)) /
          1000)
      ).toFixed(1)
    )
  )

  // Compute live price hint
  const basePriceCents =
    pricingConfig?.types?.find((t) => t.id === design.type)?.basePriceCents ?? 55000
  const ratePerCm3 = pricingConfig?.pricePerCm3Cents ?? 120
  const ledSurcharge = design.ledGlowEnabled ? (pricingConfig?.ledGlowSurchargeCents ?? 15000) : 0
  const layeredSurcharge =
    design.mountingStyle === 'layered-background'
      ? (pricingConfig?.layeredBackingSurchargeCents ?? 10000)
      : 0
  const unitPriceCents =
    basePriceCents + Math.ceil(estimatedVolumeCm3) * ratePerCm3 + ledSurcharge + layeredSurcharge

  const shippingCents = shippingMethod?.priceCents ?? 0
  const totalCents = unitPriceCents * quantity + shippingCents
  const totalRupees = totalCents / 100

  // Bounding envelope validation (max 260 x 140 mm)
  const canAdd = design.widthMm <= 260 && design.heightMm <= 140

  function resetCustomization() {
    setDesign(createDefaultNameplateDesign())
    setQuantity(1)
    if (shippingOptions.length > 0) setShippingMethod(shippingOptions[0])
  }

  function handleApplyTemplate(templateId) {
    const tpl = TEMPLATES_LIBRARY.find((t) => t.id === templateId)
    if (tpl) {
      setDesign((prev) => ({
        ...prev,
        ...tpl.design,
        id: prev.id,
        name: tpl.name,
      }))
    }
  }

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/customise/nameplate' } })
      return
    }
    if (!canAdd) return

    const exportGroup = canvasRef.current?.getExportGroup()
    if (!exportGroup) return

    try {
      await addToCart({
        design,
        exportGroup,
        quantity,
        shippingMethod,
        capturePreview: () => canvasRef.current?.capturePngDataUrl(),
      })
    } catch {
      // handled in hook
    }
  }

  return (
    <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-5">
      {/* Studio switcher pills */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to="/3d-customisation"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-alt px-3.5 py-1.5 text-[12.5px] font-semibold text-muted hover:text-accent hover:border-accent transition-colors"
        >
          ← 3D Studios Hub
        </Link>
        <Link
          to="/customise"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Name Keychain
        </Link>
        <Link
          to="/customise/stand"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="14" width="8" height="8" rx="1" />
            <path d="M10 18h4M14 14h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6" />
            <path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
          </svg>
          Phone & Pen Stand
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent/10 px-4 py-1.5 text-[13px] font-semibold text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          Nameplate
        </span>
      </div>

      {/* Top action bar */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-accent"
        >
          ← Browse products
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={resetCustomization} title="Reset all custom settings">
            Reset
          </Button>
          <Link to="/cart">
            <Button variant="secondary" size="sm" title="View your cart">
              Cart
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Reference 2-Column Workspace */}
      <div className="grid min-w-0 gap-6 min-[1041px]:grid-cols-[440px_minmax(0,1fr)] min-[1200px]:grid-cols-[460px_minmax(0,1fr)] min-[1041px]:items-start min-[1041px]:gap-8">
        {/* LEFT COLUMN: Controls Panel */}
        <aside className="min-w-0 space-y-5 order-2 min-[1041px]:order-1">
          <StudioLeftPanel
            design={design}
            onUpdateDesign={setDesign}
            onApplyTemplate={handleApplyTemplate}
          />
        </aside>

        {/* RIGHT COLUMN: Sticky 3D Canvas */}
        <main className="min-w-0 space-y-5 order-1 min-[1041px]:order-2 sticky top-0 max-[1040px]:z-20 max-[1040px]:bg-[var(--color-bg,#000000)] max-[1040px]:pb-3 min-[1041px]:top-5">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h1 className="font-display text-[26px] max-[760px]:text-[22px] font-semibold text-ink leading-tight m-0">
                Design Your 3D Nameplate
              </h1>
              <p className="mt-1 font-sans text-[13px] text-muted">Real-time 3D solid model preview</p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold bg-[#e3f4ea] text-[#17683f]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#17683f]" />
                Preview ready
              </span>
            </div>
          </div>

          <ViewportControlsBar
            cameraPreset={cameraPreset}
            onPresetChange={setCameraPreset}
            projection={projection}
            onProjectionChange={setProjection}
            showBuildPlate={showBuildPlate}
            onToggleBuildPlate={() => setShowBuildPlate((v) => !v)}
            explodedPreview={explodedPreview}
            onToggleExploded={() => setExplodedPreview((v) => !v)}
          />

          <div className="h-[480px] min-[1200px]:h-[540px] w-full rounded-card overflow-hidden border border-line bg-surface">
            <NameplateCanvas
              ref={canvasRef}
              design={design}
              cameraPreset={cameraPreset}
              projection={projection}
              showBuildPlate={showBuildPlate}
              explodedPreview={explodedPreview}
              onMeasurements={setMeasurements}
            />
          </div>

          {/* Desktop only: Facts Card and Customization Summary */}
          <div className="max-[1040px]:hidden space-y-5">
            <NameplateFactsCard />
            <NameplateCustomizationSummary
              design={design}
              volumeCm3={estimatedVolumeCm3}
              quantity={quantity}
              onQuantityChange={setQuantity}
              totalPriceRupees={totalRupees}
              shippingMethod={shippingMethod}
              shippingOptions={shippingOptions}
              onShippingChange={setShippingMethod}
              canAdd={canAdd}
              busy={cartBusy}
              phase={PHASE_LABELS[phase]}
              added={added}
              error={cartError}
              onAddToCart={handleAddToCart}
            />
          </div>
        </main>
      </div>

      {/* Mobile-only: Facts + Summary below all controls */}
      <div className="min-[1041px]:hidden mt-5 space-y-5">
        <NameplateFactsCard />
        <NameplateCustomizationSummary
          design={design}
          volumeCm3={estimatedVolumeCm3}
          quantity={quantity}
          onQuantityChange={setQuantity}
          totalPriceRupees={totalRupees}
          shippingMethod={shippingMethod}
          shippingOptions={shippingOptions}
          onShippingChange={setShippingMethod}
          canAdd={canAdd}
          busy={cartBusy}
          phase={PHASE_LABELS[phase]}
          added={added}
          error={cartError}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  )
}
