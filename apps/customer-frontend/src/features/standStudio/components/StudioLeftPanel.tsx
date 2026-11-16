import React, { useState } from 'react';
import type {
  BaseShape, CombinedType, DecorativeMotif, DesignConfig, DesignThemeId, FontStyleId,
  HoleArrangement, HoleShape, MaterialFinish, PenHolderType, PhoneStandType,
  StudioCategory, TextAlignment, TextPlacement,
} from '../types/design';
import { CATEGORY_META, DESIGN_THEMES, MATERIAL_SWATCHES } from '../core/defaults';
import { TEMPLATE_LIBRARY } from '../core/templates';

interface StudioLeftPanelProps {
  config: DesignConfig;
  svgError: string | null;
  onChange: (updater: (prev: DesignConfig) => DesignConfig) => void;
  onApplyTheme: (themeId: DesignThemeId) => void;
  onApplyTemplate: (templateId: string) => void;
}

type LeftTab = 'geometry' | 'personalize' | 'materials';

const PHONE_TYPES: Array<{ id: PhoneStandType; label: string }> = [
  { id: 'minimalist-angled', label: 'Minimalist Angled' }, { id: 'cradle', label: 'Cradle Phone Stand' },
  { id: 'vertical-dock', label: 'Vertical Docking Stand' }, { id: 'horizontal-landscape', label: 'Horizontal Landscape' },
  { id: 'foldable-inspired', label: 'Hinged / Foldable' }, { id: 'curved-sculptural', label: 'Curved Sculptural' },
  { id: 'gaming-themed', label: 'Gaming-Themed Stand' }, { id: 'geometric', label: 'Geometric Faceted' },
  { id: 'nameplate', label: 'Nameplate Plinth' }, { id: 'cable-groove', label: 'Cable-Management Groove' },
];

const PEN_TYPES: Array<{ id: PenHolderType; label: string }> = [
  { id: 'round-cup', label: 'Round Pencil Cup' }, { id: 'square-cup', label: 'Square Pencil Cup' },
  { id: 'hexagonal-cup', label: 'Hexagonal Pencil Cup' }, { id: 'honeycomb-holder', label: 'Honeycomb Holder' },
  { id: 'wave-ribbed', label: 'Wave / Ribbed Holder' }, { id: 'geometric-polygon', label: 'Geometric Polygon' },
  { id: 'spiral-aesthetic', label: 'Spiral Aesthetic Holder' }, { id: 'multi-slot-rack', label: 'Multi-Slot Pen Rack' },
  { id: 'angled-pen-holder', label: 'Angled Pen Holder' }, { id: 'modular-storage', label: 'Modular Pen Storage' },
  { id: 'personalized-name-cup', label: 'Personalized Name Cup' }, { id: 'open-top-organizer', label: 'Open-Top Desk Organizer' },
];

const COMBINED_TYPES: Array<{ id: CombinedType; label: string }> = [
  { id: 'phone-left-pen-right', label: 'Phone Left + Pen Right' }, { id: 'pen-left-phone-right', label: 'Pen Left + Phone Right' },
  { id: 'center-phone-dual-pens', label: 'Center Phone + Dual Pens' }, { id: 'phone-cradle-rear-pen', label: 'Phone Cradle + Rear Pen' },
  { id: 'pen-holder-phone-rest', label: 'Pen Holder + Phone Rest' }, { id: 'desk-organizer-tray', label: 'Phone + Pen + Item Tray' },
  { id: 'compact-corner', label: 'Compact Corner Organizer' }, { id: 'executive-personalized', label: 'Executive Name Organizer' },
];

const FONT_STYLES: Array<{ id: FontStyleId; label: string }> = [
  { id: 'modern-sans', label: 'Modern Sans' }, { id: 'bold', label: 'Heavy Bold' },
  { id: 'serif', label: 'Classic Serif' }, { id: 'rounded', label: 'Soft Rounded' },
  { id: 'futuristic', label: 'Futuristic' }, { id: 'handwritten', label: 'Handwritten' },
  { id: 'cursive', label: 'Cursive Script' }, { id: 'playful', label: 'Playful Bounce' },
];

