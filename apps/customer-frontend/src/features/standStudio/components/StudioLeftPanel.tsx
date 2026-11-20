import React, { useState } from 'react';
import type {
  BaseShape,
  CombinedType,
  DecorativeMotif,
  DesignConfig,
  DesignThemeId,
  FontStyleId,
  HoleArrangement,
  HoleShape,
  MaterialFinish,
  PenHolderType,
  PhoneStandType,
  StudioCategory,
  TextAlignment,
  TextPlacement,
} from '../types/design';
import { CATEGORY_META, DESIGN_THEMES, MATERIAL_SWATCHES } from '../core/defaults';
import { TEMPLATE_LIBRARY } from '../core/templates';
import VisualDesignCardRail from '../../../components/customiser/VisualDesignCardRail';
import { getStandTemplatePreview, getStandThemePreview, getStandCategoryPreview } from '../core/standTemplateAssets';

interface StudioLeftPanelProps {
  config: DesignConfig;
  svgError: string | null;
  onChange: (updater: (prev: DesignConfig) => DesignConfig) => void;
  onApplyTheme: (themeId: DesignThemeId) => void;
  onApplyTemplate: (templateId: string) => void;
}

type LeftTab = 'geometry' | 'personalize' | 'materials';

const PHONE_TYPES: Array<{ id: PhoneStandType; label: string }> = [
  { id: 'minimalist-angled', label: 'Minimalist Angled' },
  { id: 'cradle', label: 'Cradle Phone Stand' },
  { id: 'vertical-dock', label: 'Vertical Docking Stand' },
  { id: 'horizontal-landscape', label: 'Horizontal Landscape' },
  { id: 'foldable-inspired', label: 'Hinged / Foldable-Inspired' },
  { id: 'curved-sculptural', label: 'Curved Sculptural' },
  { id: 'gaming-themed', label: 'Gaming-Themed Stand' },
  { id: 'geometric', label: 'Geometric Faceted' },
  { id: 'nameplate', label: 'Nameplate Plinth Stand' },
  { id: 'cable-groove', label: 'Cable-Management Groove' },
];

const PEN_TYPES: Array<{ id: PenHolderType; label: string }> = [
  { id: 'round-cup', label: 'Round Pencil Cup' },
  { id: 'square-cup', label: 'Square Pencil Cup' },
  { id: 'hexagonal-cup', label: 'Hexagonal Pencil Cup' },
  { id: 'honeycomb-holder', label: 'Honeycomb Holder' },
  { id: 'wave-ribbed', label: 'Wave / Ribbed Holder' },
  { id: 'geometric-polygon', label: 'Geometric Polygon' },
  { id: 'spiral-aesthetic', label: 'Spiral Aesthetic Holder' },
  { id: 'multi-slot-rack', label: 'Multi-Slot Pen Rack' },
  { id: 'angled-pen-holder', label: 'Angled Pen Holder' },
  { id: 'modular-storage', label: 'Modular Pen Storage' },
  { id: 'personalized-name-cup', label: 'Personalized Name Cup' },
  { id: 'open-top-organizer', label: 'Open-Top Desk Organizer' },
];

const COMBINED_TYPES: Array<{ id: CombinedType; label: string }> = [
  { id: 'phone-left-pen-right', label: 'Phone Left + Pen Right' },
  { id: 'pen-left-phone-right', label: 'Pen Left + Phone Right' },
  { id: 'center-phone-dual-pens', label: 'Center Phone + Dual Pens' },
  { id: 'phone-cradle-rear-pen', label: 'Phone Cradle + Rear Pen' },
  { id: 'pen-holder-phone-rest', label: 'Pen Holder + Phone Rest' },
  { id: 'desk-organizer-tray', label: 'Phone + Pen + Item Tray' },
  { id: 'compact-corner', label: 'Compact Corner Organizer' },
  { id: 'executive-personalized', label: 'Executive Name Organizer' },
];

const FONT_STYLES: Array<{ id: FontStyleId; label: string }> = [
  { id: 'modern-sans', label: 'Modern Sans' },
  { id: 'bold', label: 'Heavy Bold' },
  { id: 'serif', label: 'Classic Serif' },
  { id: 'rounded', label: 'Soft Rounded' },
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'handwritten', label: 'Handwritten' },
  { id: 'cursive', label: 'Cursive Script' },
  { id: 'playful', label: 'Playful Bounce' },
];

