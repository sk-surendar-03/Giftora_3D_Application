import React, { useState } from 'react'

export default function VisualDesignCardRail({
  label,
  items,
  value,
  onChange,
  previewName,
  layout = 'rail',
  cardWidth = 'w-32',
}) {
  if (!items || items.length === 0) return null

  const isGrid = layout === 'grid'

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
              cardWidth={cardWidth}
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
      {/* Image thumbnail */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-alt">
        {item.previewSrc && !imgError ? (
          <img
            src={item.previewSrc}
            alt={item.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-xs text-muted">
            <span className="font-medium text-ink/70 line-clamp-2">{item.name}</span>
            {item.badge && (
              <span className="mt-1 text-[9px] uppercase tracking-wider text-accent/80 font-bold">
                {item.badge}
              </span>
            )}
          </div>
        )}
        {isSelected && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-on-accent shadow-xs">
            ✓
          </span>
        )}
      </div>

      {/* Title & Description */}
      <div className="p-2">
        <span
          className={`block truncate text-[12px] font-semibold transition-colors ${
            isSelected ? 'text-accent' : 'text-ink group-hover:text-accent'
          }`}
        >
          {item.name}
        </span>
        {item.description && (
          <span className="mt-0.5 block line-clamp-1 text-[10.5px] text-muted">
            {item.description}
          </span>
        )}
      </div>
    </button>
  )
}
