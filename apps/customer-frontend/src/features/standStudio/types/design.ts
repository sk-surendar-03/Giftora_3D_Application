export type StudioCategory =
  | 'phone-stand'
  | 'pen-holder'
  | 'combined'
  | 'desk-organizer'
  | 'personalized-gift';

export type PhoneStandType =
  | 'minimalist-angled'
  | 'cradle'
  | 'vertical-dock'
  | 'horizontal-landscape'
  | 'foldable-inspired'
  | 'curved-sculptural'
  | 'gaming-themed'
  | 'geometric'
  | 'nameplate'
  | 'cable-groove';

export type PenHolderType =
  | 'round-cup'
  | 'square-cup'
  | 'hexagonal-cup'
  | 'honeycomb-holder'
  | 'wave-ribbed'
  | 'geometric-polygon'
  | 'spiral-aesthetic'
  | 'multi-slot-rack'
  | 'angled-pen-holder'
  | 'modular-storage'
  | 'personalized-name-cup'
  | 'open-top-organizer';

export type CombinedType =
  | 'phone-left-pen-right'
  | 'pen-left-phone-right'
  | 'center-phone-dual-pens'
  | 'phone-cradle-rear-pen'
  | 'pen-holder-phone-rest'
  | 'desk-organizer-tray'
  | 'compact-corner'
  | 'executive-personalized';

export type DeskOrganizerType =
  | 'workstation-dock'
  | 'modular-caddy'
  | 'corner-command'
  | 'minimal-tray-stand';

export type GiftStandType =
  | 'monogram-plinth'
  | 'heart-keepsake-stand'
  | 'executive-award-stand'
  | 'celebration-pen-stand';

export type AnyModelType =
  | PhoneStandType
  | PenHolderType
  | CombinedType
  | DeskOrganizerType
  | GiftStandType;

export type DesignThemeId =
  | 'minimalist'
  | 'luxury-executive'
  | 'gaming-rgb'
  | 'modern-geometric'
  | 'cute-pastel'
  | 'industrial'
  | 'nature-inspired'
  | 'futuristic'
  | 'corporate-gift'
  | 'kids-student';

export type FontStyleId =
  | 'modern-sans'
  | 'serif'
  | 'bold'
  | 'handwritten'
  | 'cursive'
  | 'futuristic'
  | 'playful'
  | 'rounded';

export type TextAlignment = 'left' | 'center' | 'right';
export type TextPlacement = 'front' | 'left-side' | 'right-side' | 'base';

export type DecorativeMotif =
  | 'none'
  | 'star'
  | 'heart'
  | 'flower'
  | 'leaf'
  | 'gear'
  | 'hexagon'
  | 'diamond';

export type MaterialFinish =
  | 'matte'
  | 'satin'
  | 'metallic-gold'
  | 'metallic-silver'
  | 'metallic-copper'
  | 'two-tone'
  | 'gradient'
  | 'wood-grain'
  | 'marble';

export type BaseShape = 'rounded-rect' | 'stadium' | 'chamfered' | 'hexagonal';
export type HoleShape = 'round' | 'square' | 'hexagonal';
export type HoleArrangement = 'grid' | 'circular' | 'staggered' | 'linear';
export type PatternStyle = 'none' | 'ribs' | 'hex-cutout' | 'chamfer-facets';

export type FilamentType = 'PLA' | 'PETG' | 'ABS';
export type BuildBedPreset = '180x180' | '220x220' | '256x256' | 'custom';

export interface PhoneStandParams {
  type: PhoneStandType;
  baseWidth: number;
  baseDepth: number;
  baseThickness: number;
  backHeight: number;
  backWidth: number;
  restingAngle: number; // degrees from horizontal (45 - 82)
  phoneThickness: number;
  caseClearance: number; // 1 - 2.5mm
  lipHeight: number;
  lipWidth: number;
  orientation: 'portrait' | 'landscape';
  cornerRadius: number;
  cableSlotWidth: number;
  cableRoutingHole: boolean;
  nonSlipRecesses: boolean;
  decorativePattern: PatternStyle;
  sidePenLoop: boolean;
}

