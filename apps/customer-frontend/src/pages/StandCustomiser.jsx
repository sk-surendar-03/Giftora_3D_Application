import { useState, useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FEATURES } from '../config/features'
import { StudioViewport } from '../features/standStudio/components/StudioViewport'
import { ViewportControlsBar } from '../features/standStudio/components/ViewportControlsBar'
import { StudioLeftPanel } from '../features/standStudio/components/StudioLeftPanel'
import { createDefaultDesign, DESIGN_THEMES } from '../features/standStudio/core/defaults'
import { TEMPLATE_LIBRARY, instantiateTemplate } from '../features/standStudio/core/templates'
import { buildStandAssembly, disposeAssembly } from '../features/standStudio/geometry/standBuilder'
import { validateDesignConfig } from '../features/standStudio/core/validation'
import { useAddStandToCart, PHASE_LABELS } from '../features/standDesign/useAddStandToCart.js'
import { computeStandPriceCents } from '../features/standDesign/standPricing.js'
import { fetchStandOptions } from '../features/standDesign/standDesignApi.js'
import { useAuth } from '../features/auth/useAuth.js'
import api from '../services/api'
import Button from '../components/ui/Button'
import StandFactsCard from '../components/customiser/StandFactsCard'
import StandCustomizationSummary from '../components/customiser/StandCustomizationSummary'

// Route entry: hidden behind the `standCustomiser` feature flag until launch.
export default function StandCustomiser() {
  if (!FEATURES.standCustomiser) {
    return <Navigate to="/customise" replace />
  }
  return <StandCustomiserWorkspace />
}

