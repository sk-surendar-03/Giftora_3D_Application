import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  StudioLayout,
  ExportModal,
  CostCalculatorModal,
  HelpModal,
  createSunsetCoupleImage,
  getDefaultAdjustments,
  DEFAULT_COST_SETTINGS,
  useAddPhotoLampToCart,
  PHASE_LABELS,
  fetchPhotoLampOptions,
} from '../features/photoLampStudio'
import api from '../services/api'
import {
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  Info,
  X,
  FileDown,
} from 'lucide-react'

// Authoritative mapping from frontend studio shape IDs to backend pricing template IDs
const SHAPE_TO_TEMPLATE_ID = {
  cylinder: 'cylinder',
  rectangle: 'rectangle',
  four_sided: 'prism_4',
  prism_4: 'prism_4',
  heart: 'heart',
  curved: 'curved',
  moon: 'moon',
  hexagonal: 'lantern_6',
  lantern_6: 'lantern_6',
  circular: 'medallion',
  medallion: 'medallion',
  rotating: 'carousel_3',
  carousel_3: 'carousel_3',
}

function createDefaultProject() {
  return {
    id: 'giftora-lamp-' + Date.now(),
    name: 'Sunset Romance 3D Photo Lamp',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    shape: 'cylinder',
    photos: [
      {
        id: 'slot-1',
        label: 'Panoramic Photo',
        dataUrl: createSunsetCoupleImage(),
        originalName: 'Sunset Romance Silhouette',
        width: 600,
        height: 800,
        aspectRatio: 0.75,
        adjustments: getDefaultAdjustments(),
      },
    ],
    activePhotoIndex: 0,
    printSettings: {
      modelHeightMm: 120,
      modelWidthMm: 90,
      modelDiameterMm: 90,
      minThicknessMm: 0.8,
      maxThicknessMm: 3.2,
      borderWidthMm: 3.0,
      frameThicknessMm: 4.0,
      curveAngleDeg: 110,
      samplingResolution: 'medium',
      seamPosition: 'auto',
      smoothingRadius: 1,
    },
    baseSettings: {
      enabled: true,
      shape: 'circular',
      diameterMm: 96,
      heightMm: 24,
      cavityDiameterMm: 45,
      cavityDepthMm: 16,
      cableSlotWidthMm: 5.0,
      slotToleranceMm: 0.4,
      engravedText: 'Giftora 3D',
      engraveDepthMm: 0.8,
      separateLid: true,
      surfacePattern: 'smooth',
    },
    personalization: {
      theme: 'romantic',
      titleText: 'Alex & Maya',
      subtitleText: 'Forever & Always',
      dateText: '15.10.2024',
      fontFamily: 'serif',
      textStyle: 'engraved',
      placement: 'base',
      decorativeIcon: 'heart',
    },
    lighting: {
      isOn: true,
      colorPreset: 'warm',
      customColor: '#ffbb66',
      brightness: 85,
      rgbCycle: false,
      ambientDarkness: 70,
    },
  }
}

