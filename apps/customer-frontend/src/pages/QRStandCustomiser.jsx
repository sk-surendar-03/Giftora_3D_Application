import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  QRStandViewer,
  QRStandCustomizer,
  createDesignFromTemplate,
  TEMPLATES,
} from '../features/qrStandStudio'
import { useAddQrStandToCart, PHASE_LABELS } from '../features/qrStandStudio/hooks/useAddQrStandToCart'
import { fetchQrStandOptions } from '../features/qrStandStudio/api/qrStandDesignApi'
import { useAuth } from '../features/auth/useAuth'
import api from '../services/api'
import Button from '../components/ui/Button'
import QRStandFactsCard from '../components/customiser/QRStandFactsCard'
import QRStandCustomizationSummary from '../components/customiser/QRStandCustomizationSummary'
import DraftControlsBar from '../components/customiser/DraftControlsBar'
import { useDraftPersistence } from '../features/customizerDraft/useDraftPersistence'
import {
  loadProductDraft,
  sanitizeQrStandDraft,
  deleteProductDraft,
} from '../features/customizerDraft/draftManager'

function createDefaultQRStandDesign() {
  return createDesignFromTemplate('classic_upright')
}

export default function QRStandCustomiser() {
  const [design, setDesign] = useState(() => {
    const saved = loadProductDraft('qrstand')
    if (saved?.data) {
      const sanitized = sanitizeQrStandDraft(saved.data, createDefaultQRStandDesign())
      if (sanitized) return sanitized
    }
    return createDefaultQRStandDesign()
  })

  const [quantity, setQuantity] = useState(1)
  const [shippingOptions, setShippingOptions] = useState([])
  const [shippingMethod, setShippingMethod] = useState(null)
  const [itemNote, setItemNote] = useState('')
  const [pricingConfig, setPricingConfig] = useState(null)
  const [cameraPreset, setCameraPreset] = useState('iso')
  const [wireframe, setWireframe] = useState(false)

  const viewerRef = useRef(null)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { addToCart, phase, error: cartError, added, busy: cartBusy, clearAdded } = useAddQrStandToCart()

  const {
    hasDraft,
    savedAt,
    saveStatus,
    saveDraft: manualSaveDraft,
    deleteDraft: manualDeleteDraft,
    getRestoredData,
  } = useDraftPersistence({
    productType: 'qrstand',
    currentData: design,
    sanitizeFn: (data) => sanitizeQrStandDraft(data, createDefaultQRStandDesign()),
  })

  function handleRestoreDraft() {
    const restored = getRestoredData()
    if (restored) {
      setDesign(restored)
    }
  }

  function handleReset() {
    if (window.confirm('Reset all customizations to default Classic Upright stand?')) {
      manualDeleteDraft()
      setDesign(createDefaultQRStandDesign())
    }
  }

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

  // Load QR Stand Options & Pricing Config
  useEffect(() => {
    let cancelled = false
    fetchQrStandOptions()
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

  // Approximate solid volume in cm³ from dimensions
  const estimatedVolumeCm3 = useMemo(() => {
    const d = design.dimensions
    const plateVol = (d.widthMm * d.heightMm * d.plateThicknessMm) / 1000
    const baseVol = d.baseWidthMm ? (d.baseWidthMm * d.baseDepthMm * d.baseThicknessMm) / 1000 : 0
    return Math.max(10, Math.min(500, Math.round((plateVol * 0.65 + baseVol * 0.8) * 10) / 10))
  }, [design.dimensions])

  // Compute live price estimate in ₹
  const unitPriceRupees = useMemo(() => {
    const tplOpt = pricingConfig?.templates?.find((t) => t.id === design.templateId)
    const basePriceCents = tplOpt?.basePriceCents ?? 35000
    const ratePerCm3 = pricingConfig?.volumetricRatePerCm3Cents ?? 50
    const volumeCents = Math.round(estimatedVolumeCm3 * ratePerCm3)

    let addOnsCents = 0
    if (design.logo?.enabled) addOnsCents += 5000
    if (design.printingMode === 'inlay') addOnsCents += 4000
    if (design.dimensions?.frontAndRearLayout) addOnsCents += 7500

    return (basePriceCents + volumeCents + addOnsCents) / 100
  }, [pricingConfig, design.templateId, design.logo?.enabled, design.printingMode, design.dimensions?.frontAndRearLayout, estimatedVolumeCm3])

  const totalPriceRupees = unitPriceRupees * quantity

  const primaryQr = design.qrCodes?.[0]
  const canAdd = Boolean(
    primaryQr &&
    (primaryQr.fields.url || primaryQr.fields.upiVpa || primaryQr.fields.wifiSsid || primaryQr.fields.customText || primaryQr.fields.instagramHandle)
  )

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/customise/qr-stand' } })
      return
    }
    if (!canAdd) return

    const parts = viewerRef.current?.getParts?.()

    try {
      await addToCart({
        design,
        parts,
        quantity,
        shippingMethod,
        note: itemNote.trim() || undefined,
        capturePreview: () => viewerRef.current?.capturePreview?.(),
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
          to="/customise/nameplate"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h6" />
          </svg>
          Nameplate
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-500 bg-emerald-500/10 px-4 py-1.5 text-[13px] font-semibold text-emerald-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          QR Stand
        </span>
        <Link
          to="/customise/photo-lamp"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          Photo Lamp
        </Link>
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
          <Button variant="secondary" size="sm" onClick={handleReset} title="Reset all custom settings">
            Reset
          </Button>
          <Link to="/cart">
            <Button variant="secondary" size="sm" title="View your cart">
              Cart
            </Button>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Studio Workspace */}
      <div className="grid min-w-0 gap-6 min-[1041px]:grid-cols-[460px_minmax(0,1fr)] min-[1200px]:grid-cols-[480px_minmax(0,1fr)] min-[1041px]:items-start min-[1041px]:gap-8">
        {/* LEFT COLUMN: Controls Panel */}
        <aside className="min-w-0 space-y-5 order-2 min-[1041px]:order-1">
          <QRStandCustomizer
            design={design}
            onChange={setDesign}
            cameraPreset={cameraPreset}
            onCameraChange={setCameraPreset}
            wireframe={wireframe}
            onWireframeToggle={() => setWireframe((w) => !w)}
          />

          {/* Mobile-only Summary and Actions below controls */}
          <div className="min-[1041px]:hidden space-y-5 pt-4">
            <DraftControlsBar
              hasDraft={hasDraft}
              savedAt={savedAt}
              saveStatus={saveStatus}
              onSave={manualSaveDraft}
              onRestore={handleRestoreDraft}
              onDelete={manualDeleteDraft}
              productLabel="QR Stand"
            />
            <QRStandFactsCard />
            <QRStandCustomizationSummary
              design={design}
              volumeCm3={estimatedVolumeCm3}
              quantity={quantity}
              onQuantityChange={setQuantity}
              totalPriceRupees={totalPriceRupees}
              shippingMethod={shippingMethod}
              shippingOptions={shippingOptions}
              onShippingChange={setShippingMethod}
              canAdd={canAdd}
              busy={cartBusy}
              phase={PHASE_LABELS[phase]}
              added={added}
              error={cartError}
              note={itemNote}
              onNoteChange={setItemNote}
              onAddToCart={handleAddToCart}
            />
          </div>
        </aside>

        {/* RIGHT COLUMN: Sticky 3D Canvas & Desktop Summary */}
        <main className="min-w-0 space-y-5 order-1 min-[1041px]:order-2 sticky top-0 max-[1040px]:z-20 max-[1040px]:bg-[var(--color-bg,#000000)] max-[1040px]:pb-3 min-[1041px]:top-5">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h1 className="font-display text-[26px] max-[760px]:text-[22px] font-semibold text-ink leading-tight m-0">
                Design Your 3D QR Stand
              </h1>
              <p className="mt-1 font-sans text-[13px] text-muted">
                Interactive solid model with multi-color dual-extrusion preview
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold bg-[#e3f4ea] text-[#17683f]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#17683f]" />
                Engine Active
              </span>
            </div>
          </div>

          {/* 3D Viewport Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-surface p-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted font-semibold px-2">Camera:</span>
              {(['iso', 'front', 'side', 'top', 'back']).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCameraPreset(preset)}
                  className={`rounded-control px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    cameraPreset === preset
                      ? 'bg-accent text-white font-semibold'
                      : 'text-muted hover:text-ink hover:bg-alt'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setWireframe((w) => !w)}
              className={`rounded-control px-2.5 py-1 text-xs font-medium transition-colors ${
                wireframe ? 'bg-accent text-white' : 'border border-line bg-alt text-muted hover:text-ink'
              }`}
            >
              Wireframe: {wireframe ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 3D WebGL Canvas */}
          <QRStandViewer
            ref={viewerRef}
            design={design}
            cameraPreset={cameraPreset}
            wireframe={wireframe}
          />

          {/* Desktop only: Facts Card and Customization Summary */}
          <div className="max-[1040px]:hidden space-y-5">
            <DraftControlsBar
              hasDraft={hasDraft}
              savedAt={savedAt}
              saveStatus={saveStatus}
              onSave={manualSaveDraft}
              onRestore={handleRestoreDraft}
              onDelete={manualDeleteDraft}
              productLabel="QR Stand"
            />
            <QRStandFactsCard />
            <QRStandCustomizationSummary
              design={design}
              volumeCm3={estimatedVolumeCm3}
              quantity={quantity}
              onQuantityChange={setQuantity}
              totalPriceRupees={totalPriceRupees}
              shippingMethod={shippingMethod}
              shippingOptions={shippingOptions}
              onShippingChange={setShippingMethod}
              canAdd={canAdd}
              busy={cartBusy}
              phase={PHASE_LABELS[phase]}
              added={added}
              error={cartError}
              note={itemNote}
              onNoteChange={setItemNote}
              onAddToCart={handleAddToCart}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
