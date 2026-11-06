import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGeometryEngine } from '../features/customiser/geometry/useGeometryEngine.js'
import { useResultGeometries } from '../features/customiser/geometry/useResultGeometries.js'
import { buildPreflightReport } from '../features/customiser/geometry/export/preflight.js'
import { DEFAULT_PARAMS } from '../features/customiser/geometry/model/types.js'
import { TEMPLATE_CATALOG } from '../features/customiser/geometry/templates/templateBuilder.js'
import { STYLE_CATALOG } from '../features/customiser/geometry/styles/styleBuilder.js'
import { KEYRING_POSITIONS, keyringPositionNameKey } from '../features/customiser/geometry/model/keyringPosition.js'
import { FONT_CATALOG, fontDefinition } from '../features/customiser/geometry/fonts/catalog.js'
import { shapeDefaultsForSize, fontIdForTemplate } from '../features/customiser/geometry/productMapping.js'
import { resolveColorSelection } from '../features/customiser/colorSelection'
import Viewport3D from '../components/customiser/Viewport3D'
import CustomizationSummary from '../components/customiser/CustomizationSummary'
import PreflightPanel from '../components/customiser/PreflightPanel'
import ExportButtons from '../components/customiser/ExportButtons'
import FontPickerCards from '../components/customiser/FontPickerCards'
import ThicknessPicker from '../components/customiser/ThicknessPicker'
import KeychainColorSwatches from '../components/customiser/KeychainColorSwatches'
import PrintFactsCard from '../components/customiser/PrintFactsCard'
import VisualDesignCardRail from '../components/customiser/VisualDesignCardRail'
import { THICKNESS_OPTIONS } from '../features/customiser/thicknessOptions'
import OptionPicker from '../components/product/OptionPicker'
import QuantitySelector from '../components/product/QuantitySelector'
import Button from '../components/ui/Button'
import { TEMPLATE_PREVIEWS, getStylePreview } from '../features/customiser/templateAssets'
import { usePricing } from '../features/pricing/usePricing.js'
import { countBillableCharacters, calculateTotalCustomizationPriceCents } from '../features/pricing/pricingCalculator.js'
import { useDesignOptions } from '../features/customDesign/useDesignOptions.js'
import { clearDraft, loadDraft, restoreChoices } from '../features/customDesign/designDraft.js'

const DEFAULT_EXAMPLE_TEXT = 'Alex'
const DEFAULT_TEMPLATE_ID = 'name-keychain'
const DEFAULT_SIZE_LABEL = 'Medium (5.5 cm)'

const KEYRING_POSITION_LABELS = {
  keyringPositionLeft: 'Left',
  keyringPositionRight: 'Right',
  keyringPositionTop: 'Top',
  keyringPositionBottom: 'Bottom',
  keyringPositionTopLeft: 'Top left',
  keyringPositionTopRight: 'Top right',
}

const STYLE_NAMES = Object.fromEntries(STYLE_CATALOG.map((style) => [style.id, style.name]))
const TEMPLATE_NAMES = Object.fromEntries(TEMPLATE_CATALOG.map((template) => [template.id, template.name]))

// A standalone customiser: no catalog product is involved. The available
// templates, materials, colours, sizes and fonts all come from the server,
// which validates every design against the same lists.
export default function Customiser() {
  const { data: options, isLoading, error, retry } = useDesignOptions()

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-muted">Loading customizer…</div>
  }

  if (error || !options) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger">
        <p>We couldn&apos;t load the customizer. Please check your connection and try again.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }

  // Mounted only once the options exist, so every initial value below is
  // computed from real data (never from a still-loading placeholder).
  return <CustomiserWorkspace options={options} />
}

