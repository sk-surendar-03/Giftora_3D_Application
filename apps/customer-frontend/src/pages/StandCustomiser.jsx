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
import { computeStandPriceCents, formatRupees } from '../features/standDesign/standPricing.js'
import { useAuth } from '../features/auth/useAuth.js'
import api from '../services/api'
import Button from '../components/ui/Button'
import QuantitySelector from '../components/product/QuantitySelector'

// Route entry: hidden behind the `standCustomiser` feature flag until launch.
// Redirecting here (instead of rendering the workspace) keeps the flag check
// outside the component body so hooks are never called conditionally.
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
  const [loading, setLoading] = useState(false)
  const [assembly, setAssembly] = useState(null)
  const assemblyRef = useRef(null)
  const viewportRef = useRef(null)

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { addToCart, phase, error: cartError, added, busy: cartBusy } = useAddStandToCart()

  const [viewport, setViewport] = useState({
    cameraPreset: 'iso', projection: 'perspective', showGrid: true, showBuildPlate: true,
    showDimensions: false, showPhoneMockup: false, showPensMockup: false, explodedAmount: 0,
  })

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
  const standPriceCents = computeStandPriceCents(design.category, volumeCm3)
  const shippingCents = shippingMethod?.priceCents ?? 0
  const totalCents = standPriceCents * quantity + shippingCents

  const updateDesign = (updater) => setDesign((prev) => {
    const next = typeof updater === 'function' ? updater(prev) : updater
    return { ...next, updatedAt: new Date().toISOString() }
  })

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
    } catch (err) {
      // handled in hook
    }
  }

  return (
    <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-5">
      {/* Studio switcher pills */}
      <div className="mb-4 flex gap-3">
        <Link to="/customise" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-accent transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> Name Keychain
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent/10 px-4 py-1.5 text-[13px] font-semibold text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="14" width="8" height="8" rx="1" /><path d="M10 18h4M14 14h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6" /><path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" /></svg> Phone & Pen Stand
        </span>
      </div>

      {/* 2-Column Layout matching Keychain */}
      <div className="grid min-w-0 gap-6 min-[1041px]:grid-cols-[440px_minmax(0,1fr)] min-[1200px]:grid-cols-[460px_minmax(0,1fr)] min-[1041px]:items-start min-[1041px]:gap-8">
        
        {/* LEFT COLUMN: Studio Controls */}
        <aside className="min-w-0 order-2 min-[1041px]:order-1 rounded-card border border-line bg-surface overflow-hidden h-[calc(100vh-240px)] min-h-[600px]">
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
        </aside>

        {/* RIGHT COLUMN: 3D Viewport + Summary */}
        <main className="min-w-0 space-y-5 order-1 min-[1041px]:order-2 sticky top-0 min-[1041px]:top-5">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h1 className="font-display text-[26px] max-[760px]:text-[22px] font-semibold text-ink leading-tight m-0">Design Your 3D Stand</h1>
              <p className="mt-1 font-sans text-[13px] text-muted">Real-time 3D solid model preview</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${loading ? 'bg-soft text-accent' : 'bg-[#e3f4ea] text-[#17683f]'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-accent animate-pulse' : 'bg-[#17683f]'}`} />
              {loading ? 'Rendering 3D' : 'Preview ready'}
            </span>
          </div>

          <div className="relative w-full rounded-card overflow-hidden border border-line" style={{ height: '450px', background: '#0f172a' }}>
            {assembly ? (
              <StudioViewport
                ref={viewportRef}
                config={design}
                assembly={assembly}
                viewport={viewport}
                bedLimit={validation.bedLimit || { x: 220, y: 220, z: 250 }}
                darkMode={true}
                frameTrigger={1}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted">Loading 3D preview...</div>
            )}
            <ViewportControlsBar
              viewport={viewport}
              hasPhone={assembly?.phonePose?.enabled || false}
              hasPens={(assembly?.penSlots?.length || 0) > 0}
              hasMultipleParts={(assembly?.parts?.length || 0) > 1}
              onChange={setViewport}
              onFitCamera={() => {}}
            />
          </div>

          {/* YOUR SPECIFICATION CARD */}
          <div className="rounded-card border border-line bg-surface p-6 mt-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-line">
              <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0">Your Specification</h3>
              <span className="font-sans text-[22px] font-bold text-ink">{formatRupees(totalCents)}</span>
            </div>

            <dl className="mt-4 space-y-2">
              <div className="flex justify-between gap-4 text-[13.5px]"><dt className="text-muted">Category</dt><dd className="font-medium text-ink capitalize">{design.category.replace('-', ' ')}</dd></div>
              <div className="flex justify-between gap-4 text-[13.5px]"><dt className="text-muted">Theme</dt><dd className="font-medium text-ink capitalize">{design.appearance.themeId.replace('-', ' ')}</dd></div>
              <div className="flex justify-between gap-4 text-[13.5px]"><dt className="text-muted">Finish</dt><dd className="font-medium text-ink capitalize">{design.appearance.finish.replace('-', ' ')}</dd></div>
              {design.personalization.enabled && (
                <div className="flex justify-between gap-4 text-[13.5px]"><dt className="text-muted">Text</dt><dd className="font-medium text-ink">{design.personalization.text}</dd></div>
              )}
              <div className="flex justify-between gap-4 text-[13.5px]"><dt className="text-muted">Volume</dt><dd className="font-medium text-ink">{volumeCm3.toFixed(1)} cm3</dd></div>
              <div className="flex justify-between items-center gap-4 text-[13.5px]">
                <dt className="text-muted">Quantity</dt>
                <dd><QuantitySelector value={quantity} onChange={setQuantity} /></dd>
              </div>
              <div className="flex justify-between gap-4 text-[13.5px]"><dt className="text-muted">Shipping</dt><dd className="font-medium text-ink">
                {shippingOptions.length > 0 ? (
                  <select
                    value={shippingMethod?.name ?? ''}
                    onChange={(e) => {
                      const m = shippingOptions.find((x) => x.name === e.target.value)
                      if (m) setShippingMethod(m)
                    }}
                    className="rounded-control border border-line bg-surface px-2 py-1 text-[13px] text-ink"
                  >
                    {shippingOptions.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} — {formatRupees(m.priceCents)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-muted">No shipping methods configured</span>
                )}
              </dd></div>
            </dl>

            {added && (
              <p className="mt-4 text-[13.5px] font-semibold text-[#17683f] bg-[#e3f4ea] px-3.5 py-2 rounded-control">
                Added to cart. <Link to="/cart" className="underline">View cart</Link>
              </p>
            )}
            {cartError && (
              <p className="mt-4 text-[13.5px] font-semibold text-danger bg-danger/10 px-3.5 py-2 rounded-control">{cartError}</p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={cartBusy || !validation.validForExport}
                className="w-full text-base font-semibold bg-accent hover:bg-accent/90 text-on-accent border-0"
              >
                {cartBusy ? (PHASE_LABELS[phase] || 'Working...') : 'Add This Stand to Cart'}
              </Button>
              <div className="flex gap-3">
                <Link to="/cart" className="flex-1"><Button variant="secondary" size="md" className="w-full">View Cart</Button></Link>
                <Link to="/products" className="flex-1"><Button variant="ghost" size="md" className="w-full">Shop All</Button></Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}