const MOTIFS: Array<{ id: DecorativeMotif; label: string }> = [
  { id: 'none', label: 'None' }, { id: 'star', label: 'Star' }, { id: 'heart', label: 'Heart' },
  { id: 'flower', label: 'Flower' }, { id: 'leaf', label: 'Leaf' }, { id: 'gear', label: 'Gear' },
  { id: 'hexagon', label: 'Hexagon' }, { id: 'diamond', label: 'Diamond' },
];

const FINISHES: Array<{ id: MaterialFinish; label: string }> = [
  { id: 'matte', label: 'Matte Filament' }, { id: 'satin', label: 'Silk / Satin PLA' },
  { id: 'metallic-gold', label: 'Metallic Gold' }, { id: 'metallic-silver', label: 'Metallic Silver' },
  { id: 'metallic-copper', label: 'Metallic Copper' }, { id: 'two-tone', label: 'Two-Tone Split' },
  { id: 'gradient', label: 'Gradient Filament' }, { id: 'wood-grain', label: 'Wood-Filled PLA' }, { id: 'marble', label: 'Marble PLA' },
];

export const StudioLeftPanel: React.FC<StudioLeftPanelProps> = ({
  config, svgError, onChange, onApplyTheme, onApplyTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<LeftTab>('geometry');
  const [activeZone, setActiveZone] = useState<keyof DesignConfig['appearance']['colors']>('base');

  const showPhoneControls = config.category !== 'pen-holder';
  const showPenControls = config.category !== 'phone-stand';
  const showCombinedControls = config.category === 'combined' || config.category === 'desk-organizer' || config.category === 'personalized-gift';

  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, enabled: true, svgLogoData: content, svgLogoName: file.name } }));
    };
    reader.readAsText(file);
  };

  return (
    <aside aria-label="Design customization controls" className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Category & Quick Preset Selector */}
      <div className="p-4 border-b border-line space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-muted mb-1">Studio Category</label>
          <select value={config.category} onChange={(e) => onChange((prev) => ({ ...prev, category: e.target.value as StudioCategory }))} className="w-full h-[34px] px-2 text-[12px] font-medium rounded-control border border-line bg-surface text-ink focus:border-accent focus:outline-none">
            {(Object.keys(CATEGORY_META) as StudioCategory[]).map((cat) => <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Theme</label>
            <select value={config.appearance.themeId} onChange={(e) => onApplyTheme(e.target.value as DesignThemeId)} className="w-full h-[34px] px-2 text-[11px] rounded-control border border-line bg-surface text-ink focus:border-accent focus:outline-none">
              {Object.values(DESIGN_THEMES).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted mb-1">Preset</label>
            <select value="" onChange={(e) => { if (e.target.value) onApplyTemplate(e.target.value); }} className="w-full h-[34px] px-2 text-[11px] rounded-control border border-line bg-surface text-ink focus:border-accent focus:outline-none">
              <option value="">Choose...</option>
              {TEMPLATE_LIBRARY.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="grid grid-cols-3 gap-1 p-1.5 mx-3 mt-3 bg-alt rounded-control border border-line/50">
        {([{ id: 'geometry', label: 'Geometry' }, { id: 'personalize', label: 'Personalize' }, { id: 'materials', label: 'Materials' }] as const).map((tab) => (
          <button key={tab.id} role="tab" type="button" onClick={() => setActiveTab(tab.id)} className={`py-1.5 text-[11px] font-semibold rounded-control transition-colors ${activeTab === tab.id ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-ink'}`}>{tab.label}</button>
        ))}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        
        {/* GEOMETRY TAB */}
        {activeTab === 'geometry' && (
          <>
            {showCombinedControls && (
              <section className="space-y-3 pb-4 border-b border-line">
                <h3 className="text-[12px] font-bold tracking-wider text-accent uppercase">Combined Layout</h3>
                <div>
                  <label className="block text-[11px] text-muted mb-1">Arrangement</label>
                  <select value={config.combined.type} onChange={(e) => onChange((prev) => ({ ...prev, combined: { ...prev.combined, type: e.target.value as CombinedType } }))} className="w-full h-[30px] px-2 text-xs rounded border border-line bg-surface text-ink focus:border-accent focus:outline-none">
                    {COMBINED_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-muted mb-1">Base Footprint</label>
                  <select value={config.combined.baseShape} onChange={(e) => onChange((prev) => ({ ...prev, combined: { ...prev.combined, baseShape: e.target.value as BaseShape } }))} className="w-full h-[30px] px-2 text-xs rounded border border-line bg-surface text-ink focus:border-accent focus:outline-none">
                    <option value="rounded-rect">Rounded Rectangle</option><option value="stadium">Stadium Pill</option>
                    <option value="chamfered">Chamfered</option><option value="hexagonal">Hexagonal</option>
                  </select>
                </div>
                <SliderField id="module-spacing" label="Module Spacing" value={config.combined.moduleSpacing} min={2} max={28} step={1} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, combined: { ...prev.combined, moduleSpacing: v } }))} />
                <div className="space-y-2 pt-1">
                  <ToggleField id="include-tray" label="Include Small-Item Tray" checked={config.combined.includeTray} onChange={(c) => onChange((prev) => ({ ...prev, combined: { ...prev.combined, includeTray: c } }))} />
                  {config.combined.includeTray && (
                    <div className="grid grid-cols-2 gap-2 pl-2">
                      <SliderField id="tray-w" label="Tray Width" value={config.combined.trayWidth} min={32} max={80} step={2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, combined: { ...prev.combined, trayWidth: v } }))} />
                      <SliderField id="tray-h" label="Tray Height" value={config.combined.trayWallHeight} min={8} max={28} step={1} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, combined: { ...prev.combined, trayWallHeight: v } }))} />
                    </div>
                  )}
                  <ToggleField id="merge-solid" label="Merge into Single Solid" checked={config.combined.mergeSingleSolid} onChange={(c) => onChange((prev) => ({ ...prev, combined: { ...prev.combined, mergeSingleSolid: c } }))} />
                </div>
              </section>
            )}

            {showPhoneControls && (
              <section className="space-y-3 pb-4 border-b border-line">
                <h3 className="text-[12px] font-bold tracking-wider text-accent uppercase">Phone Stand</h3>
                <div>
                  <label className="block text-[11px] text-muted mb-1">Stand Style</label>
                  <select value={config.phone.type} onChange={(e) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, type: e.target.value as PhoneStandType } }))} className="w-full h-[30px] px-2 text-xs rounded border border-line bg-surface text-ink focus:border-accent focus:outline-none">
                    {PHONE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted">Orientation</span>
                  <div className="inline-flex rounded bg-alt p-0.5 border border-line/50">
                    {(['portrait', 'landscape'] as const).map((orient) => (
                      <button key={orient} onClick={() => onChange((prev) => ({ ...prev, phone: { ...prev.phone, orientation: orient } }))} className={`px-2 py-0.5 text-[10px] font-medium rounded capitalize ${config.phone.orientation === orient ? 'bg-surface text-accent shadow-sm' : 'text-muted'}`}>{orient}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <SliderField id="p-bw" label="Base Width" value={config.phone.baseWidth} min={50} max={140} step={2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, baseWidth: v } }))} />
                  <SliderField id="p-bd" label="Base Depth" value={config.phone.baseDepth} min={60} max={140} step={2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, baseDepth: v } }))} />
                  <SliderField id="p-bt" label="Base Thick" value={config.phone.baseThickness} min={2.5} max={14} step={0.5} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, baseThickness: v } }))} />
                  <SliderField id="p-bh" label="Back Height" value={config.phone.backHeight} min={50} max={140} step={2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, backHeight: v } }))} />
                  <SliderField id="p-ra" label="Resting Angle" value={config.phone.restingAngle} min={42} max={82} step={1} unit="°" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, restingAngle: v } }))} />
                  <SliderField id="p-lh" label="Lip Height" value={config.phone.lipHeight} min={4} max={22} step={1} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, lipHeight: v } }))} />
                  <SliderField id="p-pt" label="Phone+Case" value={config.phone.phoneThickness} min={6} max={18} step={0.5} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, phoneThickness: v } }))} />
                  <SliderField id="p-cc" label="Fit Clearance" value={config.phone.caseClearance} min={0.5} max={4} step={0.5} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, caseClearance: v } }))} />
                  <SliderField id="p-cr" label="Corner Radius" value={config.phone.cornerRadius} min={1} max={18} step={1} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, cornerRadius: v } }))} />
                  <SliderField id="p-cs" label="Cable Slot" value={config.phone.cableSlotWidth} min={8} max={30} step={1} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, cableSlotWidth: v } }))} />
                </div>
                <div className="space-y-1 pt-1">
                  <ToggleField id="p-cable" label="Cable Routing Tunnel" checked={config.phone.cableRoutingHole} onChange={(c) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, cableRoutingHole: c } }))} />
                  <ToggleField id="p-slip" label="Non-Slip Pad Recesses" checked={config.phone.nonSlipRecesses} onChange={(c) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, nonSlipRecesses: c } }))} />
                  {config.category === 'phone-stand' && <ToggleField id="p-loop" label="Attach Side Pen Loop" checked={config.phone.sidePenLoop} onChange={(c) => onChange((prev) => ({ ...prev, phone: { ...prev.phone, sidePenLoop: c } }))} />}
                </div>
              </section>
            )}

            {showPenControls && (
              <section className="space-y-3">
                <h3 className="text-[12px] font-bold tracking-wider text-accent uppercase">Pen Holder</h3>
                <div>
                  <label className="block text-[11px] text-muted mb-1">Holder Style</label>
                  <select value={config.pen.type} onChange={(e) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, type: e.target.value as PenHolderType } }))} className="w-full h-[30px] px-2 text-xs rounded border border-line bg-surface text-ink focus:border-accent focus:outline-none">
                    {PEN_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <SliderField id="pe-ch" label="Cup Height" value={config.pen.cupHeight} min={40} max={140} step={2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, cupHeight: v } }))} />
                  <SliderField id="pe-od" label="Outer Ø" value={config.pen.exteriorDiameter} min={40} max={110} step={2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, exteriorDiameter: v } }))} />
                  <SliderField id="pe-wt" label="Wall Thick" value={config.pen.wallThickness} min={1.4} max={8} step={0.2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, wallThickness: v } }))} />
                  <SliderField id="pe-bf" label="Bottom Floor" value={config.pen.bottomThickness} min={2} max={12} step={0.5} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, bottomThickness: v } }))} />
                </div>
                {config.pen.type === 'multi-slot-rack' && (
                  <div className="p-2.5 rounded bg-alt border border-line/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <SliderField id="pe-sc" label="Slots" value={config.pen.slotCount} min={1} max={12} step={1} unit="" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, slotCount: v } }))} />
                      <SliderField id="pe-sd" label="Bore Ø" value={config.pen.slotDiameter} min={8} max={20} step={0.5} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, slotDiameter: v } }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-[10px] text-muted mb-1">Shape</label><select value={config.pen.holeShape} onChange={(e) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, holeShape: e.target.value as HoleShape } }))} className="w-full h-[26px] px-1 text-[11px] rounded border border-line bg-surface text-ink focus:border-accent"><option value="round">Round</option><option value="square">Square</option><option value="hexagonal">Hexagonal</option></select></div>
                      <div><label className="block text-[10px] text-muted mb-1">Layout</label><select value={config.pen.holeArrangement} onChange={(e) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, holeArrangement: e.target.value as HoleArrangement } }))} className="w-full h-[26px] px-1 text-[11px] rounded border border-line bg-surface text-ink focus:border-accent"><option value="grid">Grid</option><option value="circular">Circular</option><option value="staggered">Staggered</option><option value="linear">Linear</option></select></div>
                    </div>
                  </div>
                )}
                {(config.pen.type === 'wave-ribbed' || config.pen.type === 'spiral-aesthetic') && (
                  <div className="grid grid-cols-2 gap-3">
                    <SliderField id="pe-rc" label="Flute Count" value={config.pen.ribCount} min={6} max={32} step={2} unit="" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, ribCount: v } }))} />
                    <SliderField id="pe-rd" label="Flute Depth" value={config.pen.ribDepth} min={0.6} max={3.5} step={0.2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, ribDepth: v } }))} />
                  </div>
                )}
                {config.category === 'pen-holder' && (
                  <div className="space-y-1 pt-1">
                    <SliderField id="pe-cc" label="Connected Cups" value={config.pen.cupCount} min={1} max={3} step={1} unit="" onChange={(v) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, cupCount: v } }))} />
                    <ToggleField id="pe-ib" label="Stepped Stability Collar" checked={config.pen.integratedBase} onChange={(c) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, integratedBase: c } }))} />
                    <ToggleField id="pe-st" label="Front Clips & Erasers Tray" checked={config.pen.shallowTray} onChange={(c) => onChange((prev) => ({ ...prev, pen: { ...prev.pen, shallowTray: c } }))} />
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* PERSONALIZE TAB */}
        {activeTab === 'personalize' && (
          <div className="space-y-4">
            <ToggleField id="pers-en" label="Enable 3D Text, Motifs & Logos" checked={config.personalization.enabled} onChange={(c) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, enabled: c } }))} />
            <div className={config.personalization.enabled ? 'space-y-4' : 'space-y-4 opacity-40 pointer-events-none'}>
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">Custom Name / Monogram</label>
                <input type="text" maxLength={22} placeholder="Enter name..." value={config.personalization.text} onChange={(e) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, text: e.target.value } }))} className="w-full h-[34px] px-2.5 text-[12px] rounded-control border border-line bg-surface text-ink focus:border-accent focus:outline-none" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">Text Geometry</span>
                <div className="inline-flex rounded bg-alt p-0.5 border border-line/50">
                  {(['raised', 'engraved'] as const).map((m) => (
                    <button key={m} onClick={() => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, mode: m } }))} className={`px-2 py-0.5 text-[10px] font-medium rounded capitalize ${config.personalization.mode === m ? 'bg-surface text-accent shadow-sm' : 'text-muted'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-[11px] text-muted mb-1">Font</label><select value={config.personalization.fontStyle} onChange={(e) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, fontStyle: e.target.value as FontStyleId } }))} className="w-full h-[28px] px-1 text-[11px] rounded border border-line bg-surface text-ink focus:border-accent">{FONT_STYLES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
                <div><label className="block text-[11px] text-muted mb-1">Placement</label><select value={config.personalization.placement} onChange={(e) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, placement: e.target.value as TextPlacement } }))} className="w-full h-[28px] px-1 text-[11px] rounded border border-line bg-surface text-ink focus:border-accent"><option value="front">Front Face</option><option value="base">Base Top</option><option value="left-side">Left Side</option><option value="right-side">Right Side</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <SliderField id="pe-fs" label="Font Size" value={config.personalization.fontSize} min={5} max={16} step={0.5} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, fontSize: v } }))} />
                <SliderField id="pe-dep" label="Relief Depth" value={config.personalization.depth} min={0.6} max={3.5} step={0.2} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, depth: v } }))} />
                <SliderField id="pe-ls" label="Letter Spacing" value={config.personalization.letterSpacing} min={0.6} max={2.4} step={0.1} unit="×" onChange={(v) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, letterSpacing: v } }))} />
                <div><label className="block text-[11px] text-muted mb-1">Align</label><select value={config.personalization.alignment} onChange={(e) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, alignment: e.target.value as TextAlignment } }))} className="w-full h-[28px] px-1 text-[11px] rounded border border-line bg-surface text-ink focus:border-accent"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
              </div>
              <ToggleField id="pe-curve" label="Curved Cylinder Wrap (Round Cups)" checked={config.personalization.curved} onChange={(c) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, curved: c } }))} />

              <div className="pt-3 border-t border-line space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11px] text-muted mb-1">Motif</label><select value={config.personalization.motif} onChange={(e) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, motif: e.target.value as DecorativeMotif } }))} className="w-full h-[28px] px-1 text-[11px] rounded border border-line bg-surface text-ink focus:border-accent">{MOTIFS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></div>
                  <SliderField id="pe-ms" label="Motif Size" value={config.personalization.motifSize} min={6} max={22} step={1} unit="mm" onChange={(v) => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, motifSize: v } }))} />
                </div>
              </div>

              <div className="pt-3 border-t border-line space-y-2">
                <label className="block text-[11px] font-medium text-muted">Upload Custom SVG Logo</label>
                <input type="file" accept=".svg" onChange={handleSvgUpload} className="block w-full text-[11px] text-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-alt file:text-ink hover:file:bg-soft cursor-pointer" />
                {config.personalization.svgLogoName && (
                  <div className="flex items-center justify-between text-[11px] bg-alt px-2 py-1.5 rounded border border-line/50">
                    <span className="truncate">{config.personalization.svgLogoName}</span>
                    <button onClick={() => onChange((prev) => ({ ...prev, personalization: { ...prev.personalization, svgLogoData: null, svgLogoName: null } }))} className="text-danger hover:underline ml-2 shrink-0">Remove</button>
                  </div>
                )}
                {svgError && <p className="text-[11px] text-danger">{svgError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">Surface Finish</label>
              <select value={config.appearance.finish} onChange={(e) => onChange((prev) => ({ ...prev, appearance: { ...prev.appearance, finish: e.target.value as MaterialFinish } }))} className="w-full h-[30px] px-2 text-xs rounded border border-line bg-surface text-ink focus:border-accent">
                {FINISHES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-muted mb-1.5">Select Part Zone</span>
              <div className="grid grid-cols-5 gap-1">
                {([{ id: 'base', label: 'Base' }, { id: 'back', label: 'Back' }, { id: 'cup', label: 'Cup' }, { id: 'text', label: 'Text' }, { id: 'accent', label: 'Lip' }] as const).map((z) => (
                  <button key={z.id} type="button" onClick={() => setActiveZone(z.id)} className={`flex flex-col items-center gap-1 py-1 px-0.5 rounded border text-[10px] font-medium ${activeZone === z.id ? 'border-accent bg-soft text-accent' : 'border-line text-muted'}`}>
                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: config.appearance.colors[z.id] }} />
                    <span>{z.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={config.appearance.colors[activeZone]} onChange={(e) => onChange((prev) => ({ ...prev, appearance: { ...prev.appearance, colors: { ...prev.appearance.colors, [activeZone]: e.target.value } } }))} className="w-10 h-8 rounded border border-line cursor-pointer bg-transparent p-0" />
              <input type="text" value={config.appearance.colors[activeZone]} onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange((prev) => ({ ...prev, appearance: { ...prev.appearance, colors: { ...prev.appearance.colors, [activeZone]: e.target.value } } })) }} className="flex-1 h-[32px] px-2 text-[11px] font-mono uppercase rounded border border-line bg-surface text-ink focus:border-accent" />
            </div>
            <div className="space-y-2 pt-1">
              {(['Neutrals', 'Metallics', 'Pastels', 'Neons'] as const).map((group) => (
                <div key={group}>
                  <span className="block text-[10px] font-medium text-muted mb-1">{group}</span>
                  <div className="grid grid-cols-4 gap-1">
                    {MATERIAL_SWATCHES.filter((s) => s.group === group).map((swatch) => (
                      <button key={swatch.name} title={swatch.name} onClick={() => onChange((prev) => ({ ...prev, appearance: { ...prev.appearance, colors: { ...prev.appearance.colors, [activeZone]: swatch.hex } } }))} className="flex items-center gap-1 p-0.5 rounded border border-line hover:border-accent text-left">
                        <span className="w-3 h-3 rounded-sm shrink-0 border border-black/10" style={{ backgroundColor: swatch.hex }} />
                        <span className="text-[9px] truncate text-muted">{swatch.name.split(' ')[1] || swatch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 rounded bg-alt border border-line/50 text-[10px] text-muted leading-relaxed mt-2">
              <strong className="text-ink">STL Color Note:</strong> Standard binary STL files store geometry only. For multi-color printing, disable "Merge into Single Solid" and export the Multi-Part ZIP.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// ─── Helper Components ────────────────────────────────────────────────────────
interface SliderFieldProps { id: string; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (val: number) => void; }
const SliderField: React.FC<SliderFieldProps> = ({ id, label, value, min, max, step, unit, onChange }) => (
  <div className="py-0.5">
    <div className="flex items-center justify-between text-[10px] mb-0.5">
      <label htmlFor={id} className="text-muted truncate pr-1">{label}</label>
      <span className="font-mono text-ink shrink-0">{Number.isInteger(step) ? value : value.toFixed(1)}{unit}</span>
    </div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1 accent-[var(--color-accent,#D9AE4E)] cursor-pointer" />
  </div>
);

interface ToggleFieldProps { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void; }
const ToggleField: React.FC<ToggleFieldProps> = ({ id, label, checked, onChange }) => (
  <label htmlFor={id} className="flex items-center justify-between gap-2 text-[11px] text-ink cursor-pointer py-0.5">
    <span>{label}</span>
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-3.5 h-3.5 rounded border-line accent-[var(--color-accent,#D9AE4E)]" />
  </label>
);