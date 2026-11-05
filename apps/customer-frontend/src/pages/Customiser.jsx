import { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import useProductById from '../features/products/useProductById'
import { colorsForMaterial } from '../data/sampleProducts'
import { useGeometryEngine } from '../features/customiser/geometry/useGeometryEngine.js'
import { useResultGeometries } from '../features/customiser/geometry/useResultGeometries.js'
import { buildPreflightReport } from '../features/customiser/geometry/export/preflight.js'
import { DEFAULT_PARAMS } from '../features/customiser/geometry/model/types.js'
import { TEMPLATE_CATALOG } from '../features/customiser/geometry/templates/templateBuilder.js'
import { STYLE_CATALOG } from '../features/customiser/geometry/styles/styleBuilder.js'
import { KEYRING_POSITIONS, keyringPositionNameKey } from '../features/customiser/geometry/model/keyringPosition.js'
import { FONT_CATALOG, fontDefinition } from '../features/customiser/geometry/fonts/catalog.js'
import { templateOptionsForCategory, shapeDefaultsForSize, fontIdForTemplate } from '../features/customiser/geometry/productMapping.js'
import { getReadableTextColor } from '../features/customiser/contrastColor'
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
import ProductUnavailable from '../components/product/ProductUnavailable'
import Button from '../components/ui/Button'
import { TEMPLATE_PREVIEWS, getStylePreview } from '../features/customiser/templateAssets'
import { usePricing } from '../features/pricing/usePricing.js'
import { countBillableCharacters, calculateTotalCustomizationPriceCents } from '../features/pricing/pricingCalculator.js'

const MAX_CHARS = 24
const DEFAULT_EXAMPLE_TEXT = 'Alex'

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

function pickContrastingColor(baseHex, colors) {
  if (!colors?.length) return undefined
  const target = getReadableTextColor(baseHex)
  return colors.find((c) => c.hex.toLowerCase() === target.toLowerCase()) ?? colors.find((c) => c.hex !== baseHex) ?? colors[0]
}

export default function Customiser() {
  const { productId } = useParams()
  return <CustomiserView key={productId} productId={productId} />
}

function CustomiserView({ productId }) {
  const location = useLocation()
  const { data: product, isLoading, error } = useProductById(productId)
  const passedState = location.state

  const [text, setText] = useState(passedState?.text ?? DEFAULT_EXAMPLE_TEXT)
  const [subtitle, setSubtitle] = useState('')
  const [fontId, setFontId] = useState(DEFAULT_PARAMS.fontId)
  const [material] = useState(passedState?.material ?? product?.materials?.[0])
  const [color, setColor] = useState(passedState?.color ?? (product ? colorsForMaterial(product, material)?.[0] : undefined))
  const [textColor, setTextColor] = useState(() => (product ? pickContrastingColor(color?.hex, colorsForMaterial(product, material)) : undefined))
  const [size, setSize] = useState(passedState?.size ?? product?.sizes?.[0])
  const [quantity, setQuantity] = useState(passedState?.quantity ?? 1)
  const [templateId, setTemplateId] = useState(() => (product ? templateOptionsForCategory(product.category).defaultTemplateId : 'name-keychain'))
  const [styleId, setStyleId] = useState('contour')
  const [keyringPosition, setKeyringPosition] = useState('left')
  const [thickness, setThickness] = useState('standard')
  const [shapeOverrides, setShapeOverrides] = useState({})
  const [allowDisconnected, setAllowDisconnected] = useState(false)

  const templateOptions = product ? templateOptionsForCategory(product.category) : { templateIds: ['name-keychain'] }
  const templateDefinition = TEMPLATE_CATALOG.find((t) => t.id === templateId) ?? TEMPLATE_CATALOG[0]
  const effectiveFontId = fontIdForTemplate(templateId, fontId, text)
  const availableColors = product ? colorsForMaterial(product, material) : undefined

  useEffect(() => {
    if (!availableColors?.length) return
    if (availableColors.some((option) => option.label === color?.label)) return
    setColor(availableColors[0])
  }, [material, product])

  useEffect(() => {
    if (!availableColors?.length) return
    if (availableColors.some((option) => option.label === textColor?.label)) return
    setTextColor(pickContrastingColor(color?.hex, availableColors))
  }, [material, product])

  const sizeDefaults = useMemo(() => shapeDefaultsForSize(size), [size])

  // Per-character customizer pricing — the admin-configured rate (Settings
  // page in the admin frontend) is the ONLY price source for the customizer;
  // there is no separate base/product price added on top. Both the main name
  // and the optional subtitle are billed per character at the same rate
  // (subtitle contributes 0 when empty/unsupported by this template). Never
  // hardcoded here. Only the final cart/order price (cartService.js) is
  // authoritative; this is the live, as-you-type estimate.
  const billedSubtitle = templateDefinition.supportsSubtitle ? subtitle : ''
  const pricing = usePricing()
  const nameCharacterCount = useMemo(() => countBillableCharacters(text), [text])
  const subtitleCharacterCount = useMemo(() => countBillableCharacters(billedSubtitle), [billedSubtitle])
  const billableCharacterCount = nameCharacterCount + subtitleCharacterCount
  const customizationPriceCents =
    pricing.perCharacterPriceCents != null
      ? calculateTotalCustomizationPriceCents(text, billedSubtitle, pricing.perCharacterPriceCents)
      : null
  const totalPriceRupees = customizationPriceCents != null ? customizationPriceCents / 100 : null

  const params = useMemo(() => {
    return {
      ...DEFAULT_PARAMS,
      text: text,
      subtitle: templateDefinition.supportsSubtitle ? subtitle : '',
      subtitleFontId: effectiveFontId,
      fontId: effectiveFontId,
      templateId,
      styleId: templateDefinition.styles.length ? styleId : DEFAULT_PARAMS.styleId,
      textSizeMm: sizeDefaults.textSizeMm,
      baseThicknessMm: THICKNESS_OPTIONS[thickness].baseThicknessMm,
      keyringPosition: templateDefinition.supportsKeyring ? keyringPosition : undefined,
      ...shapeOverrides,
    }
  }, [text, subtitle, effectiveFontId, templateId, styleId, templateDefinition, sizeDefaults, keyringPosition, thickness, shapeOverrides])

  const fontDef = useMemo(() => fontDefinition(effectiveFontId), [effectiveFontId])
  const subtitleFontDef = fontDef

  const engine = useGeometryEngine(params, { fontDefinition: fontDef, subtitleFontDefinition: subtitleFontDef })
  const { baseGeometry, reliefGeometry } = useResultGeometries(engine.status === 'ready' ? engine.result : null)

  const preflight = useMemo(
    () => buildPreflightReport(engine.result ?? undefined, undefined, engine.status === 'loading', engine.status === 'error' ? (engine.error?.message ?? 'Generation failed.') : undefined, allowDisconnected),
    [engine.result, engine.status, engine.error, allowDisconnected],
  )

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-muted">Loading customizer…</div>
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-danger">
        Something went wrong loading this product. Please try again.
      </div>
    )
  }

  if (!product) {
    return <ProductUnavailable />
  }

  const charsRemaining = MAX_CHARS - text.length
  const isAtLimit = charsRemaining <= 0
  const selectableFonts = FONT_CATALOG.filter((font) => templateId !== 'articulated-name' || font.supportsArticulated)

  function resetCustomization() {
    setText(DEFAULT_EXAMPLE_TEXT)
    setSubtitle('')
    setFontId(DEFAULT_PARAMS.fontId)
    const defaultColor = colorsForMaterial(product, material)?.[0]
    setColor(defaultColor)
    setTextColor(pickContrastingColor(defaultColor?.hex, colorsForMaterial(product, material)))
    setSize(product.sizes?.[0])
    setQuantity(1)
    setTemplateId(templateOptionsForCategory(product.category).defaultTemplateId)
    setStyleId('contour')
    setKeyringPosition('left')
    setThickness('standard')
    setShapeOverrides({})
    setAllowDisconnected(false)
  }

  const templateRailItems = templateOptions.templateIds.map((id) => ({
    id,
    name: TEMPLATE_NAMES[id] ?? id,
    description: id === 'name-keychain' ? 'Classic extruded text tag' : id === 'articulated-name' ? 'Jingling linked letters' : 'Desktop nameplate',
    previewSrc: TEMPLATE_PREVIEWS[id],
  }))

  const styleRailItems = templateDefinition.styles.map((id) => ({
    id,
    name: STYLE_NAMES[id] ?? id,
    description: `${id} outline style`,
    previewSrc: getStylePreview(templateId, id),
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      {/* Top action bar */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={`/products/${product.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-accent"
        >
          ← Back to product
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={resetCustomization} title="Reset all custom settings">
            Reset
          </Button>
          <Button variant="secondary" size="sm" disabled title="Cart is coming soon">
            Cart
          </Button>
        </div>
      </div>

      {/* Main Reference 2-Column Workspace */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[440px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)] lg:items-start lg:gap-8">
        
        {/* LEFT COLUMN: Controls Panel */}
        <aside className="min-w-0 space-y-5 order-2 lg:order-1">
          {/* Core Customization Container */}
          <div className="divide-y divide-border rounded-card border border-border bg-surface px-5 shadow-card">
            {/* Step 1: Name / Text */}
            <section className="py-4 first:pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-muted uppercase">Name</span>
                <span className={`text-[11px] ${isAtLimit ? 'text-danger font-medium' : 'text-muted'}`}>
                  {charsRemaining} left
                </span>
              </div>
              <input
                type="text"
                value={text}
                maxLength={MAX_CHARS}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter name or text"
                className="mt-2 block w-full rounded-control border border-border bg-paper/30 px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </section>

            {/* Step 2: Print Colors */}
            <section className="py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-muted uppercase">Print colors</span>
              </div>
              <KeychainColorSwatches
                baseColor={color}
                textColor={textColor}
                availableColors={availableColors}
                onBaseColorChange={setColor}
                onTextColorChange={setTextColor}
                onResetColors={() => {
                  const defaultCol = colorsForMaterial(product, material)?.[0]
                  setColor(defaultCol)
                  setTextColor(pickContrastingColor(defaultCol?.hex, availableColors))
                }}
              />
            </section>

            {/* Step 3: Template & Style Rails */}
            {templateRailItems.length > 1 && (
              <section className="py-4">
                <VisualDesignCardRail
                  label="Template"
                  items={templateRailItems}
                  value={templateId}
                  onChange={setTemplateId}
                />
              </section>
            )}

            {(styleRailItems.length > 0 || templateDefinition.supportsKeyring) && (
              <section className="py-4 space-y-4">
                <span className="block text-xs font-bold tracking-wider text-muted uppercase">Style & Shape</span>
                {styleRailItems.length > 0 && (
                  <VisualDesignCardRail items={styleRailItems} value={styleId} onChange={setStyleId} />
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
                  <span className="text-xs font-bold tracking-wider text-muted uppercase">Subtitle (optional)</span>
                  <input
                    type="text"
                    value={subtitle}
                    maxLength={MAX_CHARS}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Optional second line"
                    className="mt-2 block w-full rounded-control border border-border px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </label>
              </section>
            )}

            {/* Step 4: Font Style */}
            <section className="py-4">
              <span className="mb-2 block text-xs font-bold tracking-wider text-muted uppercase">Font style</span>
              <FontPickerCards
                fonts={selectableFonts}
                value={effectiveFontId}
                onChange={setFontId}
              />
            </section>

            {/* Step 5: Thickness & Dimensions */}
            <section className="py-4">
              <span className="mb-2 block text-xs font-bold tracking-wider text-muted uppercase">Base thickness</span>
              <ThicknessPicker value={thickness} onChange={setThickness} />
            </section>

            {/* Step 6: Size & Quantity */}
            <section className="py-4">
              <span className="mb-2 block text-xs font-bold tracking-wider text-muted uppercase">Size & Quantity</span>
              <div className="space-y-3">
                <OptionPicker label="Overall Size" options={product.sizes} value={size} onChange={setSize} />
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-ink sm:text-2xl">
                Personalize Your {product.name}
              </h1>
              <p className="mt-0.5 text-xs text-muted">
                {totalPriceRupees != null ? (
                  <>
                    <span className="font-semibold text-ink">₹{totalPriceRupees.toFixed(2)}</span>{' '}
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
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                engine.status === 'ready' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent-dark'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${engine.status === 'ready' ? 'bg-success' : 'bg-accent animate-pulse'}`} />
                {engine.status === 'ready' ? 'Preview ready' : 'Rendering 3D solid'}
              </span>
            </div>
          </div>

          {/* 3D Viewport Component */}
          <Viewport3D
            text={text}
            color={color?.hex}
            textColor={textColor?.hex}
            materialName={material}
            scale={1}
            baseGeometry={baseGeometry}
            reliefGeometry={reliefGeometry}
            geometryStatus={engine.status}
            dimensions={preflight.dimensions}
          />

          {/* Live Print Facts Card */}
          <PrintFactsCard report={preflight} dimensions={preflight.dimensions} />

          {/* Customization Summary & Add to Cart */}
          <CustomizationSummary
            product={product}
            text={text}
            subtitle={billedSubtitle}
            font={fontDef?.name}
            material={material}
            color={color}
            size={size}
            quantity={quantity}
            totalPriceRupees={totalPriceRupees}
          />
        </main>
      </div>
    </div>
  )
}
