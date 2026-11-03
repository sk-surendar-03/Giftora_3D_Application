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
import ShapeParameterSliders from '../components/customiser/ShapeParameterSliders'
import CustomizerStepCard from '../components/customiser/CustomizerStepCard'
import FontPickerCards from '../components/customiser/FontPickerCards'
import ThicknessPicker from '../components/customiser/ThicknessPicker'
import { THICKNESS_OPTIONS } from '../features/customiser/thicknessOptions'
import OptionPicker from '../components/product/OptionPicker'
import ColorSwatchPicker from '../components/product/ColorSwatchPicker'
import QuantitySelector from '../components/product/QuantitySelector'
import ProductUnavailable from '../components/product/ProductUnavailable'
import Button from '../components/ui/Button'

const MAX_CHARS = 24 // the engine's own hard limit (keychain-builder.js: 'text-too-long')
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
  // Keyed by productId so selections reset cleanly when the selected
  // product changes, same reasoning as Phase 4's ProductDetail view.
  return <CustomiserView key={productId} productId={productId} />
}

function CustomiserView({ productId }) {
  const location = useLocation()
  const { data: product, isLoading, error } = useProductById(productId)
  const passedState = location.state

  // A default example name is shown pre-filled so customers see a real
  // preview immediately, without being forced to type first — but this is
  // only a starting value for the (always-editable) text input below, not
  // baked into the geometry in any special way.
  const [text, setText] = useState(passedState?.text ?? DEFAULT_EXAMPLE_TEXT)
  const [subtitle, setSubtitle] = useState('')
  const [fontId, setFontId] = useState(DEFAULT_PARAMS.fontId)
  // Material stays fixed to the product's default (Standard PLA) — no
  // material selector is shown in this customer-facing customizer.
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
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const templateOptions = product ? templateOptionsForCategory(product.category) : { templateIds: ['name-keychain'] }
  const templateDefinition = TEMPLATE_CATALOG.find((t) => t.id === templateId) ?? TEMPLATE_CATALOG[0]
  const effectiveFontId = fontIdForTemplate(templateId, fontId, text)
  const availableColors = product ? colorsForMaterial(product, material) : undefined

  // Colours can differ per material (Silk Metallic PLA vs Standard PLA) —
  // if the current colour isn't valid for the newly selected material, fall
  // back to that material's first colour.
  useEffect(() => {
    if (!availableColors?.length) return
    if (availableColors.some((option) => option.label === color?.label)) return
    setColor(availableColors[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the material/product changing, not every colour-array identity change.
  }, [material, product])

  useEffect(() => {
    if (!availableColors?.length) return
    if (availableColors.some((option) => option.label === textColor?.label)) return
    setTextColor(pickContrastingColor(color?.hex, availableColors))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the material/product changing, not every colour-array identity change.
  }, [material, product])

  const sizeDefaults = useMemo(() => shapeDefaultsForSize(size), [size])

  const params = useMemo(() => {
    return {
      ...DEFAULT_PARAMS,
      text,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to={`/products/${product.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-accent">
          ← Back
        </Link>
        <Button variant="secondary" size="sm" disabled title="Cart is coming soon">
          Cart
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div>
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
          {engine.status === 'error' && (
            <div className="mt-3 flex items-center gap-3 rounded-control border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
              <span>{engine.error?.message ?? 'Something went wrong generating this design.'}</span>
              <Button variant="secondary" size="sm" onClick={engine.retry}>
                Retry
              </Button>
            </div>
          )}
        </div>

        <div className="max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pb-4 lg:sticky lg:top-6">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Personalize Your {product.name}</h1>
            <p className="mt-1 text-sm text-muted">₹{product.price}</p>
          </div>

          <CustomizerStepCard step={1} title="Custom Name / Text" description="Edit the text shown on your keychain.">
            <input
              type="text"
              value={text}
              maxLength={MAX_CHARS}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter name or text"
              className="block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <span className={`mt-1.5 block text-xs ${isAtLimit ? 'text-danger' : 'text-muted'}`}>
              {charsRemaining} characters remaining
            </span>
          </CustomizerStepCard>

          <CustomizerStepCard step={2} title="Choose Font Style" description="Pick a font — browse by category or scroll through all.">
            <FontPickerCards
              fonts={selectableFonts}
              value={effectiveFontId}
              onChange={setFontId}
            />
          </CustomizerStepCard>

          <CustomizerStepCard step={3} title="Choose Colors" description="Pick your base and text colors.">
            <div className="space-y-4">
              <ColorSwatchPicker label="Base Color" colors={availableColors} value={color} onChange={setColor} />
              <ColorSwatchPicker label="Font / Text Color" colors={availableColors} value={textColor} onChange={setTextColor} />
            </div>
          </CustomizerStepCard>

          <CustomizerStepCard step={4} title="Thickness" description="Standard or Premium (extra-thick) base.">
            <ThicknessPicker value={thickness} onChange={setThickness} />
          </CustomizerStepCard>

          <div className="space-y-5">
            <OptionPicker label="Size" options={product.sizes} value={size} onChange={setSize} />
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={resetCustomization}>
              Reset
            </Button>
          </div>

          <details className="rounded-card border border-border bg-surface p-5" open={advancedOpen} onToggle={(e) => setAdvancedOpen(e.target.open)}>
            <summary className="cursor-pointer text-xs font-semibold tracking-wide text-muted uppercase">More options</summary>
            <div className="mt-4 space-y-6">
              {templateDefinition.supportsSubtitle && (
                <label className="block">
                  <span className="text-sm font-medium text-ink">Subtitle (optional)</span>
                  <input
                    type="text"
                    value={subtitle}
                    maxLength={MAX_CHARS}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Optional second line"
                    className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </label>
              )}

              {templateOptions.templateIds.length > 1 && (
                <OptionPicker
                  label="Keychain type"
                  options={templateOptions.templateIds.map((id) => ({ value: id, label: TEMPLATE_NAMES[id] }))}
                  value={templateId}
                  onChange={setTemplateId}
                />
              )}

              {templateDefinition.styles.length > 0 && (
                <OptionPicker
                  label="Shape"
                  options={templateDefinition.styles.map((id) => ({ value: id, label: STYLE_NAMES[id] ?? id }))}
                  value={styleId}
                  onChange={setStyleId}
                />
              )}

              {templateDefinition.supportsKeyring && (
                <OptionPicker
                  label="Keyring position"
                  options={KEYRING_POSITIONS.map((position) => ({ value: position, label: KEYRING_POSITION_LABELS[keyringPositionNameKey(position)] }))}
                  value={keyringPosition}
                  onChange={setKeyringPosition}
                />
              )}

              <ShapeParameterSliders params={params} onChange={(key, value) => setShapeOverrides((previous) => ({ ...previous, [key]: value }))} />
            </div>
          </details>

          <PreflightPanel report={preflight} allowDisconnected={allowDisconnected} onAllowDisconnectedChange={setAllowDisconnected} />

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

          <CustomizationSummary
            product={product}
            text={text}
            font={fontDef?.name}
            material={material}
            color={color}
            size={size}
            quantity={quantity}
          />
        </div>
      </div>
    </div>
  )
}
