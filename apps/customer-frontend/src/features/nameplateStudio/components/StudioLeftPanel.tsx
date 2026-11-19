import React, { useState } from 'react'
import {
  NameplateDesign,
  NameplateShape,
  NameplateTypeId,
  MountingStyle,
  MaterialFinish,
  DecorationType,
  TextLine,
  LetteringMode,
} from '../core/types'
import { NAMEPLATE_TYPES, MATERIAL_PRESETS, COLOR_PALETTES } from '../core/presets'
import { STUDIO_FONTS, FONT_CATEGORIES } from '../core/fonts'

interface StudioLeftPanelProps {
  design: NameplateDesign
  onUpdateDesign: (updater: (prev: NameplateDesign) => NameplateDesign) => void
}

const SHAPES: { id: NameplateShape; label: string }[] = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'rounded-rectangle', label: 'Rounded Rect' },
  { id: 'chamfer-plate', label: 'Chamfer Plate' },
  { id: 'oval', label: 'Oval' },
  { id: 'circle', label: 'Circle' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'octagon', label: 'Octagon' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'shield', label: 'Shield' },
  { id: 'crest', label: 'Royal Crest' },
  { id: 'arch', label: 'Arch' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'heart', label: 'Heart' },
  { id: 'scalloped', label: 'Scalloped' },
  { id: 'ribbon-banner', label: 'Ribbon Banner' },
  { id: 'ticket-notch', label: 'Ticket Notch' },
  { id: 'house-roof', label: 'House Roof' },
  { id: 'butterfly', label: 'Butterfly' },
  { id: 'star-burst', label: 'Starburst' },
  { id: 'text-outline', label: 'Text Outline' },
]

const MOUNTING_STYLES: { id: MountingStyle; label: string }[] = [
  { id: 'freestanding-desk', label: 'Freestanding Desk' },
  { id: 'flat-wall', label: 'Flat Wall-Mounted' },
  { id: 'layered-background', label: 'Layered Background' },
  { id: 'text-only-3d', label: 'Text-Only 3D' },
]

const DECORATIONS: { id: DecorationType; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'stars', label: 'Twin Stars' },
  { id: 'crown', label: 'Royal Crown' },
  { id: 'laurel-wreath', label: 'Laurel Wreath' },
  { id: 'floral-corner', label: 'Floral Corners' },
  { id: 'lotus-mandala', label: 'Lotus Mandala' },
  { id: 'temple-arch', label: 'Temple Emblem' },
  { id: 'gaming-brackets', label: 'Gaming Brackets' },
  { id: 'lightning-bolts', label: 'Lightning Bolts' },
  { id: 'sword-crest', label: 'Sword Crest' },
  { id: 'wings-emblem', label: 'Cyber Wings' },
  { id: 'corner-rivets', label: 'Hex Rivets' },
  { id: 'diamond-gems', label: 'Diamond Gems' },
  { id: 'heart-emblem', label: 'Heart Emblems' },
  { id: 'butterfly-accent', label: 'Butterflies' },
  { id: 'moon-stars', label: 'Moon & Star' },
  { id: 'music-notes', label: 'Music Notes' },
  { id: 'paw-print', label: 'Paw Print' },
]

