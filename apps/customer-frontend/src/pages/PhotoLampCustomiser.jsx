import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import {
  LithophaneViewer,
  PhotoLampStudioControls,
  PhotoEditorModal,
  ExportModal,
  CostCalculatorModal,
  HelpModal,
  createSunsetCoupleImage,
  getDefaultAdjustments,
  DEFAULT_COST_SETTINGS,
  useAddPhotoLampToCart,
  PHASE_LABELS,
  fetchPhotoLampOptions,
  generateCylindricalLithophane,
  generateRectangularLithophane,
  generateCurvedLithophane,
  generateHeartLithophane,
  generateMoonLithophane,
  generateCircularLithophane,
  generatePrismLithophane,
  generatePrintableLampBase,
  generateLampFrame,
  validateMeshGeometry,
  processImageForLithophane,
  loadImageElement,
} from '../features/photoLampStudio'
import api from '../services/api'
import { useAuth } from '../features/auth/useAuth'
import Button from '../components/ui/Button'
import PhotoLampFactsCard from '../components/customiser/PhotoLampFactsCard'
import PhotoLampCustomizationSummary from '../components/customiser/PhotoLampCustomizationSummary'
import DraftControlsBar from '../components/customiser/DraftControlsBar'
import { useDraftPersistence } from '../features/customizerDraft/useDraftPersistence'
import {
  loadProductDraft,
  sanitizePhotoLampDraft,
  deleteProductDraft,
} from '../features/customizerDraft/draftManager'

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
  const [project, setProject] = useState(() => {
    const saved = loadProductDraft('photolamp')
    if (saved?.data) {
      const sanitized = sanitizePhotoLampDraft(saved.data, createDefaultProject())
      if (sanitized) return sanitized
    }
    return createDefaultProject()
  })

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

  // Processed 2D photo canvas for translucent lithophane texture mapping
  const [processedCanvas, setProcessedCanvas] = useState(null)

  // Snapshot preview captured from WebGL canvas
  const [previewSnapshot, setPreviewSnapshot] = useState(null)

  // Modals state
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [calculatorModalOpen, setCalculatorModalOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [editorModalOpen, setEditorModalOpen] = useState(false)
  const [editingPhotoIndex, setEditingPhotoIndex] = useState(0)

  // Commercial ordering state
  const [quantity, setQuantity] = useState(1)
  const [shippingOptions, setShippingOptions] = useState([])
  const [shippingMethod, setShippingMethod] = useState(null)
  const [itemNote, setItemNote] = useState('')
  const [pricingConfig, setPricingConfig] = useState(null)

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const {
    addToCart,
    phase,
    error: cartError,
    added,
    busy: cartBusy,
    clearAdded,
  } = useAddPhotoLampToCart()

  const {
    hasDraft,
    savedAt,
    saveStatus,
    saveDraft: manualSaveDraft,
    deleteDraft: manualDeleteDraft,
    getRestoredData,
  } = useDraftPersistence({
    productType: 'photolamp',
    currentData: project,
    sanitizeFn: (data) => sanitizePhotoLampDraft(data, createDefaultProject()),
  })

  function handleRestoreDraft() {
    const restored = getRestoredData()
    if (restored) {
      setProject(restored)
    }
  }

  function handleReset() {
    if (window.confirm('Reset all Photo Lamp settings to default?')) {
      manualDeleteDraft()
      setProject(createDefaultProject())
    }
  }

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

  // Approximate solid volume in cm³
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

  // Re-generate geometry when project parameters or photo data change
  useEffect(() => {
    let isCancelled = false

    const runGeneration = async () => {
      const activePhoto = project.photos[project.activePhotoIndex] || project.photos[0]
      if (!activePhoto?.dataUrl) return

      try {
        const img = await loadImageElement(activePhoto.dataUrl)
        if (isCancelled) return

        let sampleWidth = 200
        if (project.printSettings.samplingResolution === 'low') sampleWidth = 120
        else if (project.printSettings.samplingResolution === 'high') sampleWidth = 300
        else if (project.printSettings.samplingResolution === 'ultra') sampleWidth = 450

        const processed = processImageForLithophane(
          img,
          activePhoto.adjustments,
          sampleWidth
        )
        if (isCancelled) return

        setProcessedCanvas(processed.canvas)

        let lithoGeo
        const gridW = processed.width
        const gridH = processed.height

        switch (project.shape) {
          case 'cylinder':
          case 'rotating':
            lithoGeo = generateCylindricalLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            )
            break
          case 'curved':
            lithoGeo = generateCurvedLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            )
            break
          case 'four_sided':
          case 'hexagonal':
            lithoGeo = generatePrismLithophane(
              [processed.thicknessMap],
              project.shape === 'four_sided' ? 4 : 6,
              Math.min(160, gridW),
              Math.min(160, gridH),
              project.printSettings
            )
            break
          case 'heart':
            lithoGeo = generateHeartLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            )
            break
          case 'moon':
            lithoGeo = generateMoonLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            )
            break
          case 'circular':
            lithoGeo = generateCircularLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            )
            break
          case 'rectangle':
          default:
            lithoGeo = generateRectangularLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            )
            break
        }

        let baseGeo = null
        if (project.baseSettings.enabled) {
          baseGeo = generatePrintableLampBase(
            project.shape,
            project.baseSettings,
            project.printSettings,
            project.personalization
          )
        }

        const frameGeo = generateLampFrame(project.shape, project.printSettings)
        const report = validateMeshGeometry(lithoGeo, project.printSettings)
        if (isCancelled) return

        setValidationReport({ ...report, isValid: true })
        setGeometries({ lithophane: lithoGeo, base: baseGeo, frame: frameGeo })
      } catch (err) {
        console.error('Photo Lamp Mesh generation failed:', err)
      }
    }

    runGeneration()

    return () => {
      isCancelled = true
    }
  }, [
    project.shape,
    project.photos,
    project.activePhotoIndex,
    project.printSettings,
    project.baseSettings,
    project.personalization,
  ])

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

  const handleOpenEditor = useCallback((index) => {
    setEditingPhotoIndex(index)
    setEditorModalOpen(true)
  }, [])

  const handleSavePhotoAdjustments = useCallback(
    (adjustments, processedDataUrl) => {
      setProject((prev) => {
        const newPhotos = [...prev.photos]
        newPhotos[editingPhotoIndex] = {
          ...newPhotos[editingPhotoIndex],
          adjustments,
          thumbnailUrl: processedDataUrl,
        }
        return {
          ...prev,
          photos: newPhotos,
          updatedAt: Date.now(),
        }
      })
    },
    [editingPhotoIndex]
  )

  const canAdd = Boolean(
    project.photos?.length > 0 &&
    geometries.lithophane &&
    (validationReport.isValid ?? validationReport.isWatertight ?? true)
  )

  // Execute Add to Cart via authoritative hook
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      manualSaveDraft()
      navigate('/login', { state: { from: '/customise/photo-lamp' } })
      return
    }

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
    <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-5">
      {/* Studio switcher pills */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to="/3d-customisation"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-alt px-3.5 py-1.5 text-[12.5px] font-semibold text-muted hover:text-accent hover:border-accent transition-colors"
        >
          &larr; 3D Studios Hub
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
        <Link
          to="/customise/qr-stand"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          QR Stand
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent/10 px-4 py-1.5 text-[13px] font-semibold text-accent">
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
        </span>
      </div>

      {/* Top action bar */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-accent"
        >
          &larr; Browse products
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleReset} title="Reset all custom settings">
            Reset
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            title="Export STL/3MF files"
          >
            Export Files
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setHelpModalOpen(true)}
            title="View customizer guide"
          >
            Guide
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
          <PhotoLampStudioControls
            project={project}
            onChangeProject={handleChangeProject}
            onOpenEditorForIndex={handleOpenEditor}
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
              productLabel="Photo Lamp"
            />
            <PhotoLampFactsCard
              report={validationReport}
              dimensions={project.printSettings}
            />
            <PhotoLampCustomizationSummary
              project={project}
              volumeCm3={estimatedVolumeCm3}
              quantity={quantity}
              onQuantityChange={setQuantity}
              totalPriceRupees={totalPriceRupees}
              unitPriceRupees={unitPriceRupees}
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
              onOpenEstimator={() => setCalculatorModalOpen(true)}
            />
          </div>
        </aside>

        {/* RIGHT COLUMN: Sticky 3D Canvas & Desktop Summary */}
        <main className="min-w-0 space-y-5 order-1 min-[1041px]:order-2 sticky top-0 max-[1040px]:z-20 max-[1040px]:bg-bg max-[1040px]:pb-3 min-[1041px]:top-5">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h1 className="font-display text-[26px] max-[760px]:text-[22px] font-semibold text-ink leading-tight m-0">
                Design Your 3D Lithophane Lamp
              </h1>
              <p className="mt-1 font-sans text-[13px] text-muted">
                Interactive 3D solid model preview with translucent relief lighting
              </p>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold bg-[#e3f4ea] text-[#17683f]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#17683f]" />
                Preview ready
              </span>
            </div>
          </div>

          {/* 3D WebGL Canvas */}
          <div className="h-[340px] sm:h-[400px] min-[1041px]:h-[480px] min-[1200px]:h-[540px] w-full rounded-card overflow-hidden border border-line bg-surface relative">
            <LithophaneViewer
              shape={project.shape}
              lithophaneGeometry={geometries.lithophane}
              baseGeometry={geometries.base}
              frameGeometry={geometries.frame}
              validationReport={validationReport}
              lighting={project.lighting}
              onSnapshotCaptured={handleSnapshotCaptured}
              cameraDistance={340}
              explodedProgress={0}
              processedCanvas={processedCanvas}
            />
          </div>

          {/* Desktop only: Facts Card and Customization Summary */}
          <div className="max-[1040px]:hidden space-y-5">
            <DraftControlsBar
              hasDraft={hasDraft}
              savedAt={savedAt}
              saveStatus={saveStatus}
              onSave={manualSaveDraft}
              onRestore={handleRestoreDraft}
              onDelete={manualDeleteDraft}
              productLabel="Photo Lamp"
            />
            <PhotoLampFactsCard
              report={validationReport}
              dimensions={project.printSettings}
            />
            <PhotoLampCustomizationSummary
              project={project}
              volumeCm3={estimatedVolumeCm3}
              quantity={quantity}
              onQuantityChange={setQuantity}
              totalPriceRupees={totalPriceRupees}
              unitPriceRupees={unitPriceRupees}
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
              onOpenEstimator={() => setCalculatorModalOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      {editorModalOpen && project.photos[editingPhotoIndex] && (
        <PhotoEditorModal
          isOpen={editorModalOpen}
          onClose={() => setEditorModalOpen(false)}
          photo={project.photos[editingPhotoIndex]}
          shape={project.shape}
          onSave={handleSavePhotoAdjustments}
        />
      )}

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

      <CostCalculatorModal
        isOpen={calculatorModalOpen}
        onClose={() => setCalculatorModalOpen(false)}
        settings={DEFAULT_COST_SETTINGS}
        report={validationReport}
        onSaveSettings={() => {}}
      />

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  )
}
