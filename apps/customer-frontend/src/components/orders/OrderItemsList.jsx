import CustomizationDetails from '../product/CustomizationDetails.jsx'
import DesignDetails from '../design/DesignDetails.jsx'
import DesignPreviewImage from '../design/DesignPreviewImage.jsx'
import StandDetails from '../design/StandDetails.jsx'
import StandPreviewImage from '../design/StandPreviewImage.jsx'
import NameplateDetails from '../design/NameplateDetails.jsx'
import NameplatePreviewImage from '../design/NameplatePreviewImage.jsx'
import { resolveImageUrl } from '../../utils/imageUrl.js'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

export default function OrderItemsList({ items }) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface">
      {items.map((item) => {
        // A line is either a catalog product, a keychain custom design, a stand design, or a nameplate design.
        const isCustom = item.itemType === 'CUSTOM_DESIGN' && item.design
        const stand = item.stand || item.standDesign
        const isStand = item.itemType === 'STAND_DESIGN' && stand
        const nameplate = item.nameplate || item.nameplateDesign
        const isNameplate = item.itemType === 'NAMEPLATE_DESIGN' && nameplate
        return (
          <div key={item.id} className="flex gap-4 p-5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-control bg-soft border border-line flex items-center justify-center">
              {isCustom ? (
                <DesignPreviewImage designId={item.design.id} hasPreview={item.design.hasPreview} alt={item.productName} />
              ) : isStand ? (
                <StandPreviewImage designId={stand.id} hasPreview={stand.hasPreview} alt={item.productName} />
              ) : isNameplate ? (
                <NameplatePreviewImage designId={nameplate.id} hasPreview={nameplate.hasPreview} alt={item.productName} />
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
                    {isCustom && <span className="ml-2 align-middle rounded-full bg-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">Custom design</span>}
                    {isStand && <span className="ml-2 align-middle rounded-full bg-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">Stand design</span>}
                    {isNameplate && <span className="ml-2 align-middle rounded-full bg-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">Nameplate</span>}
                  </p>
                  <div className="mt-1 text-[13px] text-muted">
                    {isCustom ? (
                      <DesignDetails params={item.design.params} />
                    ) : isStand ? (
                      <StandDetails config={stand.designConfig} category={stand.category} />
                    ) : isNameplate ? (
                      <NameplateDetails config={nameplate.designConfig} nameplateType={nameplate.nameplateType} />
                    ) : (
                      <CustomizationDetails customization={item.customization} />
                    )}
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