export const StudioLeftPanel: React.FC<StudioLeftPanelProps> = ({ design, onUpdateDesign }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'shape' | 'material' | 'mounting'>('text')
  const [fontCategory, setFontCategory] = useState<string>('all')

  const filteredFonts = STUDIO_FONTS.filter((f) => fontCategory === 'all' || f.category === fontCategory)

  const updateLine = (index: number, patch: Partial<TextLine>) => {
    onUpdateDesign((prev) => {
      const nextLines = [...prev.lines]
      if (nextLines[index]) {
        nextLines[index] = { ...nextLines[index], ...patch }
      }
      return { ...prev, lines: nextLines }
    })
  }

  const addLine = () => {
    if (design.lines.length >= 4) return
    onUpdateDesign((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: `line-${prev.lines.length + 1}`,
          text: 'SUBTITLE',
          fontId: 'outfit',
          fontSize: 10,
          letterSpacing: 0,
          align: 'center',
          bold: false,
          italic: false,
          color: '#D9AE4E',
          yOffset: -12,
        },
      ],
    }))
  }

  const removeLine = (index: number) => {
    if (design.lines.length <= 1) return
    onUpdateDesign((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="grid grid-cols-4 gap-1 rounded-card border border-line bg-surface p-1">
        {[
          { id: 'text', label: '1. Text' },
          { id: 'shape', label: '2. Shape' },
          { id: 'material', label: '3. Finish' },
          { id: 'mounting', label: '4. Mount' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`py-2 text-[12.5px] font-semibold rounded-control transition-colors ${
              activeTab === t.id
                ? 'bg-accent text-surface shadow-sm'
                : 'text-muted hover:text-ink hover:bg-alt'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Text & Typography */}
      {activeTab === 'text' && (
        <div className="rounded-card border border-line bg-surface p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-sans text-[12px] font-bold uppercase tracking-wider text-accent m-0">
              Typography & Lines ({design.lines.length}/4)
            </h4>
            {design.lines.length < 4 && (
              <button
                type="button"
                onClick={addLine}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                + Add Line
              </button>
            )}
          </div>

          {/* Lettering Mode */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted">Lettering Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'raised', label: 'Raised 3D' },
                { id: 'engraved', label: 'Engraved Pocket' },
                { id: 'cut-out', label: 'Cut-out Diffuser' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onUpdateDesign((prev) => ({ ...prev, letteringMode: m.id as LetteringMode }))}
                  className={`py-2 text-[12px] font-medium rounded-control border transition-colors ${
                    design.letteringMode === m.id
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-alt text-ink hover:border-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lines Editor */}
          {design.lines.map((line, idx) => (
            <div key={line.id} className="p-3.5 rounded-control border border-line bg-alt space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-ink">Line {idx + 1}</span>
                {design.lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="text-[11px] text-danger hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                value={line.text}
                maxLength={30}
                onChange={(e) => updateLine(idx, { text: e.target.value })}
                placeholder={`Line ${idx + 1} text`}
                className="w-full rounded-control border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink focus:border-accent focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-muted block mb-1">Font Family</label>
                  <select
                    value={line.fontId}
                    onChange={(e) => updateLine(idx, { fontId: e.target.value })}
                    className="w-full rounded-control border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none"
                  >
                    {filteredFonts.slice(0, 40).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-muted block mb-1">Font Size: {line.fontSize}mm</label>
                  <input
                    type="range"
                    min="8"
                    max="36"
                    step="1"
                    value={line.fontSize}
                    onChange={(e) => updateLine(idx, { fontSize: Number(e.target.value) })}
                    className="w-full accent-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateLine(idx, { bold: !line.bold })}
                    className={`px-2 py-0.5 text-xs font-bold rounded ${line.bold ? 'bg-accent text-surface' : 'text-muted hover:text-ink'}`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLine(idx, { italic: !line.italic })}
                    className={`px-2 py-0.5 text-xs italic font-serif rounded ${line.italic ? 'bg-accent text-surface' : 'text-muted hover:text-ink'}`}
                  >
                    I
                  </button>
                  {(['left', 'center', 'right'] as const).map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => updateLine(idx, { align: al })}
                      className={`px-2 py-0.5 text-[11px] capitalize rounded ${line.align === al ? 'bg-accent text-surface font-semibold' : 'text-muted hover:text-ink'}`}
                    >
                      {al[0].toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-muted">Color:</label>
                  <input
                    type="color"
                    value={line.color}
                    onChange={(e) => updateLine(idx, { color: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border border-line bg-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Shape & Dimensions */}
      {activeTab === 'shape' && (
        <div className="rounded-card border border-line bg-surface p-5 space-y-5">
          <h4 className="font-sans text-[12px] font-bold uppercase tracking-wider text-accent m-0">
            Plate Category & Shape
          </h4>

          {/* Nameplate Type Archetype */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted">Application Style</label>
            <div className="grid grid-cols-2 gap-2">
              {NAMEPLATE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      type: t.id,
                      shape: t.recommendedShape,
                      mountingStyle: t.recommendedMounting,
                      widthMm: t.defaultWidthMm,
                      heightMm: t.defaultHeightMm,
                    }))
                  }
                  className={`p-2.5 text-left rounded-control border transition-colors ${
                    design.type === t.id
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-alt text-ink hover:border-muted'
                  }`}
                >
                  <div className="text-[12.5px] font-medium">{t.name}</div>
                  <div className="text-[10.5px] text-muted truncate">{t.tagline}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Silhouette Shape Selector */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted">Silhouette Shape</label>
            <div className="grid grid-cols-4 gap-2 max-h-[180px] overflow-y-auto pr-1">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdateDesign((prev) => ({ ...prev, shape: s.id }))}
                  className={`p-2 text-center rounded-control border text-[11px] capitalize transition-colors truncate ${
                    design.shape === s.id
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-alt text-ink hover:border-muted'
                  }`}
                  title={s.label}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Width: {design.widthMm} mm</span>
              <span className="font-mono text-ink">Max: 300 mm</span>
            </div>
            <input
              type="range"
              min="100"
              max="260"
              step="5"
              value={design.widthMm}
              onChange={(e) => onUpdateDesign((prev) => ({ ...prev, widthMm: Number(e.target.value) }))}
              className="w-full accent-accent"
            />

            <div className="flex justify-between text-xs">
              <span className="text-muted">Height: {design.heightMm} mm</span>
              <span className="font-mono text-ink">Max: 150 mm</span>
            </div>
            <input
              type="range"
              min="40"
              max="120"
              step="5"
              value={design.heightMm}
              onChange={(e) => onUpdateDesign((prev) => ({ ...prev, heightMm: Number(e.target.value) }))}
              className="w-full accent-accent"
            />

            <div className="flex justify-between text-xs">
              <span className="text-muted">Base Thickness: {design.baseThicknessMm} mm</span>
              <span className="font-mono text-ink">2 – 8 mm</span>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              step="0.5"
              value={design.baseThicknessMm}
              onChange={(e) => onUpdateDesign((prev) => ({ ...prev, baseThicknessMm: Number(e.target.value) }))}
              className="w-full accent-accent"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Materials & Finishes */}
      {activeTab === 'material' && (
        <div className="rounded-card border border-line bg-surface p-5 space-y-5">
          <h4 className="font-sans text-[12px] font-bold uppercase tracking-wider text-accent m-0">
            Material Finish & Palettes
          </h4>

          {/* Finish Presets */}
          <div className="grid grid-cols-2 gap-2">
            {MATERIAL_PRESETS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onUpdateDesign((prev) => ({ ...prev, materialFinish: m.id }))}
                className={`p-2.5 text-left rounded-control border transition-colors ${
                  design.materialFinish === m.id
                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                    : 'border-line bg-alt text-ink hover:border-muted'
                }`}
              >
                <div className="text-[12.5px] font-medium capitalize">{m.name}</div>
                <div className="text-[10px] text-muted truncate">{m.shortNote}</div>
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Base Color</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-ink">{design.baseColor}</span>
                <input
                  type="color"
                  value={design.baseColor}
                  onChange={(e) => onUpdateDesign((prev) => ({ ...prev, baseColor: e.target.value }))}
                  className="w-6 h-6 rounded cursor-pointer border border-line bg-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Secondary / Stand Color</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-ink">{design.secondaryBaseColor}</span>
                <input
                  type="color"
                  value={design.secondaryBaseColor}
                  onChange={(e) => onUpdateDesign((prev) => ({ ...prev, secondaryBaseColor: e.target.value }))}
                  className="w-6 h-6 rounded cursor-pointer border border-line bg-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Border Frame Color</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-ink">{design.borderColor}</span>
                <input
                  type="color"
                  value={design.borderColor}
                  onChange={(e) => onUpdateDesign((prev) => ({ ...prev, borderColor: e.target.value }))}
                  className="w-6 h-6 rounded cursor-pointer border border-line bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Mounting & Emblems */}
      {activeTab === 'mounting' && (
        <div className="rounded-card border border-line bg-surface p-5 space-y-5">
          <h4 className="font-sans text-[12px] font-bold uppercase tracking-wider text-accent m-0">
            Mounting Engineering & Accents
          </h4>

          {/* Mounting Style */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted">Mounting Configuration</label>
            <div className="grid grid-cols-2 gap-2">
              {MOUNTING_STYLES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onUpdateDesign((prev) => ({ ...prev, mountingStyle: m.id }))}
                  className={`p-2.5 text-left rounded-control border transition-colors ${
                    design.mountingStyle === m.id
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-alt text-ink hover:border-muted'
                  }`}
                >
                  <div className="text-[12px] font-medium">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Decorative Emblem */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted">3D Decorative Emblem</label>
            <select
              value={design.decoration}
              onChange={(e) => onUpdateDesign((prev) => ({ ...prev, decoration: e.target.value as DecorationType }))}
              className="w-full rounded-control border border-line bg-alt px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
            >
              {DECORATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Raised Border Frame Toggle */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-line">
            <div>
              <div className="font-medium text-ink">Raised Outer Border</div>
              <div className="text-[11px] text-muted">Adds structural perimeter relief frame</div>
            </div>
            <input
              type="checkbox"
              checked={design.borderEnabled}
              onChange={(e) => onUpdateDesign((prev) => ({ ...prev, borderEnabled: e.target.checked }))}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
          </div>

          {/* LED Edge Glow Channel Toggle */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-line">
            <div>
              <div className="font-medium text-ink">Translucent LED Glow Channel</div>
              <div className="text-[11px] text-muted">Diffuser rim channel (+₹150.00)</div>
            </div>
            <input
              type="checkbox"
              checked={design.ledGlowEnabled}
              onChange={(e) => onUpdateDesign((prev) => ({ ...prev, ledGlowEnabled: e.target.checked }))}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  )
}