function CustomiserWorkspace({ options }) {
  // A design saved before a sign-in redirect is restored here (validated
  // against the current options).
  const initial = useMemo(() => restoreChoices(loadDraft(), options), [options])

  const [text, setText] = useState(initial.text ?? DEFAULT_EXAMPLE_TEXT)
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? '')
  const [fontId, setFontId] = useState(initial.fontId ?? DEFAULT_PARAMS.fontId)
  const [templateId, setTemplateId] = useState(initial.templateId ?? DEFAULT_TEMPLATE_ID)
  const [styleChoice, setStyleChoice] = useState(initial.styleId ?? DEFAULT_PARAMS.styleId)
  const [materialChoice, setMaterialChoice] = useState(initial.material)
  const [sizeChoice, setSizeChoice] = useState(initial.size)
  // What the customer explicitly picked; `undefined` means "use the default".
  const [baseChoice, setBaseChoice] = useState(initial.color)
  const [textChoice, setTextChoice] = useState(initial.textColor)
  const [quantity, setQuantity] = useState(initial.quantity ?? 1)
  const [keyringPosition, setKeyringPosition] = useState(initial.keyringPosition ?? options.defaultKeyringPosition)
  const [thickness, setThickness] = useState(initial.thickness ?? 'standard')
  const [allowDisconnected, setAllowDisconnected] = useState(initial.allowDisconnected ?? false)

  const captureRef = useRef(null)
  const handleCaptureReady = useCallback((capture) => {
    captureRef.current = capture
  }, [])

  // Server-side facts about the chosen template, plus the engine's own definition.
  const templateOption = options.templates.find((t) => t.id === templateId) ?? options.templates[0]
  const templateDefinition = TEMPLATE_CATALOG.find((t) => t.id === templateOption.id) ?? TEMPLATE_CATALOG[0]
  const effectiveFontId = fontIdForTemplate(templateOption.id, fontId, text)

  // Material and size depend on the template; a choice that no longer applies
  // falls back to that template's default rather than leaving an invalid pick.
  const material = templateOption.materials.includes(materialChoice) ? materialChoice : templateOption.materials[0]
  const size = templateOption.sizes.includes(sizeChoice)
    ? sizeChoice
    : templateOption.sizes.includes(DEFAULT_SIZE_LABEL)
      ? DEFAULT_SIZE_LABEL
      : templateOption.sizes[0]
  const styleId = templateOption.styles.length ? (templateOption.styles.includes(styleChoice) ? styleChoice : templateOption.styles[0]) : null

  const availableColors = useMemo(() => options.materials.find((m) => m.name === material)?.colors ?? [], [options.materials, material])
  // Always a valid base/text pair from the palette, so the swatches, the 3D
  // preview, the summary and the exports can never disagree.
  const { base: color, text: textColor } = useMemo(
    () => resolveColorSelection(availableColors, baseChoice, textChoice),
    [availableColors, baseChoice, textChoice],
  )

  const sizeDefaults = useMemo(() => shapeDefaultsForSize(size), [size])

  // The design the server records (and the STL is generated from) uses the
  // trimmed text, exactly as the server canonicalises it.
  const cleanText = text.normalize('NFC').trim()
  const cleanSubtitle = templateDefinition.supportsSubtitle ? subtitle.normalize('NFC').trim() : ''

  // Per-character customizer pricing — the admin-configured rate (Settings
  // page in the admin frontend) is the ONLY price source for the customizer;
  // there is no separate base/product price added on top. Both the main name
  // and the optional subtitle are billed per character at the same rate
  // (subtitle contributes 0 when empty/unsupported by this template). Never
  // hardcoded here. Only the price the server calculates when the design is
  // added to the cart is authoritative; this is the live, as-you-type estimate.
  const pricing = usePricing()
  const nameCharacterCount = useMemo(() => countBillableCharacters(text), [text])
  const subtitleCharacterCount = useMemo(() => countBillableCharacters(cleanSubtitle), [cleanSubtitle])
  const billableCharacterCount = nameCharacterCount + subtitleCharacterCount
  const customizationPriceCents =
    pricing.perCharacterPriceCents != null
      ? calculateTotalCustomizationPriceCents(text, cleanSubtitle, pricing.perCharacterPriceCents)
      : null
  const totalPriceRupees = customizationPriceCents != null ? customizationPriceCents / 100 : null

  const params = useMemo(() => {
    return {
      ...DEFAULT_PARAMS,
      text: cleanText,
      subtitle: cleanSubtitle,
      subtitleFontId: effectiveFontId,
      fontId: effectiveFontId,
      templateId: templateOption.id,
      styleId: templateDefinition.styles.length ? styleId : DEFAULT_PARAMS.styleId,
      textSizeMm: sizeDefaults.textSizeMm,
      baseThicknessMm: THICKNESS_OPTIONS[thickness].baseThicknessMm,
      keyringPosition: templateDefinition.supportsKeyring ? keyringPosition : undefined,
    }
  }, [cleanText, cleanSubtitle, effectiveFontId, templateOption.id, styleId, templateDefinition, sizeDefaults, keyringPosition, thickness])

  // What gets recorded on the server for this design.
  const design = useMemo(
    () => ({
      templateId: templateOption.id,
      styleId: styleId ?? undefined,
      text: cleanText,
      subtitle: cleanSubtitle,
      fontId: effectiveFontId,
      material,
      color,
      textColor,
      size,
      thickness,
      keyringPosition: templateDefinition.supportsKeyring ? keyringPosition : undefined,
      allowDisconnected,
    }),
    [templateOption.id, styleId, cleanText, cleanSubtitle, effectiveFontId, material, color, textColor, size, thickness, templateDefinition, keyringPosition, allowDisconnected],
  )

  const fontDef = useMemo(() => fontDefinition(effectiveFontId), [effectiveFontId])
  const subtitleFontDef = fontDef

  const engine = useGeometryEngine(params, { fontDefinition: fontDef, subtitleFontDefinition: subtitleFontDef })
  const { baseGeometry, reliefGeometry } = useResultGeometries(engine.status === 'ready' ? engine.result : null)

  const preflight = useMemo(
    () => buildPreflightReport(engine.result ?? undefined, undefined, engine.status === 'loading', engine.status === 'error' ? (engine.error?.message ?? 'Generation failed.') : undefined, allowDisconnected),
    [engine.result, engine.status, engine.error, allowDisconnected],
  )

  const charsRemaining = options.maxTextLength - text.length
  const isAtLimit = charsRemaining <= 0
  const allowedFontIds = new Set(options.fonts.map((font) => font.id))
  const selectableFonts = FONT_CATALOG.filter((font) => allowedFontIds.has(font.id) && (!templateOption.requiresArticulatedFont || font.supportsArticulated))

  function resetColors() {
    setBaseChoice(undefined)
    setTextChoice(undefined)
  }

  function resetCustomization() {
    setText(DEFAULT_EXAMPLE_TEXT)
    setSubtitle('')
    setFontId(DEFAULT_PARAMS.fontId)
    resetColors()
    setMaterialChoice(undefined)
    setSizeChoice(undefined)
    setQuantity(1)
    setTemplateId(DEFAULT_TEMPLATE_ID)
    setStyleChoice(DEFAULT_PARAMS.styleId)
    setKeyringPosition(options.defaultKeyringPosition)
    setThickness('standard')
    setAllowDisconnected(false)
    clearDraft()
  }

  const templateRailItems = options.templates.map((template) => ({
    id: template.id,
    name: TEMPLATE_NAMES[template.id] ?? template.name,
    description: template.id === 'name-keychain' ? 'Classic extruded text tag' : template.id === 'articulated-name' ? 'Jingling linked letters' : 'Desktop nameplate',
    previewSrc: TEMPLATE_PREVIEWS[template.id],
  }))

  const styleRailItems = templateOption.styles.map((id) => ({
    id,
    name: STYLE_NAMES[id] ?? id,
    description: `${id} outline style`,
    previewSrc: getStylePreview(templateOption.id, id),
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
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
      <div className="grid min-w-0 gap-6 lg:grid-cols-[440px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)] lg:items-start lg:gap-8">

        {/* LEFT COLUMN: Controls Panel */}
        <aside className="min-w-0 space-y-5 order-2 lg:order-1">
          {/* Core Customization Container */}
          <div className="divide-y divide-line rounded-card border border-line bg-surface px-5">
            {/* Step 1: Name / Text */}
            <section className="py-4 first:pt-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">1. Name</span>
                <span className={`text-[11px] ${isAtLimit ? 'text-danger font-medium' : 'text-muted'}`}>
                  {charsRemaining} left
                </span>
              </div>
              <input
                type="text"
                value={text}
                maxLength={options.maxTextLength}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter name or text"
                className="mt-2 block w-full h-[46px] rounded-control border border-line bg-surface px-3.5 text-[15px] font-medium text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </section>

            {/* Step 2: Print Colors */}
            <section className="py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">2. Print colors</span>
              </div>
              <div className="mb-3">
                <OptionPicker label="Material" options={templateOption.materials} value={material} onChange={setMaterialChoice} />
              </div>
              <KeychainColorSwatches
                baseColor={color}
                textColor={textColor}
                availableColors={availableColors}
                onBaseColorChange={setBaseChoice}
                onTextColorChange={setTextChoice}
                onResetColors={resetColors}
              />
            </section>

            {/* Step 3: Template & Style Rails */}
            {templateRailItems.length > 1 && (
              <section className="py-4">
                <VisualDesignCardRail
                  label="Template"
                  items={templateRailItems}
                  value={templateOption.id}
                  onChange={setTemplateId}
                />
              </section>
            )}

            {(styleRailItems.length > 0 || templateDefinition.supportsKeyring) && (
              <section className="py-4 space-y-4">
                <span className="block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">Style & Shape</span>
                {styleRailItems.length > 0 && (
                  <VisualDesignCardRail items={styleRailItems} value={styleId} onChange={setStyleChoice} />
                )}
                {templateDefinition.supportsKeyring && (
                  <OptionPicker
                    label="Keyring hole position"
                    options={KEYRING_POSITIONS.map((pos) => ({
                      value: pos,
                      label: KEYRING_POSITION_LABELS[keyringPositionNameKey(pos)],
                    }))}
                    value={keyringPosition}
                    onChange={setKeyringPosition}
                  />
                )}
              </section>
            )}

            {templateDefinition.supportsSubtitle && (
              <section className="py-4">
                <label className="block">
                  <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">Subtitle (optional)</span>
                  <input
                    type="text"
                    value={subtitle}
                    maxLength={options.maxTextLength}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Optional second line"
                    className="mt-2 block w-full h-[46px] rounded-control border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </label>
              </section>
            )}

            {/* Step 4: Font Style */}
            <section className="py-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">Font style</span>
              <FontPickerCards
                fonts={selectableFonts}
                value={effectiveFontId}
                onChange={setFontId}
              />
            </section>

            {/* Step 5: Thickness & Dimensions */}
            <section className="py-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">Base thickness</span>
              <ThicknessPicker value={thickness} onChange={setThickness} />
            </section>

            {/* Step 6: Size & Quantity */}
            <section className="py-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">Size & Quantity</span>
              <div className="space-y-3">
                <OptionPicker label="Overall Size" options={templateOption.sizes} value={size} onChange={setSizeChoice} />
                <QuantitySelector value={quantity} onChange={setQuantity} />
              </div>
            </section>
          </div>

          {/* Preflight Panel for Print Validation */}
          <PreflightPanel
            report={preflight}
            allowDisconnected={allowDisconnected}
            onAllowDisconnectedChange={setAllowDisconnected}
          />

          {/* Export Actions */}
          <ExportButtons
            client={engine.client}
            params={params}
            fontDefinition={fontDef}
            subtitleFontDefinition={subtitleFontDef}
            canExport={preflight.printable}
            allowDisconnected={allowDisconnected}
            colorHex={color?.hex}
            textColorHex={textColor?.hex}
          />
        </aside>

        {/* RIGHT COLUMN: 3D Preview + Live Print Facts (Sticky on Desktop) */}
        <main className="min-w-0 space-y-5 order-1 lg:order-2 lg:sticky lg:top-5">
          {/* Header Title with live status */}
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h1 className="font-display text-[26px] max-[760px]:text-[22px] font-semibold text-ink leading-tight m-0">
                Create Your Custom 3D Design
              </h1>
              <p className="mt-1 font-sans text-[13px] text-muted">
                {totalPriceRupees != null ? (
                  <>
                    <span className="font-semibold text-accent">₹{totalPriceRupees.toFixed(2)}</span>{' '}
                    <span>
                      ({billableCharacterCount} character{billableCharacterCount === 1 ? '' : 's'} × ₹
                      {(pricing.perCharacterPriceCents / 100).toFixed(2)})
                    </span>
                  </>
                ) : (
                  'Calculating price…'
                )}{' '}
                · Real-time 3D solid model preview
              </p>
            </div>
            <div className="hidden sm:block">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                engine.status === 'ready' ? 'bg-[#e3f4ea] text-[#17683f]' : 'bg-soft text-accent'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${engine.status === 'ready' ? 'bg-[#17683f]' : 'bg-accent animate-pulse'}`} />
                {engine.status === 'ready' ? 'Preview ready' : 'Rendering 3D solid'}
              </span>
            </div>
          </div>

          {/* 3D Viewport Component */}
          <Viewport3D
            text={cleanText}
            color={color?.hex}
            textColor={textColor?.hex}
            materialName={material}
            scale={1}
            baseGeometry={baseGeometry}
            reliefGeometry={reliefGeometry}
            geometryStatus={engine.status}
            dimensions={preflight.dimensions}
            onCaptureReady={handleCaptureReady}
          />

          {/* Live Print Facts Card */}
          <PrintFactsCard report={preflight} dimensions={preflight.dimensions} />

          {/* Customization Summary & Add to Cart */}
          <CustomizationSummary
            design={design}
            quantity={quantity}
            totalPriceRupees={totalPriceRupees}
            canAdd={preflight.printable && engine.status === 'ready' && cleanText.length > 0 && Boolean(engine.client)}
            engineClient={engine.client}
            engineParams={params}
            fontDefinition={fontDef}
            subtitleFontDefinition={subtitleFontDef}
            allowDisconnected={allowDisconnected}
            capturePreview={() => captureRef.current?.()}
          />
        </main>
      </div>
    </div>
  )
}