const MOTIFS: Array<{ id: DecorativeMotif; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'star', label: 'Star' },
  { id: 'heart', label: 'Heart' },
  { id: 'flower', label: 'Flower' },
  { id: 'leaf', label: 'Leaf' },
  { id: 'gear', label: 'Gear' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'diamond', label: 'Diamond' },
];

const FINISHES: Array<{ id: MaterialFinish; label: string }> = [
  { id: 'matte', label: 'Matte Filament' },
  { id: 'satin', label: 'Silk / Satin PLA' },
  { id: 'metallic-gold', label: 'Metallic Gold' },
  { id: 'metallic-silver', label: 'Metallic Silver' },
  { id: 'metallic-copper', label: 'Metallic Copper' },
  { id: 'two-tone', label: 'Two-Tone Split' },
  { id: 'gradient', label: 'Gradient Filament' },
  { id: 'wood-grain', label: 'Wood-Filled PLA' },
  { id: 'marble', label: 'Marble PLA' },
];

export const StudioLeftPanel: React.FC<StudioLeftPanelProps> = ({
  config,
  svgError,
  onChange,
  onApplyTheme,
  onApplyTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<LeftTab>('geometry');
  const [activeZone, setActiveZone] = useState<keyof DesignConfig['appearance']['colors']>('base');

  const showPhoneControls = config.category !== 'pen-holder';
  const showPenControls = config.category !== 'phone-stand';
  const showCombinedControls =
    config.category === 'combined' ||
    config.category === 'desk-organizer' ||
    config.category === 'personalized-gift';

  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      onChange((prev) => ({
        ...prev,
        personalization: {
          ...prev.personalization,
          enabled: true,
          svgLogoData: content,
          svgLogoName: file.name,
        },
      }));
    };
    reader.readAsText(file);
  };

  const categoryTemplates = TEMPLATE_LIBRARY.filter(
    (tpl) => tpl.category === config.category
  );

  const activeTemplate = TEMPLATE_LIBRARY.find((tpl) => tpl.name === config.name);

  const templateRailItems = categoryTemplates.map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    description: tpl.tagline,
    previewSrc: getStandTemplatePreview(tpl.id) ?? getStandCategoryPreview(tpl.category),
    badge: tpl.themeId,
  }));

  const themeRailItems = Object.values(DESIGN_THEMES).map((theme) => ({
    id: theme.id,
    name: theme.label,
    description: theme.description,
    previewSrc: getStandThemePreview(theme.id),
  }));

  return (
    <aside
      aria-label="Design customization controls"
      className="divide-y divide-line rounded-card border border-line bg-surface"
    >
      {/* Category & Quick Preset Selector */}
      <div className="p-5 space-y-4">
        <div>
          <label
            htmlFor="studio-category-select"
            className="block text-xs font-medium text-muted mb-1"
          >
            Studio Category
          </label>
          <select
            id="studio-category-select"
            value={config.category}
            onChange={(e) => {
              const newCat = e.target.value as StudioCategory;
              const matchingTpl = TEMPLATE_LIBRARY.find((tpl) => tpl.category === newCat);
              if (matchingTpl) {
                onApplyTemplate(matchingTpl.id);
              } else {
                const fresh = createDefaultDesign(newCat, config.appearance.themeId);
                onChange(fresh);
              }
            }}
            className="w-full px-3 py-2 text-sm font-medium rounded-control border border-line bg-alt text-ink focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
          >
            {(Object.keys(CATEGORY_META) as StudioCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </div>

        {/* Template Presets Image Rail */}
        {templateRailItems.length > 0 && (
          <div className="pt-1">
            <VisualDesignCardRail
              label="Template Presets"
              items={templateRailItems}
              value={activeTemplate?.id}
              onChange={onApplyTemplate}
            />
          </div>
        )}

        {/* Design Themes Image Rail */}
        <div className="pt-1">
          <VisualDesignCardRail
            label="Design Theme & Style"
            items={themeRailItems}
            value={config.appearance.themeId}
            onChange={(id) => onApplyTheme(id as DesignThemeId)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60">
          <div>
            <label
              htmlFor="design-theme-select"
              className="block text-xs font-medium text-muted mb-1"
            >
              Theme Quick Select
            </label>
            <select
              id="design-theme-select"
              value={config.appearance.themeId}
              onChange={(e) => onApplyTheme(e.target.value as DesignThemeId)}
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded-control border border-line bg-alt text-ink focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
            >
              {Object.values(DESIGN_THEMES).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quick-template-select"
              className="block text-xs font-medium text-muted mb-1"
            >
              Preset Quick Select
            </label>
            <select
              id="quick-template-select"
              value=""
              onChange={(e) => {
                if (e.target.value) onApplyTemplate(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded-control border border-line bg-alt text-ink focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">Choose template...</option>
              {TEMPLATE_LIBRARY.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div
        role="tablist"
        aria-label="Customization sections"
        className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md px-5 py-3 border-b border-line"
      >
        {(
          [
            { id: 'geometry', label: 'Geometry' },
            { id: 'personalize', label: 'Personalize' },
            { id: 'materials', label: 'Materials' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-1.5 px-2 text-xs font-semibold rounded-control transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#1F2937] text-accent font-bold shadow-xs'
                : 'text-muted hover:text-ink hover:bg-surface/50 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Body */}
      <div className="p-5 space-y-6">
        {activeTab === 'geometry' && (
          <>
            {showCombinedControls && (
              <section className="space-y-3 pb-4 border-b border-line">
                <h3 className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
                  Combined Layout & Assembly
                </h3>

                <div>
                  <label
                    htmlFor="combined-layout-select"
                    className="block text-xs text-muted mb-1"
                  >
                    Arrangement
                  </label>
                  <select
                    id="combined-layout-select"
                    value={config.combined.type}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        combined: { ...prev.combined, type: e.target.value as CombinedType },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-control border border-line bg-alt"
                  >
                    {COMBINED_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="base-shape-select"
                    className="block text-xs text-muted mb-1"
                  >
                    Base Footprint Shape
                  </label>
                  <select
                    id="base-shape-select"
                    value={config.combined.baseShape}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        combined: { ...prev.combined, baseShape: e.target.value as BaseShape },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-control border border-line bg-alt"
                  >
                    <option value="rounded-rect">Rounded Rectangle</option>
                    <option value="stadium">Stadium Pill</option>
                    <option value="chamfered">Chamfered Architectural</option>
                    <option value="hexagonal">Octagonal / Hex Cut</option>
                  </select>
                </div>

                <SliderField
                  id="module-spacing"
                  label="Module Spacing"
                  value={config.combined.moduleSpacing}
                  min={2}
                  max={28}
                  step={1}
                  unit="mm"
                  onChange={(v) =>
                    onChange((prev) => ({
                      ...prev,
                      combined: { ...prev.combined, moduleSpacing: v },
                    }))
                  }
                />

                <div className="space-y-2 pt-1">
                  <ToggleField
                    id="include-tray-toggle"
                    label="Include Small-Item Tray (clips/erasers)"
                    checked={config.combined.includeTray}
                    onChange={(checked) =>
                      onChange((prev) => ({
                        ...prev,
                        combined: { ...prev.combined, includeTray: checked },
                      }))
                    }
                  />
                  {config.combined.includeTray && (
                    <div className="grid grid-cols-2 gap-2 pl-2">
                      <SliderField
                        id="tray-width"
                        label="Tray Width"
                        value={config.combined.trayWidth}
                        min={32}
                        max={80}
                        step={2}
                        unit="mm"
                        onChange={(v) =>
                          onChange((prev) => ({
                            ...prev,
                            combined: { ...prev.combined, trayWidth: v },
                          }))
                        }
                      />
                      <SliderField
                        id="tray-wall-height"
                        label="Tray Height"
                        value={config.combined.trayWallHeight}
                        min={8}
                        max={28}
                        step={1}
                        unit="mm"
                        onChange={(v) =>
                          onChange((prev) => ({
                            ...prev,
                            combined: { ...prev.combined, trayWallHeight: v },
                          }))
                        }
                      />
                    </div>
                  )}

                  <ToggleField
                    id="merge-solid-toggle"
                    label="Merge into Single Print-Ready Solid"
                    checked={config.combined.mergeSingleSolid}
                    onChange={(checked) =>
                      onChange((prev) => ({
                        ...prev,
                        combined: { ...prev.combined, mergeSingleSolid: checked },
                      }))
                    }
                  />
                </div>
              </section>
            )}

            {showPhoneControls && (
              <section className="space-y-3 pb-4 border-b border-line">
                <h3 className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
                  Phone Stand Geometry
                </h3>

                <div>
                  <label
                    htmlFor="phone-type-select"
                    className="block text-xs text-muted mb-1"
                  >
                    Stand Style
                  </label>
                  <select
                    id="phone-type-select"
                    value={config.phone.type}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, type: e.target.value as PhoneStandType },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-control border border-line bg-alt"
                  >
                    {PHONE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">Device Orientation</span>
                  <div className="inline-flex rounded-control p-0.5 bg-alt border border-line">
                    {(['portrait', 'landscape'] as const).map((orient) => (
                      <button
                        key={orient}
                        type="button"
                        onClick={() =>
                          onChange((prev) => ({
                            ...prev,
                            phone: { ...prev.phone, orientation: orient },
                          }))
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-control capitalize transition-colors ${
                          config.phone.orientation === orient
                            ? 'bg-accent text-on-accent font-semibold shadow-xs'
                            : 'text-muted'
                        }`}
                      >
                        {orient}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SliderField
                    id="phone-base-width"
                    label="Base Width"
                    value={config.phone.baseWidth}
                    min={50}
                    max={140}
                    step={2}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, baseWidth: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-base-depth"
                    label="Base Depth"
                    value={config.phone.baseDepth}
                    min={60}
                    max={140}
                    step={2}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, baseDepth: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-base-thick"
                    label="Base Thickness"
                    value={config.phone.baseThickness}
                    min={2.5}
                    max={14}
                    step={0.5}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, baseThickness: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-back-height"
                    label="Back Height"
                    value={config.phone.backHeight}
                    min={50}
                    max={140}
                    step={2}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, backHeight: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-resting-angle"
                    label="Resting Angle"
                    value={config.phone.restingAngle}
                    min={42}
                    max={82}
                    step={1}
                    unit="°"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, restingAngle: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-lip-height"
                    label="Front Lip Height"
                    value={config.phone.lipHeight}
                    min={4}
                    max={22}
                    step={1}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, lipHeight: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-thickness"
                    label="Phone + Case"
                    value={config.phone.phoneThickness}
                    min={6}
                    max={18}
                    step={0.5}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, phoneThickness: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-clearance"
                    label="Fit Clearance"
                    value={config.phone.caseClearance}
                    min={0.5}
                    max={4}
                    step={0.5}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, caseClearance: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-corner-radius"
                    label="Corner Radius"
                    value={config.phone.cornerRadius}
                    min={1}
                    max={18}
                    step={1}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, cornerRadius: v },
                      }))
                    }
                  />
                  <SliderField
                    id="phone-cable-slot"
                    label="Cable Slot"
                    value={config.phone.cableSlotWidth}
                    min={8}
                    max={30}
                    step={1}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, cableSlotWidth: v },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <ToggleField
                    id="cable-routing-toggle"
                    label="Cable Routing Tunnel"
                    checked={config.phone.cableRoutingHole}
                    onChange={(checked) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, cableRoutingHole: checked },
                      }))
                    }
                  />
                  <ToggleField
                    id="nonslip-recess-toggle"
                    label="Bottom Non-Slip Pad Recesses"
                    checked={config.phone.nonSlipRecesses}
                    onChange={(checked) =>
                      onChange((prev) => ({
                        ...prev,
                        phone: { ...prev.phone, nonSlipRecesses: checked },
                      }))
                    }
                  />
                  {config.category === 'phone-stand' && (
                    <ToggleField
                      id="side-pen-loop-toggle"
                      label="Attach Side Pen Loop"
                      checked={config.phone.sidePenLoop}
                      onChange={(checked) =>
                        onChange((prev) => ({
                          ...prev,
                          phone: { ...prev.phone, sidePenLoop: checked },
                        }))
                      }
                    />
                  )}
                </div>
              </section>
            )}

            {showPenControls && (
              <section className="space-y-3">
                <h3 className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
                  Pen Holder Geometry
                </h3>

                <div>
                  <label
                    htmlFor="pen-type-select"
                    className="block text-xs text-muted mb-1"
                  >
                    Holder Style
                  </label>
                  <select
                    id="pen-type-select"
                    value={config.pen.type}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        pen: { ...prev.pen, type: e.target.value as PenHolderType },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-control border border-line bg-alt"
                  >
                    {PEN_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SliderField
                    id="pen-cup-height"
                    label="Cup Height"
                    value={config.pen.cupHeight}
                    min={40}
                    max={140}
                    step={2}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        pen: { ...prev.pen, cupHeight: v },
                      }))
                    }
                  />
                  <SliderField
                    id="pen-outer-diameter"
                    label="Outer Width / Ø"
                    value={config.pen.exteriorDiameter}
                    min={40}
                    max={110}
                    step={2}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        pen: { ...prev.pen, exteriorDiameter: v },
                      }))
                    }
                  />
                  <SliderField
                    id="pen-wall-thick"
                    label="Wall Thickness"
                    value={config.pen.wallThickness}
                    min={1.4}
                    max={8}
                    step={0.2}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        pen: { ...prev.pen, wallThickness: v },
                      }))
                    }
                  />
                  <SliderField
                    id="pen-bottom-thick"
                    label="Bottom Floor"
                    value={config.pen.bottomThickness}
                    min={2}
                    max={12}
                    step={0.5}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        pen: { ...prev.pen, bottomThickness: v },
                      }))
                    }
                  />
                </div>

                {config.pen.type === 'multi-slot-rack' && (
                  <div className="p-3 rounded-control bg-alt border border-line space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <SliderField
                        id="pen-slot-count"
                        label="Pen Slots"
                        value={config.pen.slotCount}
                        min={1}
                        max={12}
                        step={1}
                        unit=""
                        onChange={(v) =>
                          onChange((prev) => ({
                            ...prev,
                            pen: { ...prev.pen, slotCount: v },
                          }))
                        }
                      />
                      <SliderField
                        id="pen-slot-diameter"
                        label="Slot Bore Ø"
                        value={config.pen.slotDiameter}
                        min={8}
                        max={20}
                        step={0.5}
                        unit="mm"
                        onChange={(v) =>
                          onChange((prev) => ({
                            ...prev,
                            pen: { ...prev.pen, slotDiameter: v },
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          htmlFor="hole-shape-select"
                          className="block text-[11px] text-muted mb-1"
                        >
                          Opening Shape
                        </label>
                        <select
                          id="hole-shape-select"
                          value={config.pen.holeShape}
                          onChange={(e) =>
                            onChange((prev) => ({
                              ...prev,
                              pen: { ...prev.pen, holeShape: e.target.value as HoleShape },
                            }))
                          }
                          className="w-full px-2 py-1 text-xs rounded border border-line bg-alt"
                        >
                          <option value="round">Round</option>
                          <option value="square">Square</option>
                          <option value="hexagonal">Hexagonal</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="hole-layout-select"
                          className="block text-[11px] text-muted mb-1"
                        >
                          Arrangement
                        </label>
                        <select
                          id="hole-layout-select"
                          value={config.pen.holeArrangement}
                          onChange={(e) =>
                            onChange((prev) => ({
                              ...prev,
                              pen: {
                                ...prev.pen,
                                holeArrangement: e.target.value as HoleArrangement,
                              },
                            }))
                          }
                          className="w-full px-2 py-1 text-xs rounded border border-line bg-alt"
                        >
                          <option value="grid">Grid</option>
                          <option value="circular">Circular</option>
                          <option value="staggered">Staggered</option>
                          <option value="linear">Linear</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {(config.pen.type === 'wave-ribbed' || config.pen.type === 'spiral-aesthetic') && (
                  <div className="grid grid-cols-2 gap-3">
                    <SliderField
                      id="pen-rib-count"
                      label="Flute Count"
                      value={config.pen.ribCount}
                      min={6}
                      max={32}
                      step={2}
                      unit=""
                      onChange={(v) =>
                        onChange((prev) => ({
                          ...prev,
                          pen: { ...prev.pen, ribCount: v },
                        }))
                      }
                    />
                    <SliderField
                      id="pen-rib-depth"
                      label="Flute Depth"
                      value={config.pen.ribDepth}
                      min={0.6}
                      max={3.5}
                      step={0.2}
                      unit="mm"
                      onChange={(v) =>
                        onChange((prev) => ({
                          ...prev,
                          pen: { ...prev.pen, ribDepth: v },
                        }))
                      }
                    />
                  </div>
                )}

                {config.category === 'pen-holder' && (
                  <div className="space-y-2 pt-1">
                    <SliderField
                      id="pen-cup-count"
                      label="Connected Cups"
                      value={config.pen.cupCount}
                      min={1}
                      max={3}
                      step={1}
                      unit=""
                      onChange={(v) =>
                        onChange((prev) => ({
                          ...prev,
                          pen: { ...prev.pen, cupCount: v },
                        }))
                      }
                    />
                    <ToggleField
                      id="pen-integrated-base"
                      label="Stepped Stability Collar Base"
                      checked={config.pen.integratedBase}
                      onChange={(checked) =>
                        onChange((prev) => ({
                          ...prev,
                          pen: { ...prev.pen, integratedBase: checked },
                        }))
                      }
                    />
                    <ToggleField
                      id="pen-shallow-tray"
                      label="Front Clips & Erasers Tray"
                      checked={config.pen.shallowTray}
                      onChange={(checked) =>
                        onChange((prev) => ({
                          ...prev,
                          pen: { ...prev.pen, shallowTray: checked },
                        }))
                      }
                    />
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {activeTab === 'personalize' && (
          <div className="space-y-4">
            <ToggleField
              id="personalization-enabled"
              label="Enable 3D Text, Motifs & Logos"
              checked={config.personalization.enabled}
              onChange={(checked) =>
                onChange((prev) => ({
                  ...prev,
                  personalization: { ...prev.personalization, enabled: checked },
                }))
              }
            />

            <div className={config.personalization.enabled ? 'space-y-4' : 'space-y-4 opacity-50 pointer-events-none'}>
              <div>
                <label
                  htmlFor="custom-text-input"
                  className="block text-xs font-medium text-muted mb-1"
                >
                  Custom Name / Monogram
                </label>
                <input
                  id="custom-text-input"
                  type="text"
                  maxLength={22}
                  placeholder="Enter name or initials..."
                  value={config.personalization.text}
                  onChange={(e) =>
                    onChange((prev) => ({
                      ...prev,
                      personalization: { ...prev.personalization, text: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-control border border-line bg-alt focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['STARK', 'A & M', 'VIP', 'MAKER', 'FOCUS'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          personalization: { ...prev.personalization, text: preset },
                        }))
                      }
                      className="px-2.5 py-1 text-[11px] font-medium rounded-control border border-line bg-alt text-muted hover:text-accent hover:border-accent transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Text Geometry</span>
                <div className="inline-flex rounded-control p-0.5 bg-alt border border-line">
                  {(['raised', 'engraved'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          personalization: { ...prev.personalization, mode: m },
                        }))
                      }
                      className={`px-2.5 py-1 text-xs font-medium rounded-control capitalize transition-colors ${
                        config.personalization.mode === m
                          ? 'bg-accent text-on-accent font-semibold shadow-xs'
                          : 'text-muted'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="font-style-select"
                    className="block text-xs text-muted mb-1"
                  >
                    Font Style
                  </label>
                  <select
                    id="font-style-select"
                    value={config.personalization.fontStyle}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        personalization: {
                          ...prev.personalization,
                          fontStyle: e.target.value as FontStyleId,
                        },
                      }))
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-control border border-line bg-alt"
                  >
                    {FONT_STYLES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="text-placement-select"
                    className="block text-xs text-muted mb-1"
                  >
                    Placement
                  </label>
                  <select
                    id="text-placement-select"
                    value={config.personalization.placement}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        personalization: {
                          ...prev.personalization,
                          placement: e.target.value as TextPlacement,
                        },
                      }))
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-control border border-line bg-alt"
                  >
                    <option value="front">Front Face</option>
                    <option value="base">Base Top</option>
                    <option value="left-side">Left Side</option>
                    <option value="right-side">Right Side</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SliderField
                  id="text-font-size"
                  label="Font Size"
                  value={config.personalization.fontSize}
                  min={5}
                  max={16}
                  step={0.5}
                  unit="mm"
                  onChange={(v) =>
                    onChange((prev) => ({
                      ...prev,
                      personalization: { ...prev.personalization, fontSize: v },
                    }))
                  }
                />
                <SliderField
                  id="text-depth"
                  label="Relief / Cut Depth"
                  value={config.personalization.depth}
                  min={0.6}
                  max={3.5}
                  step={0.2}
                  unit="mm"
                  onChange={(v) =>
                    onChange((prev) => ({
                      ...prev,
                      personalization: { ...prev.personalization, depth: v },
                    }))
                  }
                />
                <SliderField
                  id="text-letter-spacing"
                  label="Letter Spacing"
                  value={config.personalization.letterSpacing}
                  min={0.6}
                  max={2.4}
                  step={0.1}
                  unit="×"
                  onChange={(v) =>
                    onChange((prev) => ({
                      ...prev,
                      personalization: { ...prev.personalization, letterSpacing: v },
                    }))
                  }
                />
                <div>
                  <label
                    htmlFor="text-align-select"
                    className="block text-xs text-muted mb-1"
                  >
                    Alignment
                  </label>
                  <select
                    id="text-align-select"
                    value={config.personalization.alignment}
                    onChange={(e) =>
                      onChange((prev) => ({
                        ...prev,
                        personalization: {
                          ...prev.personalization,
                          alignment: e.target.value as TextAlignment,
                        },
                      }))
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-control border border-line bg-alt"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              <ToggleField
                id="text-curved-toggle"
                label="Curved Cylinder Wrap (for round cups)"
                checked={config.personalization.curved}
                onChange={(checked) =>
                  onChange((prev) => ({
                    ...prev,
                    personalization: { ...prev.personalization, curved: checked },
                  }))
                }
              />

              {/* Decorative Motif */}
              <div className="pt-3 border-t border-line space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="motif-select"
                      className="block text-xs font-medium text-muted mb-1"
                    >
                      Decorative Motif
                    </label>
                    <select
                      id="motif-select"
                      value={config.personalization.motif}
                      onChange={(e) =>
                        onChange((prev) => ({
                          ...prev,
                          personalization: {
                            ...prev.personalization,
                            motif: e.target.value as DecorativeMotif,
                          },
                        }))
                      }
                      className="w-full px-2 py-1.5 text-xs rounded-control border border-line bg-alt"
                    >
                      {MOTIFS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SliderField
                    id="motif-size"
                    label="Motif Size"
                    value={config.personalization.motifSize}
                    min={6}
                    max={22}
                    step={1}
                    unit="mm"
                    onChange={(v) =>
                      onChange((prev) => ({
                        ...prev,
                        personalization: { ...prev.personalization, motifSize: v },
                      }))
                    }
                  />
                </div>
              </div>

              {/* SVG Logo Upload */}
              <div className="pt-3 border-t border-line space-y-2">
                <label
                  htmlFor="svg-logo-upload"
                  className="block text-xs font-medium text-ink"
                >
                  Upload Custom SVG Logo
                </label>
                <input
                  id="svg-logo-upload"
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleSvgUpload}
                  className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-control file:border file:border-line file:text-xs file:font-medium file:bg-alt file:text-ink hover:file:bg-soft hover:file:border-accent cursor-pointer"
                />
                {config.personalization.svgLogoName && (
                  <div className="flex items-center justify-between text-xs bg-alt px-2.5 py-1.5 rounded border border-line">
                    <span className="truncate">{config.personalization.svgLogoName}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          personalization: {
                            ...prev.personalization,
                            svgLogoData: null,
                            svgLogoName: null,
                          },
                        }))
                      }
                      className="text-rose-600 hover:underline ml-2 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {svgError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
                    {svgError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="material-finish-select"
                className="block text-xs font-medium text-muted mb-1"
              >
                Surface Finish Preview
              </label>
              <select
                id="material-finish-select"
                value={config.appearance.finish}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    appearance: {
                      ...prev.appearance,
                      finish: e.target.value as MaterialFinish,
                    },
                  }))
                }
                className="w-full px-2.5 py-2 text-xs rounded-control border border-line bg-alt"
              >
                {FINISHES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Zone Selector */}
            <div>
              <span className="block text-xs font-medium text-muted mb-1.5">
                Select Part Zone to Color
              </span>
              <div className="grid grid-cols-5 gap-1">
                {(
                  [
                    { id: 'base', label: 'Base' },
                    { id: 'back', label: 'Back' },
                    { id: 'cup', label: 'Cup' },
                    { id: 'text', label: 'Text' },
                    { id: 'accent', label: 'Lip' },
                  ] as const
                ).map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setActiveZone(z.id)}
                    className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-control border text-[11px] font-medium transition-colors ${
                      activeZone === z.id
                        ? 'border-accent bg-accent/15 text-accent font-semibold shadow-xs'
                        : 'border-line text-muted'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/15"
                      style={{ backgroundColor: config.appearance.colors[z.id] }}
                    />
                    <span>{z.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker + Hex Input */}
            <div className="flex items-center gap-2">
              <label htmlFor="zone-color-picker" className="sr-only">
                Zone color picker
              </label>
              <input
                id="zone-color-picker"
                type="color"
                value={config.appearance.colors[activeZone]}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    appearance: {
                      ...prev.appearance,
                      colors: {
                        ...prev.appearance.colors,
                        [activeZone]: e.target.value,
                      },
                    },
                  }))
                }
                className="w-10 h-9 rounded border border-line cursor-pointer bg-transparent"
              />
              <div className="flex-1">
                <label htmlFor="zone-hex-input" className="sr-only">
                  Hex color code
                </label>
                <input
                  id="zone-hex-input"
                  type="text"
                  value={config.appearance.colors[activeZone]}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                      onChange((prev) => ({
                        ...prev,
                        appearance: {
                          ...prev.appearance,
                          colors: {
                            ...prev.appearance.colors,
                            [activeZone]: val,
                          },
                        },
                      }));
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-mono uppercase rounded-control border border-line bg-alt"
                />
              </div>
            </div>

            {/* Curated Filament Swatches */}
            <div className="space-y-2.5">
              {(['Neutrals', 'Metallics', 'Pastels', 'Neons'] as const).map((group) => (
                <div key={group}>
                  <span className="block text-[11px] font-medium text-muted mb-1">
                    {group}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MATERIAL_SWATCHES.filter((s) => s.group === group).map((swatch) => (
                      <button
                        key={swatch.name}
                        type="button"
                        title={swatch.name}
                        aria-label={`Apply ${swatch.name} to ${activeZone}`}
                        onClick={() =>
                          onChange((prev) => ({
                            ...prev,
                            appearance: {
                              ...prev.appearance,
                              colors: {
                                ...prev.appearance.colors,
                                [activeZone]: swatch.hex,
                              },
                            },
                          }))
                        }
                        className="flex items-center gap-1.5 p-1 rounded border border-line hover:border-accent text-left"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/15"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span className="text-[10px] truncate text-ink">
                          {swatch.name.split(' ')[1] || swatch.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-control bg-alt border border-line text-xs text-muted leading-relaxed">
              <strong className="text-ink">STL Color Note:</strong>{' '}
              Standard binary STL files store geometry triangles only and do not embed color or shader data. For multi-color printing, disable &ldquo;Merge into Single Solid&rdquo; and export the Multi-Part ZIP to assign filaments per part in your slicer.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
}

const SliderField: React.FC<SliderFieldProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <label htmlFor={id} className="text-muted truncate pr-1">
        {label}
      </label>
      <span className="font-mono font-medium text-ink shrink-0">
        {Number.isInteger(step) ? value : value.toFixed(1)}
        {unit}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 rounded-control cursor-pointer accent-accent"
    />
  </div>
);

interface ToggleFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleField: React.FC<ToggleFieldProps> = ({ id, label, checked, onChange }) => (
  <label
    htmlFor={id}
    className="flex items-center justify-between gap-2 text-xs text-ink cursor-pointer py-0.5"
  >
    <span>{label}</span>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-line text-accent focus:ring-accent accent-accent"
    />
  </label>
);
