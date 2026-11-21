import React, { useState } from 'react'

export default function VisualDesignCardRail({
  label,
  items,
  value,
  onChange,
  previewName,
  layout = 'rail',
  cardWidth,
}) {
  if (!items || items.length === 0) return null

  const isGrid = layout === 'grid'
  const hasAnyImages = items.some((item) => Boolean(item.previewSrc))
  const resolvedCardWidth = cardWidth || (hasAnyImages ? 'w-32' : 'w-36')

  return (
    <div>
      {label && (
        <span className="block font-sans text-[12px] font-bold text-accent uppercase tracking-[0.14em] mb-2">
          {label}
        </span>
      )}
      <div
        className={
          isGrid
            ? 'grid grid-cols-2 gap-2.5 pt-0.5'
            : 'flex gap-2.5 overflow-x-auto pb-2 pt-0.5'
        }
      >
        {items.map((item) => {
          const isSelected = value === item.id
          return (
            <CardItem
              key={item.id}
              item={item}
              isSelected={isSelected}
              isGrid={isGrid}
              cardWidth={resolvedCardWidth}
              onClick={() => onChange(item.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

function CardItem({ item, isSelected, isGrid, cardWidth, onClick }) {
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(item.previewSrc && !imgError)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`group relative flex flex-col overflow-hidden rounded-[4px] border text-left transition-all cursor-pointer ${
        isGrid ? 'w-full' : `${cardWidth} shrink-0`
      } ${
        isSelected
          ? 'border-accent bg-soft ring-1 ring-accent'
          : 'border-line bg-surface hover:border-accent/40'
      }`}
    >
      {/* Image thumbnail - only rendered when an authentic image source exists */}
      {hasImage && (
        <div className="relative aspect-4/3 w-full overflow-hidden bg-alt">
          <img
            src={item.previewSrc}
            alt={item.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          {isSelected && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-on-accent shadow-xs">
              ✓
            </span>
          )}
        </div>
      )}

      {/* Content - clean single typography presentation */}
      <div className={`p-2.5 flex-1 flex flex-col justify-between ${!hasImage ? 'relative' : ''}`}>
        {!hasImage && isSelected && (
          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-on-accent shadow-xs">
            ✓
          </span>
        )}
        <div>
          {item.badge && !hasImage && (
            <span className="mb-1 inline-block text-[9px] uppercase tracking-wider text-accent font-bold">
              {item.badge}
            </span>
          )}
          <span
            className={`block text-[12px] font-semibold leading-tight transition-colors ${
              isSelected ? 'text-accent' : 'text-ink group-hover:text-accent'
            } ${!hasImage ? 'pr-5' : 'truncate'}`}
          >
            {item.name}
          </span>
          {item.description && (
            <span className="mt-1 block line-clamp-2 text-[10.5px] leading-snug text-muted">
              {item.description}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
