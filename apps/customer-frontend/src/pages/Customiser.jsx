import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import FontPickerCards from '../components/customiser/FontPickerCards'
import IconPicker from '../components/customiser/IconPicker'
import { codePointLength, insertAtSelection, sanitizeNameInput } from '../features/customiser/geometry/icons/textInput'
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
import { useCustomizerSettings } from '../features/pricing/useCustomizerSettings.js'
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
  const [sizeChoice, setSizeChoice] = useState(initial.size)
  // What the customer explicitly picked; `undefined` means "use the default".
  const [baseChoice, setBaseChoice] = useState(initial.color)
  const [textChoice, setTextChoice] = useState(initial.textColor)
  const [quantity, setQuantity] = useState(initial.quantity ?? 1)
  const [keyringPosition, setKeyringPosition] = useState(initial.keyringPosition ?? options.defaultKeyringPosition)
  const [thickness, setThickness] = useState(initial.thickness ?? 'standard')
  const [allowDisconnected, setAllowDisconnected] = useState(initial.allowDisconnected ?? false)
  const [selectedShipping, setSelectedShipping] = useState(null)

  const nameInputRef = useRef(null)
  const nameSelectionRef = useRef({ start: null, end: null })
  const captureRef = useRef(null)
  const handleCaptureReady = useCallback((capture) => {
    captureRef.current = capture
  }, [])

  // Server-side facts about the chosen template, plus the engine's own definition.
  const templateOption = options.templates.find((t) => t.id === templateId) ?? options.templates[0]
  const templateDefinition = TEMPLATE_CATALOG.find((t) => t.id === templateOption.id) ?? TEMPLATE_CATALOG[0]
  const effectiveFontId = fontIdForTemplate(templateOption.id, fontId, text)

  // Material is determined automatically by the template's standard configuration.
  const material = templateOption.materials[0] || 'Standard PLA'
  const size = templateOption.sizes.includes(sizeChoice)
    ? sizeChoice
    : templateOption.sizes.includes(DEFAULT_SIZE_LABEL)
      ? DEFAULT_SIZE_LABEL
      : templateOption.sizes[0]
  const styleId = templateOption.styles.length ? (templateOption.styles.includes(styleChoice) ? styleChoice : templateOption.styles[0]) : null

  const pricing = usePricing()
  const customizerSettings = useCustomizerSettings()

  // Auto-select the first shipping method once settings load
  useEffect(() => {
    if (customizerSettings.shippingMethods.length > 0 && selectedShipping === null) {
      setSelectedShipping(customizerSettings.shippingMethods[0])
    }
  }, [customizerSettings.shippingMethods, selectedShipping])

  // Use admin-configured colors if available, else fall back to hardcoded material colors
  const hardcodedColors = useMemo(() => options.materials.find((m) => m.name === material)?.colors ?? [], [options.materials, material])
  const availableColors = useMemo(() => {
    const adminColors = customizerSettings.colors.map((c) => ({ label: c.name, hex: c.hex }))
    return adminColors.length > 0 ? adminColors : hardcodedColors
  }, [customizerSettings.colors, hardcodedColors])

  const { base: color, text: textColor } = useMemo(
    () => resolveColorSelection(availableColors, baseChoice, textChoice),
    [availableColors, baseChoice, textChoice],
  )

  // Admin-configured sizes (with prices); fall back to template sizes
  const adminSizes = customizerSettings.sizes
  const effectiveSizeOptions = adminSizes.length > 0 ? adminSizes.map((s) => s.name) : templateOption.sizes
  const effectiveSize = effectiveSizeOptions.includes(sizeChoice) ? sizeChoice : effectiveSizeOptions[0] ?? size
  const selectedSizeOption = adminSizes.find((s) => s.name === effectiveSize)
  const sizePriceCents = selectedSizeOption?.priceCents ?? 0

  // Admin-configured thicknesses (with prices); fall back to hardcoded THICKNESS_OPTIONS
  const adminThicknesses = customizerSettings.thicknesses

  // Build picker options: admin list (fully dynamic) or hardcoded fallback
  // Key is used as the thickness state value; geometry mm falls back to standard (2.4mm)
  // Resolve mm for the 3D geometry: match by name against hardcoded options, else default
  const hardcodedThicknessValues = Object.values(THICKNESS_OPTIONS)
  const hardcodedKeys = Object.keys(THICKNESS_OPTIONS)

  // Build picker options: admin list (fully dynamic) or hardcoded fallback
  // mm value mapped by position from THICKNESS_OPTIONS geometry values
  const thicknessPickerOptions = adminThicknesses.length > 0
    ? adminThicknesses.map((t, i) => ({
        key: t.name,
        label: t.name,
        priceCents: t.priceCents ?? 0,
        mm: t.mm ?? hardcodedThicknessValues[i]?.baseThicknessMm ?? 2.4,
        displayValue: t.displayValue ?? t.mm ?? hardcodedThicknessValues[i]?.baseThicknessMm ?? 2.4,
        displayUnit: t.displayUnit ?? 'mm',
      }))
    : null // null = ThicknessPicker uses its own hardcoded THICKNESS_OPTIONS
  const hardcodedMatch = adminThicknesses.length === 0 ? THICKNESS_OPTIONS[thickness] : null
  const adminThicknessIndex = adminThicknesses.findIndex((t) => t.name === thickness)
  const adminThicknessEntry = adminThicknesses[adminThicknessIndex]
  const baseThicknessMm = hardcodedMatch
    ? hardcodedMatch.baseThicknessMm
    : adminThicknessIndex >= 0
      ? (adminThicknessEntry?.mm ?? hardcodedThicknessValues[adminThicknessIndex]?.baseThicknessMm ?? 2.4)
      : 2.4

  const thicknessPriceCents = adminThicknesses.find((t) => t.name === thickness)?.priceCents ?? 0

  // Auto-select first admin thickness when admin list loads and current value is a hardcoded key
  useEffect(() => {
    if (adminThicknesses.length > 0 && hardcodedKeys.includes(thickness)) {
      setThickness(adminThicknesses[0].name)
    }
  }, [adminThicknesses.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const sizeDefaults = useMemo(() => shapeDefaultsForSize(effectiveSize), [effectiveSize])

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
  const nameCharacterCount = useMemo(() => countBillableCharacters(text), [text])
  const subtitleCharacterCount = useMemo(() => countBillableCharacters(cleanSubtitle), [cleanSubtitle])
  const billableCharacterCount = nameCharacterCount + subtitleCharacterCount
  const customizationPriceCents =
    pricing.perCharacterPriceCents != null
      ? calculateTotalCustomizationPriceCents(text, cleanSubtitle, pricing.perCharacterPriceCents, pricing.baseCharacters, pricing.basePriceCents)
      : null
  const totalPriceCents = customizationPriceCents != null ? customizationPriceCents + sizePriceCents + thicknessPriceCents : null
  const totalPriceRupees = totalPriceCents != null ? totalPriceCents / 100 : null

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
      baseThicknessMm,
      keyringPosition: templateDefinition.supportsKeyring ? keyringPosition : undefined,
    }
  }, [cleanText, cleanSubtitle, effectiveFontId, templateOption.id, styleId, templateDefinition, sizeDefaults, keyringPosition, baseThicknessMm])

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
      size: effectiveSize,
      thickness,
      keyringPosition: templateDefinition.supportsKeyring ? keyringPosition : undefined,
      allowDisconnected,
    }),
    [templateOption.id, styleId, cleanText, cleanSubtitle, effectiveFontId, material, color, textColor, effectiveSize, thickness, templateDefinition, keyringPosition, allowDisconnected],
  )

  const fontDef = useMemo(() => fontDefinition(effectiveFontId), [effectiveFontId])
  const subtitleFontDef = fontDef

  const engine = useGeometryEngine(params, { fontDefinition: fontDef, subtitleFontDefinition: subtitleFontDef })
  const { baseGeometry, reliefGeometry } = useResultGeometries(engine.status === 'ready' ? engine.result : null)

  const preflight = useMemo(
    () => buildPreflightReport(engine.result ?? undefined, undefined, engine.status === 'loading', engine.status === 'error' ? (engine.error?.message ?? 'Generation failed.') : undefined, allowDisconnected),
    [engine.result, engine.status, engine.error, allowDisconnected],
  )

  // Counted in code points (like the engine and the server), so an icon is one character.
  const charsRemaining = options.maxTextLength - codePointLength(text)
  const iconsUnavailable = templateOption.id === 'articulated-name'

  function rememberNameSelection() {
    const input = nameInputRef.current
    if (input) nameSelectionRef.current = { start: input.selectionStart, end: input.selectionEnd }
  }

  // Inserts the chosen icon at the remembered caret/selection and puts the caret after it.
  function insertIcon(character) {
    const { start, end } = nameSelectionRef.current
    const inserted = insertAtSelection(text, start ?? text.length, end ?? start ?? text.length, character, options.maxTextLength)
    if (!inserted) return
    setText(inserted.text)
    requestAnimationFrame(() => {
      const input = nameInputRef.current
      if (!input) return
      input.focus()
      input.setSelectionRange(inserted.caret, inserted.caret)
    })
  }
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
    setSizeChoice(undefined)
    setQuantity(1)
    setTemplateId(DEFAULT_TEMPLATE_ID)
    setStyleChoice(DEFAULT_PARAMS.styleId)
    setKeyringPosition(options.defaultKeyringPosition)
    setThickness(adminThicknesses[0]?.name ?? 'standard')
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
              <div className="mt-2 flex items-start gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(sanitizeNameInput(e.target.value, options.maxTextLength))}
                  placeholder="Enter name or text"
                  className="block min-w-0 flex-1 h-[46px] rounded-control border border-line bg-surface px-3.5 text-[15px] font-medium text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
                <IconPicker
                  onOpen={rememberNameSelection}
                  onPick={insertIcon}
                  disabled={iconsUnavailable}
                  disabledReason="Icons are not available for articulated letters."
                />
              </div>
              {iconsUnavailable && (
                <p className="mt-1.5 text-[11px] text-muted">Icons are not available for articulated letters.</p>
              )}
            </section>

            {/* Step 2: Print Colors */}
            <section className="py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">2. Print colors</span>
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
              <ThicknessPicker value={thickness} onChange={setThickness} options={thicknessPickerOptions} />
            </section>

            {/* Step 6: Size & Quantity */}
            <section className="py-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">Size & Quantity</span>
              <div className="space-y-3">
                {/* Style A size pills — name + price from admin, falls back to plain names */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-sans text-[13px] font-bold tracking-[0.04em] text-ink">Overall Size</span>
                    <span className="font-sans text-[13px] text-muted">{effectiveSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {effectiveSizeOptions.map((sizeName) => {
                      const isSelected = effectiveSize === sizeName
                      const adminSize = adminSizes.find((s) => s.name === sizeName)
                      const priceLabel = adminSize
                        ? adminSize.priceCents > 0
                          ? `₹${(adminSize.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`
                          : 'Included'
                        : null
                      return (
                        <button
                          key={sizeName}
                          type="button"
                          onClick={() => setSizeChoice(sizeName)}
                          aria-pressed={isSelected}
                          className={`flex flex-col items-start px-[18px] py-2.5 rounded-control border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-accent bg-soft text-accent ring-1 ring-accent'
                              : 'border-line bg-surface text-ink hover:border-accent/40'
                          }`}
                        >
                          <span className={`font-sans text-[14px] font-medium ${isSelected ? 'text-accent' : 'text-ink'}`}>
                            {sizeName}
                          </span>
                          {priceLabel && (
                            <span className={`font-sans text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-accent' : 'text-muted'}`}>
                              {priceLabel}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <QuantitySelector value={quantity} onChange={setQuantity} />
              </div>
            </section>

            {/* Step 7: Shipping Method */}
            {customizerSettings.shippingMethods.length > 0 && (
              <section className="py-4">
                <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">7. Shipping Method</span>
                <div className="space-y-2">
                  {customizerSettings.shippingMethods.map((method) => {
                    const isSelected = selectedShipping?.name === method.name
                    return (
                      <button
                        key={method.name}
                        type="button"
                        onClick={() => setSelectedShipping(method)}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                          isSelected ? 'border-accent bg-accent/10 text-ink' : 'border-line bg-surface hover:border-accent/50'
                        }`}
                      >
                        <div>
                          <span className="text-sm font-semibold text-ink">{method.name}</span>
                          {method.estimatedDays && <span className="ml-2 text-xs text-muted">{method.estimatedDays}</span>}
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-accent' : 'text-muted'}`}>
                          {method.priceCents === 0 ? 'FREE' : `₹${(method.priceCents / 100).toFixed(2).replace(/\.00$/, '')}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Preflight Panel for Print Validation */}
          <PreflightPanel
            report={preflight}
            allowDisconnected={allowDisconnected}
            onAllowDisconnectedChange={setAllowDisconnected}
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
              <p className="mt-1 font-sans text-[13px] text-muted">Real-time 3D solid model preview</p>
            </div>
            <div>
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
            geometryError={engine.error}
            onRetry={engine.retry}
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
            selectedShipping={selectedShipping}
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
