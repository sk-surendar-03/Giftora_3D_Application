import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Banner from '../../components/Banner.jsx'
import { useToast } from '../../components/Toast.jsx'
import AdminDesignPreview from '../../components/AdminDesignPreview.jsx'
import { fetchOrder, updateOrderStatus, fetchOrderItemStlBlob, fetchOrderItem3mfBlob } from '../../features/orders/ordersApi.js'
import { CARRIER_PRESETS, computeTrackingUrl } from '../../utils/carrierTracking.js'

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const ALLOWED_TRANSITIONS = {
  PENDING: ['PAID', 'PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

const TEMPLATE_LABELS = {
  'name-keychain': 'Name Keychain',
  'articulated-name': 'Articulated Name',
  nameplate: 'Nameplate',
}

const STYLE_LABELS = {
  plain: 'Plain',
  contour: 'Contour',
  capsule: 'Capsule',
  'soft-tag': 'Soft Tag',
  bubble: 'Bubble',
  arch: 'Arch',
  ribbon: 'Ribbon',
  'heart-split': 'Heart Split',
}

const THICKNESS_LABELS = {
  standard: 'Standard',
  premium: 'Premium',
}

const KEYRING_LABELS = {
  left: 'Left',
  right: 'Right',
  top: 'Top',
  bottom: 'Bottom',
  'top-left': 'Top Left',
  'top-right': 'Top Right',
}

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString()
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '')

function resolveImage(src) {
  if (!src) return null
  if (src.startsWith('http')) return src
  return `${API_BASE}${src}`
}

function formatCustomizationValue(value) {
  if (typeof value === 'object' && value !== null) {
    return value.label ?? value.name ?? JSON.stringify(value)
  }
  return String(value)
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function describeAdminDesign(params) {
  if (!params) return []
  return [
    { label: 'Template', value: TEMPLATE_LABELS[params.templateId] ?? params.templateId },
    params.styleId && { label: 'Style', value: STYLE_LABELS[params.styleId] ?? params.styleId },
    { label: 'Text', value: params.text },
    params.subtitle && { label: 'Subtitle', value: params.subtitle },
    { label: 'Font', value: params.fontId },
    { label: 'Material', value: params.material },
    params.color && { label: 'Base colour', value: params.color.label, hex: params.color.hex },
    params.textColor && { label: 'Text colour', value: params.textColor.label, hex: params.textColor.hex },
    { label: 'Size', value: params.size },
    { label: 'Thickness', value: THICKNESS_LABELS[params.thickness] ?? params.thickness },
    params.keyringPosition && { label: 'Keyring', value: KEYRING_LABELS[params.keyringPosition] ?? params.keyringPosition },
  ].filter(Boolean)
}

function describeAdminStandDesign(stand) {
  if (!stand) return []
  const cfg = stand.designConfig || {}

  const text = cfg.personalization?.text ?? cfg.text
  const font = cfg.personalization?.fontStyle ?? cfg.font
  const finish = cfg.appearance?.finish ?? cfg.finish
  const theme = cfg.appearance?.themeId ?? cfg.theme

  const baseHex = cfg.appearance?.colors?.base ?? (typeof cfg.color === 'string' ? cfg.color : cfg.color?.hex)
  const baseLabel = typeof cfg.color === 'object' && cfg.color?.label ? cfg.color.label : baseHex

  const textHex = cfg.appearance?.colors?.text ?? (typeof cfg.textColor === 'string' ? cfg.textColor : cfg.textColor?.hex)
  const textLabel = typeof cfg.textColor === 'object' && cfg.textColor?.label ? cfg.textColor.label : textHex

  const penSlots = cfg.pen?.slotCount ?? cfg.penSlotCount
  const slotWidth = cfg.phone?.phoneThickness ?? cfg.phoneSlotWidthMm

  return [
    { label: 'Category', value: stand.category || 'phone-pen' },
    text && { label: 'Text', value: text },
    font && { label: 'Font', value: font },
    finish && { label: 'Finish', value: typeof finish === 'string' ? finish.replace(/-/g, ' ') : finish },
    theme && { label: 'Theme', value: typeof theme === 'string' ? theme.replace(/-/g, ' ') : theme },
    baseHex && { label: 'Base colour', value: baseLabel, hex: baseHex },
    textHex && { label: 'Text colour', value: textLabel, hex: textHex },
    penSlots !== undefined && { label: 'Pen slots', value: String(penSlots) },
    slotWidth !== undefined && { label: 'Slot width', value: `${slotWidth} mm` },
    stand.solidVolumeCm3 !== undefined && { label: 'Volume', value: `${stand.solidVolumeCm3} cm³` },
  ].filter(Boolean)
}

function describeAdminNameplateDesign(nameplate) {
  if (!nameplate) return []
  const cfg = nameplate.designConfig || {}

  const textCfg = cfg.text || {}
  const line1 = textCfg.line1 || cfg.line1
  const line2 = textCfg.line2 || cfg.line2
  const font1 = textCfg.font1 || cfg.font1
  const font2 = textCfg.font2 || cfg.font2

  const shape = cfg.shape
  const plateType = nameplate.plateType || cfg.plateType
  const mounting = cfg.mountingStyle || cfg.mounting
  const finish = cfg.finish

  const colors = cfg.colors || {}
  const baseHex = colors.base
  const borderHex = colors.border
  const textHex = colors.text

  const width = cfg.widthMm || cfg.dimensions?.width
  const height = cfg.heightMm || cfg.dimensions?.height
  const thickness = cfg.baseThicknessMm || cfg.dimensions?.thickness

  return [
    plateType && { label: 'Plate Type', value: typeof plateType === 'string' ? plateType.replace(/-/g, ' ') : plateType },
    shape && { label: 'Shape', value: typeof shape === 'string' ? shape.replace(/-/g, ' ') : shape },
    line1 && { label: 'Line 1 Text', value: line1 },
    font1 && { label: 'Line 1 Font', value: font1 },
    line2 && { label: 'Line 2 Text', value: line2 },
    font2 && { label: 'Line 2 Font', value: font2 },
    mounting && { label: 'Mounting Style', value: typeof mounting === 'string' ? mounting.replace(/-/g, ' ') : mounting },
    finish && { label: 'Finish', value: typeof finish === 'string' ? finish.replace(/-/g, ' ') : finish },
    (width && height) && { label: 'Dimensions', value: `${width} × ${height} × ${thickness || 4} mm` },
    baseHex && { label: 'Base colour', value: baseHex, hex: baseHex },
    borderHex && { label: 'Border colour', value: borderHex, hex: borderHex },
    textHex && { label: 'Text colour', value: textHex, hex: textHex },
    nameplate.solidVolumeCm3 !== undefined && { label: 'Volume', value: `${nameplate.solidVolumeCm3} cm³` },
  ].filter(Boolean)
}

function describeAdminQrStandDesign(qrStand) {
  if (!qrStand) return []
  const cfg = qrStand.designConfig || {}
  const primary = cfg.primaryQr || {}
  const colors = cfg.colors || {}
  const dim = cfg.dimensions || {}

  return [
    { label: 'Template', value: qrStand.templateId ? qrStand.templateId.replace(/_/g, ' ') : 'Standard' },
    qrStand.printMode && { label: 'Print Mode', value: qrStand.printMode },
    qrStand.qrType && { label: 'QR Type', value: qrStand.qrType.toUpperCase() },
    qrStand.qrPayload && { label: 'QR Payload', value: qrStand.qrPayload },
    qrStand.qrVersion && { label: 'QR Version', value: `v${qrStand.qrVersion} (${qrStand.errorCorrection || 'H'})` },
    primary.hasCenterLogo && { label: 'Center Logo', value: 'Yes' },
    colors.standHex && { label: 'Stand colour', value: colors.standHex, hex: colors.standHex },
    colors.qrDarkHex && { label: 'QR Modules colour', value: colors.qrDarkHex, hex: colors.qrDarkHex },
    colors.qrLightHex && { label: 'QR Base colour', value: colors.qrLightHex, hex: colors.qrLightHex },
    dim.widthMm && dim.heightMm && { label: 'Dimensions', value: `${dim.widthMm} × ${dim.heightMm} mm` },
    qrStand.solidVolumeCm3 !== undefined && { label: 'Volume', value: `${qrStand.solidVolumeCm3} cm³` },
  ].filter(Boolean)
}

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusChoice, setStatusChoice] = useState('')
  const [shippingCarrier, setShippingCarrier] = useState('')
  const [carrierChoice, setCarrierChoice] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [customUrlEdited, setCustomUrlEdited] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [downloadingStlId, setDownloadingStlId] = useState(null)
  const [downloading3mfId, setDownloading3mfId] = useState(null)
  const [downloadError, setDownloadError] = useState(null)

  function load() {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchOrder(id)
        .then((data) => {
          setOrder(data)
          setStatusChoice(data.status)
          const carrier = data.shippingCarrier || ''
          setShippingCarrier(carrier)
          setCarrierChoice(
            carrier
              ? CARRIER_PRESETS.includes(carrier)
                ? carrier
                : 'Other'
              : ''
          )
          setTrackingNumber(data.trackingNumber || '')
          setTrackingUrl(data.trackingUrl || '')
          setCustomUrlEdited(Boolean(data.trackingUrl))
        })
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }

  useEffect(load, [id])

  async function handleUpdateStatus() {
    setError(null)
    setSuccessMessage(null)
    setUpdating(true)
    try {
      const updated = await updateOrderStatus(id, {
        status: statusChoice,
        shippingCarrier,
        trackingNumber,
        trackingUrl,
      })
      setOrder(updated)
      setStatusChoice(updated.status)
      const carrier = updated.shippingCarrier || ''
      setShippingCarrier(carrier)
      setCarrierChoice(
        carrier
          ? CARRIER_PRESETS.includes(carrier)
            ? carrier
            : 'Other'
          : ''
      )
      setTrackingNumber(updated.trackingNumber || '')
      setTrackingUrl(updated.trackingUrl || '')
      setCustomUrlEdited(Boolean(updated.trackingUrl))
      setSuccessMessage('Fulfillment details saved successfully.'); window.dispatchEvent(new CustomEvent('giftora:orders-updated')); toast?.('Fulfillment details saved successfully.', 'success')
    } catch (err) {
      const msg = extractError(err)
      setError(msg); toast?.(msg, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const hasChanges =
    Boolean(order) &&
    (statusChoice !== order.status ||
      shippingCarrier.trim() !== (order.shippingCarrier || '').trim() ||
      trackingNumber.trim() !== (order.trackingNumber || '').trim() ||
      trackingUrl.trim() !== (order.trackingUrl || '').trim())

  async function handleDownloadStl(itemId, filename = 'design.stl') {
    setDownloadError(null)
    setDownloadingStlId(itemId)
    try {
      const blob = await fetchOrderItemStlBlob(id, itemId)
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setDownloadError(extractError(err))
    } finally {
      setDownloadingStlId(null)
    }
  }

  async function handleDownload3mf(itemId, filename = 'design.3mf') {
    setDownloadError(null)
    setDownloading3mfId(itemId)
    try {
      const blob = await fetchOrderItem3mfBlob(id, itemId)
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setDownloadError(extractError(err))
    } finally {
      setDownloading3mfId(null)
    }
  }

  if (isLoading) return <div className="py-12 text-center text-sm text-muted">Loading order…</div>

  if (error && !order) {
    return (
      <div>
        <Banner tone="error">{error}</Banner>
        <Link to="/orders" className="text-sm text-brand hover:underline mt-4 inline-block">
          ← Back to orders
        </Link>
      </div>
    )
  }

  if (!order) return null

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight m-0">{order.orderNumber}</h1>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-soft text-accent border border-line">
              {order.status}
            </span>
          </div>
          <p className="text-sm text-muted mt-1">Placed {formatDate(order.createdAt)}</p>
        </div>
        <Link to="/orders" className="text-sm font-semibold text-brand hover:underline">
          ← Back to orders
        </Link>
      </div>

      <Banner tone="error">{error}</Banner>
      <Banner tone="error">{downloadError}</Banner>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Items, Manufacturing Specifications & Delivery */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Order Items */}
          <div className="rounded-card border border-line bg-surface p-6">
            <h2 className="font-display text-sm font-bold tracking-wider text-muted uppercase mb-4">
              Order Items ({order.items.length})
            </h2>

            <div className="divide-y divide-line">
              {order.items.map((item) => {
                const isCustom = item.itemType === 'CUSTOM_DESIGN' && item.design
                const isStand = item.itemType === 'STAND_DESIGN' && (item.stand || item.standDesign)
                const isNameplate = item.itemType === 'NAMEPLATE_DESIGN' && (item.nameplate || item.nameplateDesign)
                const isQrStand = item.itemType === 'QR_STAND_DESIGN' && (item.qrStand || item.qrStandDesign)
                const design = item.design
                const stand = item.stand || item.standDesign
                const nameplate = item.nameplate || item.nameplateDesign
                const qrStand = item.qrStand || item.qrStandDesign
                const stlMeta = isCustom ? design?.stl : isStand ? stand?.stl : isNameplate ? nameplate?.stl : isQrStand ? qrStand?.stl : null
                const hasStl = isCustom ? design?.hasStl : isStand ? stand?.hasStl : isNameplate ? nameplate?.hasStl : isQrStand ? qrStand?.hasStl : false
                const hasPreview = isCustom ? design?.hasPreview : isStand ? stand?.hasPreview : isNameplate ? nameplate?.hasPreview : isQrStand ? qrStand?.hasPreview : false
                const designRows = isCustom
                  ? describeAdminDesign(design?.params)
                  : isStand
                  ? describeAdminStandDesign(stand)
                  : isNameplate
                  ? describeAdminNameplateDesign(nameplate)
                  : isQrStand
                  ? describeAdminQrStandDesign(qrStand)
                  : []

                return (
                  <div key={item.id} className="py-5 space-y-4">
                    <div className="flex gap-4 items-start">
                      {/* Image or 3D Preview Thumbnail */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-control border border-line bg-soft flex items-center justify-center">
                        {isCustom || isStand || isNameplate || isQrStand ? (
                          <AdminDesignPreview orderId={order.id} itemId={item.id} hasPreview={hasPreview} alt={item.productName} />
                        ) : resolveImage(item.productImage) ? (
                          <img src={resolveImage(item.productImage)} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted">3D</span>
                        )}
                      </div>

                      {/* Header Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-sans text-base font-semibold text-ink m-0">{item.productName}</p>
                              {isCustom ? (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30">
                                  Custom 3D
                                </span>
                              ) : isStand ? (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30">
                                  Stand 3D
                                </span>
                              ) : isNameplate ? (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30">
                                  Nameplate 3D
                                </span>
                              ) : isQrStand ? (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30">
                                  QR Stand 3D
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-soft text-muted border border-line">
                                  Catalog
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted">Qty {item.quantity} · {formatPrice(item.unitPriceCents)} each</p>
                          </div>
                          <p className="shrink-0 text-base font-semibold text-ink m-0">
                            {formatPrice(item.unitPriceCents * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Custom Design, Stand Design, Nameplate Design, or QR Stand Details Card */}
                    {(isCustom || isStand || isNameplate || isQrStand) && (
                      <div className="rounded-control border border-line/80 bg-alt/60 p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-accent">
                            3D Manufacturing Specifications
                          </span>
                          {hasStl ? (
                            <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadStl(item.id, `${item.productName.replace(/[^a-z0-9_-]/gi, '_')}.stl`)}
                              disabled={downloadingStlId === item.id || downloading3mfId === item.id}
                              className="inline-flex items-center gap-1.5 rounded-control bg-accent px-3 py-1.5 text-xs font-bold text-on-accent hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                              </svg>
                              {downloadingStlId === item.id ? 'Downloading…' : 'Download STL'}
                            </button>
                            {(isCustom || isStand || isNameplate || isQrStand) && (
                              <button
                                type="button"
                                onClick={() => handleDownload3mf(item.id, `${item.productName.replace(/[^a-z0-9_-]/gi, '_')}.3mf`)}
                                disabled={downloadingStlId === item.id || downloading3mfId === item.id}
                                className="inline-flex items-center gap-1.5 rounded-control bg-alt border border-line px-3 py-1.5 text-xs font-bold text-ink hover:border-accent hover:text-accent transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                {downloading3mfId === item.id ? 'Downloading…' : 'Download 3MF'}
                              </button>
                            )}
                          </div>
                          ) : (
                            <span className="text-xs text-muted/80 italic">File unavailable</span>
                          )}
                        </div>

                        {/* Parameter Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                          {designRows.map((r) => (
                            <div key={r.label} className="flex flex-col">
                              <span className="text-muted">{r.label}</span>
                              <span className="font-medium text-ink flex items-center gap-1.5 mt-0.5">
                                {r.hex && (
                                  <span
                                    className="h-3 w-3 rounded-full border border-line inline-block shrink-0"
                                    style={{ backgroundColor: r.hex }}
                                  />
                                )}
                                {r.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* STL File Metadata */}
                        {stlMeta && (
                          <div className="pt-2.5 border-t border-line/50 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px] text-muted">
                            <div>
                              Size: <span className="text-ink font-medium">{formatBytes(stlMeta.sizeBytes)}</span>
                            </div>
                            <div>
                              Triangles: <span className="text-ink font-medium">{stlMeta.triangleCount?.toLocaleString()}</span>
                            </div>
                            {stlMeta.bboxMm && (
                              <div>
                                Bounds: <span className="text-ink font-medium">{stlMeta.bboxMm.x} × {stlMeta.bboxMm.y} × {stlMeta.bboxMm.z} mm</span>
                              </div>
                            )}
                            {stlMeta.sha256 && (
                              <div className="truncate max-w-xs" title={stlMeta.sha256}>
                                SHA-256: <span className="font-mono text-ink text-[10.5px]">{stlMeta.sha256.slice(0, 12)}…</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Catalog Customization (e.g. engraving) */}
                    {!isCustom && !isStand && !isNameplate && !isQrStand && item.customization && (
                      <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted bg-alt/40 p-3 rounded-control border border-line">
                        {Object.entries(item.customization).map(([key, value]) =>
                          value && key !== 'note' ? (
                            <div key={key} className="flex gap-1.5">
                              <dt className="capitalize font-medium text-muted">{key}:</dt>
                              <dd className="text-ink font-medium">{formatCustomizationValue(value)}</dd>
                            </div>
                          ) : null,
                        )}
                      </dl>
                    )}

                    {/* Item-level Customer Special Instructions / Note */}
                    {item.customization?.note && (
                      <div className="mt-2.5 rounded-control border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-ink">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-amber-500 text-[11px] mb-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Item-Specific Customer Note:
                        </div>
                        <p className="text-ink font-medium whitespace-pre-wrap leading-relaxed m-0">
                          {item.customization.note}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Totals Summary */}
            <div className="mt-6 w-full sm:ml-auto sm:max-w-xs space-y-2 border-t border-line pt-4">
              <div className="flex justify-between text-sm text-muted">
                <span>Subtotal</span>
                <span className="text-ink">{formatPrice(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Shipping</span>
                <span className="text-ink">{formatPrice(order.shippingCents)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-ink border-t border-line/60 pt-2">
                <span>Total</span>
                <span className="text-brand">{formatPrice(order.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="rounded-card border border-line bg-surface p-6">
            <h2 className="font-display text-sm font-bold tracking-wider text-muted uppercase mb-3">
              Delivery address
            </h2>
            <div className="text-sm text-ink leading-relaxed">
              <p className="font-semibold text-ink text-base">{order.shippingAddress.fullName}</p>
              <p className="text-muted text-sm">{order.shippingAddress.phone}</p>
              <p className="mt-1.5 text-ink">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </p>
            </div>
          </div>

          {/* Customer Note */}
          {order.customerNote && (
            <div className="rounded-card border border-amber-400/40 bg-amber-50 dark:bg-amber-900/10 p-6">
              <h2 className="font-display text-sm font-bold tracking-wider text-amber-700 dark:text-amber-400 uppercase mb-2">
                Customer Note
              </h2>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{order.customerNote}</p>
            </div>
          )}
        </div>

        {/* Right Column: Customer & Status Controls */}
        <div className="space-y-6">
          <div className="rounded-card border border-line bg-surface p-6">
            <h2 className="font-display text-sm font-bold tracking-wider text-muted uppercase mb-3">
              Customer
            </h2>
            <p className="text-base font-semibold text-ink">{order.user.name}</p>
            <p className="text-sm text-muted">{order.user.email}</p>
          </div>

          <div className="rounded-card border border-line bg-surface p-6">
            <h2 className="font-display text-sm font-bold tracking-wider text-muted uppercase mb-3">
              Fulfillment Status
            </h2>
            <div className="text-sm text-muted mb-3">
              Current: <span className="font-semibold text-ink">{order.status}</span>
            </div>
            <select
              value={statusChoice}
              onChange={(e) => setStatusChoice(e.target.value)}
              className="w-full rounded-control border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none focus:border-brand"
            >
              {STATUS_OPTIONS.map((s) => {
                const isCurrent = s === order.status
                const isAllowed = isCurrent || (ALLOWED_TRANSITIONS[order.status]?.includes(s) ?? false)
                return (
                  <option key={s} value={s} disabled={!isAllowed}>
                    {s} {isCurrent ? '(Current)' : !isAllowed ? '(Invalid Transition)' : ''}
                  </option>
                )
              })}
            </select>

            <div className="mt-4 pt-4 border-t border-line space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Shipping Carrier / Provider
                </label>
                <div className="flex gap-2">
                  <select
                    value={carrierChoice}
                    onChange={(e) => {
                      const val = e.target.value
                      setCarrierChoice(val)
                      const newCarrier = val === 'Other' ? '' : val
                      setShippingCarrier(newCarrier)
                      if (!customUrlEdited) {
                        setTrackingUrl(computeTrackingUrl(newCarrier, trackingNumber, ''))
                      }
                    }}
                    className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                  >
                    <option value="">Select Carrier…</option>
                    {CARRIER_PRESETS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>
                {(carrierChoice === 'Other' || (!CARRIER_PRESETS.includes(shippingCarrier) && shippingCarrier)) && (
                  <input
                    type="text"
                    placeholder="Enter carrier name"
                    value={shippingCarrier}
                    onChange={(e) => {
                      setShippingCarrier(e.target.value)
                      if (!customUrlEdited) {
                        setTrackingUrl(computeTrackingUrl(e.target.value, trackingNumber, ''))
                      }
                    }}
                    className="mt-2 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Tracking Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BD123456789"
                  value={trackingNumber}
                  onChange={(e) => {
                    const val = e.target.value
                    setTrackingNumber(val)
                    if (!customUrlEdited) {
                      setTrackingUrl(computeTrackingUrl(shippingCarrier, val, ''))
                    }
                  }}
                  className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Tracking URL
                  </label>
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Test Link ↗
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://carrier-tracking-page/..."
                  value={trackingUrl}
                  onChange={(e) => {
                    setCustomUrlEdited(true)
                    setTrackingUrl(e.target.value)
                  }}
                  className="w-full rounded-control border border-line bg-surface px-3 py-2 text-xs font-mono text-ink outline-none focus:border-brand"
                />
                <p className="mt-1 text-[11px] text-muted leading-tight">
                  Auto-generated for supported carriers (Blue Dart, Delhivery, DTDC, India Post, FedEx, DHL) or custom URL.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={updating || !hasChanges}
              onClick={handleUpdateStatus}
              className="mt-4 w-full rounded-control bg-accent px-4 py-2.5 text-sm font-bold text-on-accent hover:bg-accent-dark transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent cursor-pointer shadow-sm"
            >
              {updating ? 'Saving…' : 'Save Changes'}
            </button>
            <p className="mt-3 text-xs text-muted leading-normal">
              State transitions conform to store fulfillment validation (e.g. CANCELLED or REFUNDED orders are permanent).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
