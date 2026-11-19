export type PageId =
  | 'home'
  | 'studio'
  | 'templates'
  | 'my-designs'
  | 'print-settings'
  | 'help';

export type NameplateTypeId =
  | 'desk'
  | 'door'
  | 'wall'
  | 'kids'
  | 'business'
  | 'led'
  | 'decorative-3d'
  | 'wedding'
  | 'house-number'
  | 'gaming';

export type NameplateShape =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'oval'
  | 'circle'
  | 'hexagon'
  | 'octagon'
  | 'diamond'
  | 'shield'
  | 'crest'
  | 'cloud'
  | 'heart'
  | 'arch'
  | 'scalloped'
  | 'ribbon-banner'
  | 'ticket-notch'
  | 'chamfer-plate'
  | 'house-roof'
  | 'butterfly'
  | 'star-burst'
  | 'text-outline';

export type MountingStyle =
  | 'flat-wall'
  | 'freestanding-desk'
  | 'text-only-3d'
  | 'layered-background';

export type LetteringMode = 'raised' | 'engraved' | 'cut-out';

export type MaterialFinish =
  | 'matte-pla'
  | 'silk-pla'
  | 'metallic-pla'
  | 'wood-pla'
  | 'marble-pla'
  | 'transparent'
  | 'dual-color';

export type DecorationType =
  | 'none'
  | 'stars'
  | 'crown'
  | 'floral-corner'
  | 'gaming-brackets'
  | 'temple-arch'
  | 'heart-emblem'
  | 'paw-print'
  | 'moon-stars'
  | 'laurel-wreath'
  | 'lightning-bolts'
  | 'butterfly-accent'
  | 'lotus-mandala'
  | 'diamond-gems'
  | 'music-notes'
  | 'wings-emblem'
  | 'sword-crest'
  | 'corner-rivets';

export type ThemeCategory =
  | 'Minimalist'
  | 'Luxury'
  | 'Royal'
  | 'Floral'
  | 'Cartoon'
  | 'Superhero'
  | 'Gaming'
  | 'Corporate'
  | 'Nature'
  | 'Birthday'
  | 'Wedding'
  | 'Traditional Indian'
  | 'Kids & Nursery';

export type FontCategory =
  | 'all'
  | 'modern'
  | 'script'
  | 'bold'
  | 'elegant'
  | 'playful'
  | 'classic'
  | 'futuristic'
  | 'stencil'
  | 'retro'
  | 'tamil';

export type TextAlignment = 'left' | 'center' | 'right';
export type TextCaseTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface TextLine {
  id: string;
  text: string;
  fontId: string;
  fontSize: number; // mm cap height
  letterSpacing: number; // mm extra tracking
  align: TextAlignment;
  bold: boolean;
  italic: boolean;
  textTransform?: TextCaseTransform;
  color: string;
  yOffset: number; // mm vertical adjustment
}

export interface NameplateDesign {
  id: string;
  name: string;
  type: NameplateTypeId;
  shape: NameplateShape;
  mountingStyle: MountingStyle;
  letteringMode: LetteringMode;
  materialFinish: MaterialFinish;
  decoration: DecorationType;
  theme: ThemeCategory;

  // Dimensions in mm
  widthMm: number;
  heightMm: number;
  baseThicknessMm: number;
  cornerRadiusMm: number;
  textExtrusionMm: number;
  engravingDepthMm: number;
  borderEnabled: boolean;
  borderThicknessMm: number;
  borderWidthMm: number;
  borderHeightMm: number;
  textClearanceMm: number;
  layerChangeHeightMm: number;

  // Mounting engineering
  mountingHolesEnabled: boolean;
  mountingHoleDiameterMm: number;
  mountingHoleInsetMm: number;
  keyholeSlotEnabled: boolean;
  deskStandAngleDeg: number;
  deskStandSupportRibs: boolean;

  // Colors & visual preview
  baseColor: string;
  secondaryBaseColor: string;
  borderColor: string;
  ledAccentColor: string;
  ledGlowEnabled: boolean;
  gradientPreviewEnabled: boolean;

  // Text lines
  lines: TextLine[];
}

export interface PrintProfile {
  printerName: string;
  bedWidthMm: number;
  bedDepthMm: number;
  maxHeightMm: number;
  nozzleDiameterMm: number;
  layerHeightMm: number;
  wallLoops: number;
  infillPercent: number;
  printSpeedMmS: number;
  supportsEnabled: boolean;
}

export interface PricingConfig {
  filamentCostPerKgInr: number;
  machineRatePerHourInr: number;
  laborAndFinishingInr: number;
  profitMarginPercent: number;
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  code: string;
  severity: ValidationSeverity;
  title: string;
  description: string;
  suggestion: string;
  autoFixLabel?: string;
}

export interface SavedDesign {
  id: string;
  name: string;
  updatedAt: string;
  thumbnailDataUrl?: string;
  design: NameplateDesign;
}

export interface NameplateTemplate {
  id: string;
  title: string;
  subtitle: string;
  theme: ThemeCategory;
  type: NameplateTypeId;
  accentHex: string;
  previewBgHex: string;
  design: Omit<NameplateDesign, 'id'>;
}

export type CameraViewPreset = 'isometric' | 'front' | 'top' | 'side';
export type CameraProjection = 'perspective' | 'orthographic';
export type RenderQuality = 'standard' | 'high';