function StandCustomiserWorkspace() {
  const [design, setDesign] = useState(() => createDefaultDesign('combined', 'minimalist'))
  const [quantity, setQuantity] = useState(1)
  const [shippingOptions, setShippingOptions] = useState([])
  const [shippingMethod, setShippingMethod] = useState(null)
  const [standPricingConfig, setStandPricingConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [assembly, setAssembly] = useState(null)
  const assemblyRef = useRef(null)
  const viewportRef = useRef(null)

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { addToCart, phase, error: cartError, added, busy: cartBusy, clearAdded } = useAddStandToCart()

  const [viewport, setViewport] = useState({
    cameraPreset: 'iso',
    projection: 'perspective',
    showGrid: true,
    showBuildPlate: true,
    showDimensions: false,
    showPhoneMockup: false,
    showPensMockup: false,
    explodedAmount: 0,
  })
  const [frameTrigger, setFrameTrigger] = useState(1)
  const handleFitCamera = () => setFrameTrigger((c) => c + 1)

  // Clear "Added to cart" message if design or quantity changes
  useEffect(() => {
    if (clearAdded) clearAdded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, quantity])

  useEffect(() => {
    let cancelled = false
    api.get('/settings/customizer/shipping').then((res) => {
      if (cancelled) return
      const methods = Array.isArray(res.data?.methods) ? res.data.methods : []
      setShippingOptions(methods)
      if (methods.length > 0 && !shippingMethod) setShippingMethod(methods[0])
    }).catch(() => {
      // Shipping methods are optional; fall back to none.
    })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false
    fetchStandOptions().then((opts) => {
      if (cancelled) return
      if (opts) {
        setStandPricingConfig({
          pricePerCm3Cents: opts.pricePerCm3Cents,
          categories: Object.fromEntries(
            (opts.categories || []).map((c) => [c.id, { basePriceCents: c.basePriceCents }])
          ),
        })
      }
    }).catch(() => {
      // Fall back to defaults
    })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true)
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      try {
        const result = buildStandAssembly(design)
        if (!cancelled) {
          if (assemblyRef.current) disposeAssembly(assemblyRef.current)
          assemblyRef.current = result
          setAssembly(result)
        }
      } catch (err) {
        console.error('Assembly error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 150)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [design])

  const validation = assembly
    ? validateDesignConfig(design, assembly.dimensions)
    : { validForExport: false, issues: [], dimensions: { width: 0, depth: 0, height: 0 }, fitsBed: false, bedLimit: { x: 220, y: 220, z: 250 } }

  const volumeCm3 = assembly?.solidVolumeCm3 ?? 0
  const standPriceCents = computeStandPriceCents(design.category, volumeCm3, standPricingConfig)
  const shippingCents = shippingMethod?.priceCents ?? 0
  const totalCents = standPriceCents * quantity + shippingCents
  const totalRupees = totalCents / 100

  const updateDesign = (updater) => setDesign((prev) => {
    const next = typeof updater === 'function' ? updater(prev) : updater
    return { ...next, updatedAt: new Date().toISOString() }
  })

  function resetCustomization() {
    setDesign(createDefaultDesign('combined', 'minimalist'))
    setQuantity(1)
    if (shippingOptions.length > 0) setShippingMethod(shippingOptions[0])
  }

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/customise/stand' } })
      return
    }
    if (!validation.validForExport) return
    try {
      await addToCart({
        design,
        assembly,
        quantity,
        shippingMethod,
        capturePreview: () => viewportRef.current?.capturePngDataUrl(),
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          Name Keychain
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent/10 px-4 py-1.5 text-[13px] font-semibold text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="14" width="8" height="8" rx="1" /><path d="M10 18h4M14 14h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6" /><path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" /></svg>
          Phone & Pen Stand
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
            config={design}
            svgError={assembly?.svgError || null}
            onChange={updateDesign}
            onApplyTheme={(themeId) => {
              const theme = DESIGN_THEMES[themeId]
              updateDesign((prev) => ({
                ...prev,
                phone: { ...prev.phone, cornerRadius: theme.recommendedCornerRadius },
                personalization: { ...prev.personalization, fontStyle: theme.recommendedFont, motif: theme.recommendedMotif },
                appearance: { themeId, finish: theme.finish, colors: { ...theme.colors } },
              }))
            }}
            onApplyTemplate={(templateId) => {
              const tpl = TEMPLATE_LIBRARY.find((t) => t.id === templateId)
              if (tpl) updateDesign(instantiateTemplate(tpl, design.print))
            }}
          />

          {/* Shipping Method Section (matching Name Keychain) */}
          {shippingOptions.length > 0 && (
            <div className="rounded-card border border-line bg-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
                  Shipping & Delivery
                </span>
                <span className="text-xs text-muted">Select method</span>
              </div>
              <div className="space-y-2">
                {shippingOptions.map((method) => {
                  const isSelected = shippingMethod?.name === method.name
                  return (
                    <button
                      key={method.name}
                      type="button"
                      onClick={() => setShippingMethod(method)}
                      className={`w-full flex items-center justify-between rounded-control border px-4 py-3 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent bg-accent/10 text-ink ring-1 ring-accent shadow-xs'
                          : 'border-line bg-alt hover:border-accent/40 text-muted'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-semibold text-ink block">{method.name}</span>
                        {method.estimatedDays && (
                          <span className="text-xs text-muted mt-0.5 block">{method.estimatedDays}</span>
                        )}
                      </div>
                      <span className={`text-sm font-bold font-mono ${isSelected ? 'text-accent' : 'text-muted'}`}>
                        {method.priceCents === 0
                          ? 'FREE'
                          : `₹${(method.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT COLUMN: 3D Preview — sticky on both mobile and desktop */}
        <main className="min-w-0 space-y-5 order-1 min-[1041px]:order-2 sticky top-0 max-[1040px]:z-20 max-[1040px]:bg-[var(--color-bg,#000000)] max-[1040px]:pb-3 min-[1041px]:top-5">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h1 className="font-display text-[26px] max-[760px]:text-[22px] font-semibold text-ink leading-tight m-0">
                Design Your 3D Stand
              </h1>
              <p className="mt-1 font-sans text-[13px] text-muted">Real-time 3D solid model preview</p>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                loading ? 'bg-soft text-accent' : 'bg-[#e3f4ea] text-[#17683f]'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-accent animate-pulse' : 'bg-[#17683f]'}`} />
                {loading ? 'Rendering 3D solid' : 'Preview ready'}
              </span>
            </div>
          </div>

          {/* Viewport Controls Bar */}
          <ViewportControlsBar
            viewport={viewport}
            hasPhone={assembly?.phonePose?.enabled || false}
            hasPens={(assembly?.penSlots?.length || 0) > 0}
            hasMultipleParts={(assembly?.parts?.length || 0) > 1}
            onChange={setViewport}
            onFitCamera={handleFitCamera}
          />

          {/* 3D Viewport Component */}
          <div className="relative w-full rounded-card overflow-hidden border border-line bg-surface" style={{ height: '480px' }}>
            {assembly ? (
              <StudioViewport
                ref={viewportRef}
                config={design}
                assembly={assembly}
                viewport={viewport}
                bedLimit={validation.bedLimit || { x: 220, y: 220, z: 250 }}
                darkMode={true}
                frameTrigger={frameTrigger}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted">Loading 3D preview...</div>
            )}
          </div>

          {/* Live Stand Facts Card — desktop only */}
          <div className="max-[1040px]:hidden">
            <StandFactsCard
              dimensions={assembly?.dimensions}
              volumeCm3={volumeCm3}
              validation={validation}
            />
          </div>

          {/* Specification / Pricing & Payment Summary — desktop only */}
          <div className="max-[1040px]:hidden">
            <StandCustomizationSummary
              design={design}
              volumeCm3={volumeCm3}
              quantity={quantity}
              onQuantityChange={setQuantity}
              totalPriceRupees={totalRupees}
              shippingMethod={shippingMethod}
              shippingOptions={shippingOptions}
              onShippingChange={setShippingMethod}
              canAdd={validation.validForExport && !loading && Boolean(assembly)}
              busy={cartBusy}
              phase={PHASE_LABELS[phase]}
              added={added}
              error={cartError}
              onAddToCart={handleAddToCart}
            />
          </div>
        </main>
      </div>

      {/* Mobile-only: Stand Facts + Summary below all controls */}
      <div className="min-[1041px]:hidden mt-5 space-y-5">
        <StandFactsCard
          dimensions={assembly?.dimensions}
          volumeCm3={volumeCm3}
          validation={validation}
        />
        <StandCustomizationSummary
          design={design}
          volumeCm3={volumeCm3}
          quantity={quantity}
          onQuantityChange={setQuantity}
          totalPriceRupees={totalRupees}
          shippingMethod={shippingMethod}
          shippingOptions={shippingOptions}
          onShippingChange={setShippingMethod}
          canAdd={validation.validForExport && !loading && Boolean(assembly)}
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
