import CustomizationDetails from '../product/CustomizationDetails.jsx'
import DesignDetails from '../design/DesignDetails.jsx'
import DesignPreviewImage from '../design/DesignPreviewImage.jsx'
import StandPreviewImage from '../design/StandPreviewImage.jsx'
import { resolveImageUrl } from '../../utils/imageUrl.js'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function StandDetails({ stand }) {
  const config = stand?.designConfig
  if (!config) return null
  const colors = Object.entries(config.appearance?.colors || {}).slice(0, 5)
  return (
    <div className="space-y-1">
      <div className="capitalize">
        {config.category?.replace('-', ' ')} · {config.appearance?.finish?.replace('-', ' ')}
      </div>
      {colors.length > 0 && (
        <div className="flex gap-1.5">
          {colors.map(([zone, hex]) => (
            <span key={zone} title={zone} className="inline-block h-3 w-3 rounded-full border border-line" style={{ backgroundColor: hex }} />
          ))}
        </div>
      )}
      {config.personalization?.enabled && config.personalization?.text && (
        <div>Text: "{config.personalization.text}"</div>
      )}
    </div>
  )
}

export default function OrderItemsList({ items }) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface">
      {items.map((item) => {
        // A line is a catalog product, a standalone custom design, or a stand.
        const isCustom = item.itemType === 'CUSTOM_DESIGN' && item.design
        const isStand = item.itemType === 'STAND_DESIGN' && item.stand
        return (
          <div key={item.id} className="flex gap-4 p-5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-control bg-soft border border-line flex items-center justify-center">
              {isStand ? (
                <StandPreviewImage designId={item.stand.id} hasPreview={item.stand.hasPreview} alt={item.productName} />
              ) : isCustom ? (
                <DesignPreviewImage designId={item.design.id} hasPreview={item.design.hasPreview} alt={item.productName} />
              ) : item.productImage ? (
                <img src={resolveImageUrl(item.productImage)} alt={item.productName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted">3D</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-[15px] font-semibold text-ink m-0">
                    {item.productName}
                    {isStand && <span className="ml-2 align-middle rounded-full bg-accent/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">3D Stand</span>}
                    {isCustom && <span className="ml-2 align-middle rounded-full bg-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">Custom design</span>}
                  </p>
                  <div className="mt-1 text-[13px] text-muted">
                    {isStand ? <StandDetails stand={item.stand} /> : isCustom ? <DesignDetails params={item.design.params} /> : <CustomizationDetails customization={item.customization} />}
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted font-medium">Qty {item.quantity}</p>
                </div>
                <p className="shrink-0 font-sans text-[15px] font-bold text-ink">{formatPrice(item.unitPriceCents * item.quantity)}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
