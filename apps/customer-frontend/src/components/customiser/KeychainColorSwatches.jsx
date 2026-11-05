import { useState } from 'react'

const getContrastYIQ = (hexcolor) => {
  if (!hexcolor) return '#1a1712'
  const hex = hexcolor.replace('#', '')
  if (hex.length !== 6) return '#1a1712'
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#ffffff'
}

export default function KeychainColorSwatches({
  baseColor,
  textColor,
  availableColors,
  onBaseColorChange,
  onTextColorChange,
  onResetColors,
}) {
  const [pickerTarget, setPickerTarget] = useState('base') // 'base' | 'text'

  const baseHex = baseColor?.hex || '#B84838'
  const textHex = textColor?.hex || '#FAF4E9'

  const baseContrast = getContrastYIQ(baseHex)
  const textContrast = getContrastYIQ(textHex)

  return (
    <div className="space-y-3">
      {/* Top row showing large hex swatches */}
      <div className="grid grid-cols-2 gap-3">
        {/* Base Color Box */}
        <button
          type="button"
          onClick={() => setPickerTarget('base')}
          className={`flex flex-col items-center justify-between rounded-control border p-3 text-center transition-all cursor-pointer ${
            pickerTarget === 'base'
              ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-bg'
              : 'border-line bg-surface hover:border-accent/40'
          }`}
          style={{ backgroundColor: baseHex, color: baseContrast }}
        >
          <span className="text-[11px] font-semibold opacity-90 uppercase tracking-wider">Base color</span>
          <strong className="my-2 font-mono text-[13px] tracking-wider">
            {baseHex.toUpperCase()}
          </strong>
          <span className="text-[11px] opacity-85">{baseColor?.label || 'Custom'}</span>
        </button>

        {/* Text Color Box */}
        <button
          type="button"
          onClick={() => setPickerTarget('text')}
          className={`flex flex-col items-center justify-between rounded-control border p-3 text-center transition-all cursor-pointer ${
            pickerTarget === 'text'
              ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-bg'
              : 'border-line bg-surface hover:border-accent/40'
          }`}
          style={{ backgroundColor: textHex, color: textContrast }}
        >
          <span className="text-[11px] font-semibold opacity-90 uppercase tracking-wider">Text color</span>
          <strong className="my-2 font-mono text-[13px] tracking-wider">
            {textHex.toUpperCase()}
          </strong>
          <span className="text-[11px] opacity-85">{textColor?.label || 'Custom'}</span>
        </button>
      </div>

      {/* Palette Swatches for Active Target */}
      <div className="rounded-control border border-line bg-alt p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-sans text-[12px] font-semibold text-ink">
            Select {pickerTarget === 'base' ? 'Base' : 'Text'} Palette:
          </span>
          {onResetColors && (
            <button
              type="button"
              onClick={onResetColors}
              className="text-[11.5px] text-muted hover:text-accent underline cursor-pointer"
            >
              Reset colors
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {availableColors?.map((c) => {
            const activeColor = pickerTarget === 'base' ? baseColor : textColor
            const isSelected = activeColor?.hex === c.hex
            const checkColor = getContrastYIQ(c.hex)
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  if (pickerTarget === 'base') {
                    onBaseColorChange(c)
                  } else {
                    onTextColorChange(c)
                  }
                }}
                title={c.label}
                className={`relative h-7 w-7 rounded-full transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg scale-105' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: c.hex,
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)',
                }}
              >
                {isSelected && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                    style={{ color: checkColor }}
                  >
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