export default function PhotoLampCustomiser() {
  const [project, setProject] = useState(createDefaultProject)
  const [validationReport, setValidationReport] = useState({
    isValid: true,
    vertexCount: 0,
    triangleCount: 0,
    estimatedWeightGrams: 90,
    estimatedPrintTimeHours: 6.2,
    issues: [],
    manifold: true,
    boundingBox: { x: 90, y: 120, z: 90 },
  })

  // Geometries stored for 3D export & Add to Cart
  const [geometries, setGeometries] = useState({
    lithophane: null,
    base: null,
    frame: null,
  })

  // Snapshot preview captured from WebGL canvas
  const [previewSnapshot, setPreviewSnapshot] = useState(null)

  // Modals state
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [calculatorModalOpen, setCalculatorModalOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)

  // Commercial ordering state
  const [quantity, setQuantity] = useState(1)
  const [shippingOptions, setShippingOptions] = useState([])
  const [shippingMethod, setShippingMethod] = useState(null)
  const [itemNote, setItemNote] = useState('')
  const [pricingConfig, setPricingConfig] = useState(null)

  const { addToCart, phase, error: cartError, added, busy: cartBusy, clearAdded } = useAddPhotoLampToCart()

  // Reset added notification on changes
  useEffect(() => {
    if (clearAdded) clearAdded()
  }, [project, quantity, clearAdded])

  // Fetch Shipping Methods
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

  // Fetch Authoritative Designer Options & Pricing
  useEffect(() => {
    let cancelled = false
    fetchPhotoLampOptions()
      .then((opts) => {
        if (cancelled) return
        if (opts) setPricingConfig(opts)
      })
      .catch((err) => console.warn('Could not fetch photo lamp options:', err))
    return () => {
      cancelled = true
    }
  }, [])

  // Approximate solid volume in cm³ from validation report or dimensions
  const estimatedVolumeCm3 = useMemo(() => {
    const p = project.printSettings
    const surfaceMm2 = Math.PI * (p.modelDiameterMm || p.modelWidthMm) * p.modelHeightMm
    const avgThickMm = (p.minThicknessMm + p.maxThicknessMm) / 2
    const panelVolMm3 = surfaceMm2 * avgThickMm * 1.15
    const baseVolMm3 = project.baseSettings?.enabled
      ? Math.PI * Math.pow((project.baseSettings.diameterMm || 96) / 2, 2) * (project.baseSettings.heightMm || 24) * 0.45
      : 0
    return Math.max(15, Math.min(800, Math.round(((panelVolMm3 + baseVolMm3) / 1000) * 10) / 10))
  }, [project.printSettings, project.baseSettings])

  // Live Unit Price in ₹
  const unitPriceRupees = useMemo(() => {
    const templateId = SHAPE_TO_TEMPLATE_ID[project.shape] || project.shape
    const tplOpt = pricingConfig?.templates?.find(
      (t) => t.id === templateId || t.id === project.shape
    )
    const basePriceCents = tplOpt?.basePriceCents ?? 45000
    const ratePerCm3 = pricingConfig?.volumetricRatePerCm3Cents ?? 40
    const volumeCents = Math.round(estimatedVolumeCm3 * ratePerCm3)

    let addOnsCents = 0
    if (project.baseSettings?.enabled) addOnsCents += 9900
    if (project.baseSettings?.engravedText?.trim()) addOnsCents += 3500
    if (project.photos?.length > 1) {
      addOnsCents += (project.photos.length - 1) * 2500
    }

    return (basePriceCents + volumeCents + addOnsCents) / 100
  }, [pricingConfig, project.shape, project.baseSettings, project.photos, estimatedVolumeCm3])

  // Shipping Fee in ₹
  const shippingFeeRupees = useMemo(() => {
    if (!shippingMethod) return 0
    const rawRate = Number(shippingMethod.rate ?? shippingMethod.priceCents ?? shippingMethod.feeCents ?? 0)
    if (!Number.isFinite(rawRate) || rawRate <= 0) return 0
    return rawRate > 500 ? Math.round(rawRate / 100) : Math.round(rawRate)
  }, [shippingMethod])

  const totalPriceRupees = useMemo(() => {
    return unitPriceRupees * quantity + shippingFeeRupees
  }, [unitPriceRupees, quantity, shippingFeeRupees])

  // Geometries generated callback
  const handleGeometriesGenerated = useCallback(
    (litho, base, frame) => {
      setGeometries({ lithophane: litho, base, frame })
    },
    []
  )

  const handleSnapshotCaptured = useCallback((dataUrl) => {
    setPreviewSnapshot(dataUrl)
  }, [])

  const handleChangeProject = useCallback((updated) => {
    setProject((prev) => ({
      ...prev,
      ...updated,
      updatedAt: Date.now(),
    }))
  }, [])

  const handleOpenOrder = useCallback(() => {
    setOrderModalOpen(true)
  }, [])

  // Execute Add to Cart via hook
  const handleAddToCart = async () => {
    try {
      const templateId = SHAPE_TO_TEMPLATE_ID[project.shape] || project.shape
      await addToCart({
        title: project.name,
        templateId,
        shape: project.shape,
        printSettings: project.printSettings,
        baseSettings: project.baseSettings,
        lightingSettings: project.lighting,
        personalization: project.personalization,
        photos: project.photos,
        lithophaneGeometry: geometries.lithophane,
        baseGeometry: geometries.base,
        capturePreview: () => previewSnapshot,
        quantity,
        shippingMethod: shippingMethod?.id || shippingMethod?.code || shippingMethod?.name,
        note: itemNote,
      })
    } catch {
      // Error handled by hook
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Studio Top Navigation & Breadcrumbs */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur px-4 py-2.5 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/customise"
            className="text-xs font-semibold text-stone-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            &larr; Hub
          </Link>
          <span className="text-stone-700">|</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-sm font-bold text-white tracking-wide">
              3D Lithophane Photo Lamp Studio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHelpModalOpen(true)}
            className="px-2.5 py-1 text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
          >
            Guide
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Export Files</span>
          </button>
          <button
            onClick={handleOpenOrder}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Lamp (₹{Math.round(unitPriceRupees)})</span>
          </button>
        </div>
      </header>

      {/* Main Studio CAD Workspace */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <StudioLayout
          project={project}
          onChangeProject={handleChangeProject}
          onOpenExport={() => setExportModalOpen(true)}
          onOpenEstimator={() => setCalculatorModalOpen(true)}
          onAddToCart={handleOpenOrder}
          onSnapshotCaptured={handleSnapshotCaptured}
          validationReport={validationReport}
          onUpdateValidationReport={setValidationReport}
          lithophaneGeometry={geometries.lithophane}
          baseGeometry={geometries.base}
          frameGeometry={geometries.frame}
          onGeometriesGenerated={handleGeometriesGenerated}
        />
      </div>

      {/* Order & Checkout Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Order Custom Lithophane Lamp
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Manufactured on high-resolution 3D printers with LED base kit
                </p>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Design Snapshot */}
            <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center overflow-hidden shrink-0">
                {previewSnapshot ? (
                  <img
                    src={previewSnapshot}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-6 h-6 text-amber-400/50" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{project.name}</div>
                <div className="text-xs text-amber-400/90 font-mono mt-0.5 capitalize">
                  {project.shape.replace('_', ' ')} archetype &bull; {project.printSettings.modelHeightMm}mm H
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  Est. Solid Volume: {estimatedVolumeCm3} cm³ &bull; {project.photos.length} photo(s)
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-300">Quantity</span>
              <div className="flex items-center border border-stone-700 rounded-lg overflow-hidden bg-stone-800">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1 text-sm font-bold hover:bg-stone-700 text-stone-300 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-1 text-xs font-bold text-white font-mono bg-stone-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="px-3 py-1 text-sm font-bold hover:bg-stone-700 text-stone-300 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Shipping Method */}
            {shippingOptions.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-stone-400" />
                  Shipping Method
                </label>
                <select
                  value={shippingMethod?.id || shippingMethod?.code || shippingMethod?.name || ''}
                  onChange={(e) => {
                    const match = shippingOptions.find(
                      (m) => (m.id || m.code || m.name) === e.target.value
                    )
                    if (match) setShippingMethod(match)
                  }}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  {shippingOptions.map((opt, idx) => {
                    const optKey = opt.id || opt.code || opt.name || `shipping-opt-${idx}`
                    const rawRate = Number(opt.rate ?? opt.priceCents ?? opt.feeCents ?? 0)
                    const feeInRupees = !Number.isFinite(rawRate) || rawRate <= 0
                      ? 0
                      : (rawRate > 500 ? Math.round(rawRate / 100) : Math.round(rawRate))
                    const feeLabel = feeInRupees === 0 ? 'Free' : `₹${feeInRupees}`
                    return (
                      <option key={optKey} value={opt.id || opt.code || opt.name || ''}>
                        {opt.name} &bull; {feeLabel} ({opt.estimatedDelivery || opt.description || 'Standard'})
                      </option>
                    )
                  })}
                </select>
              </div>
            )}

            {/* Custom Gift Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Special Instructions / Gift Message (Optional)
              </label>
              <textarea
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Add special packaging notes, gift tags, or custom instructions..."
                rows={2}
                maxLength={300}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Price Breakdown */}
            <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Unit Price ({project.shape})</span>
                <span className="font-mono text-stone-200">₹{Math.round(unitPriceRupees)}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Quantity</span>
                <span className="font-mono text-stone-200">&times; {quantity}</span>
              </div>
              {shippingFeeRupees > 0 && (
                <div className="flex justify-between text-stone-400">
                  <span>Shipping</span>
                  <span className="font-mono text-stone-200">₹{Math.round(shippingFeeRupees)}</span>
                </div>
              )}
              <div className="border-t border-stone-800 pt-2 flex justify-between text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="text-amber-400 font-mono">₹{Math.round(totalPriceRupees)}</span>
              </div>
            </div>

            {/* Status Messages */}
            {cartError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{cartError}</span>
              </div>
            )}

            {added ? (
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">Photo Lamp Added to Cart!</div>
                    <div className="text-[11px] text-emerald-300/90 mt-0.5">
                      Your high-resolution 3D models and photos are safely stored.
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/cart"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>View Cart</span>
                  </Link>
                  <Link
                    to="/checkout"
                    className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={cartBusy}
                onClick={handleAddToCart}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-stone-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
              >
                {cartBusy ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>{PHASE_LABELS[phase] || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart &bull; ₹{Math.round(totalPriceRupees)}</span>
                  </>
                )}
              </button>
            )}

            <div className="text-[11px] text-stone-500 text-center flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              <span>Includes translucent lithophane shade, 3D printed base & USB LED light puck</span>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        project={project}
        lithophaneGeo={geometries.lithophane}
        baseGeo={geometries.base}
        frameGeo={geometries.frame}
        validationReport={validationReport}
        previewDataUrl={previewSnapshot}
      />

      {/* Cost Estimator Modal */}
      <CostCalculatorModal
        isOpen={calculatorModalOpen}
        onClose={() => setCalculatorModalOpen(false)}
        settings={DEFAULT_COST_SETTINGS}
        report={validationReport}
        onSaveSettings={() => {}}
      />

      {/* Help & Guide Modal */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </div>
  )
}