export interface PenHolderParams {
  type: PenHolderType;
  cupHeight: number;
  exteriorDiameter: number;
  wallThickness: number;
  bottomThickness: number;
  slotCount: number; // 1 to 12
  slotDiameter: number; // 9 to 17mm
  slotSpacing: number;
  holeShape: HoleShape;
  holeArrangement: HoleArrangement;
  shallowTray: boolean;
  ribCount: number;
  ribDepth: number;
  integratedBase: boolean;
  cupCount: number; // 1 to 3 connected cups
  secondaryCupHeight: number;
  secondaryCupDiameter: number;
}

export interface CombinedParams {
  type: CombinedType;
  moduleSpacing: number;
  baseShape: BaseShape;
  symmetrical: boolean;
  includeTray: boolean;
  trayWidth: number;
  trayDepth: number;
  trayWallHeight: number;
  mergeSingleSolid: boolean;
  phoneOffsetX: number;
  penOffsetX: number;
}

export interface PersonalizationParams {
  enabled: boolean;
  text: string;
  fontStyle: FontStyleId;
  fontSize: number;
  alignment: TextAlignment;
  letterSpacing: number;
  depth: number;
  mode: 'raised' | 'engraved';
  curved: boolean;
  placement: TextPlacement;
  motif: DecorativeMotif;
  motifSize: number;
  svgLogoData: string | null;
  svgLogoName: string | null;
  svgLogoScale: number;
  svgLogoMode: 'raised' | 'engraved';
}

export interface MaterialZoneColors {
  base: string;
  back: string;
  cup: string;
  text: string;
  accent: string;
}

export interface AppearanceParams {
  themeId: DesignThemeId;
  finish: MaterialFinish;
  colors: MaterialZoneColors;
}

export interface PrintSettings {
  filament: FilamentType;
  layerHeight: 0.12 | 0.16 | 0.2 | 0.28;
  infillPercent: number;
  minWallThickness: number; // configurable default 2.4mm
  bedPreset: BuildBedPreset;
  customBedX: number;
  customBedY: number;
  customBedZ: number;
  filamentCostPerKg: number;
  markupPercent: number;
}

export interface DesignConfig {
  id: string;
  name: string;
  category: StudioCategory;
  phone: PhoneStandParams;
  pen: PenHolderParams;
  combined: CombinedParams;
  personalization: PersonalizationParams;
  appearance: AppearanceParams;
  print: PrintSettings;
  updatedAt: string;
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  detail: string;
  suggestion: string;
}

export interface BoundingDimensions {
  width: number; // X mm
  depth: number; // Z mm
  height: number; // Y mm
}

export interface ValidationReport {
  validForExport: boolean;
  issues: ValidationIssue[];
  dimensions: BoundingDimensions;
  bedLimit: { x: number; y: number; z: number };
  fitsBed: boolean;
}

export interface CostEstimate {
  solidVolumeCm3: number;
  effectiveVolumeCm3: number;
  weightGrams: number;
  filamentMeters: number;
  materialCostUsd: number;
  suggestedPriceUsd: number;
  estimatedMinutes: number;
  formattedPrintTime: string;
}

export interface TemplatePreset {
  id: string;
  name: string;
  category: StudioCategory;
  themeId: DesignThemeId;
  tagline: string;
  config: Omit<
    Partial<DesignConfig>,
    'phone' | 'pen' | 'combined' | 'personalization' | 'appearance'
  > & {
    category: StudioCategory;
    phone?: Partial<PhoneStandParams>;
    pen?: Partial<PenHolderParams>;
    combined?: Partial<CombinedParams>;
    personalization?: Partial<PersonalizationParams>;
    appearance?: Partial<AppearanceParams>;
  };
}

export interface SavedDesignRecord {
  id: string;
  name: string;
  category: StudioCategory;
  favorite: boolean;
  updatedAt: string;
  config: DesignConfig;
}

export interface ProjectFileV1 {
  schemaVersion: 1;
  exportedAt: string;
  app: 'stark-print-studio';
  design: DesignConfig;
}

export interface ViewportOptions {
  cameraPreset: 'iso' | 'front' | 'side' | 'top';
  projection: 'perspective' | 'orthographic';
  showGrid: boolean;
  showBuildPlate: boolean;
  showDimensions: boolean;
  showPhoneMockup: boolean;
  showPensMockup: boolean;
  explodedAmount: number; // 0 to 1
}
