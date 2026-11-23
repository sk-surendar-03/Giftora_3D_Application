export type LampShapeType =
  | 'cylinder'
  | 'rectangle'
  | 'prism_4'
  | 'four_sided'
  | 'heart'
  | 'curved'
  | 'moon'
  | 'lantern_6'
  | 'hexagonal'
  | 'medallion'
  | 'circular'
  | 'carousel_3'
  | 'rotating';

export interface ImageAdjustmentSettings {
  brightness: number; // -100 to 100, default 0
  contrast: number;   // -100 to 100, default 15
  gamma: number;      // 0.5 to 2.5, default 1.0
  sharpness: number;  // 0 to 100, default 20
  grayscale: boolean; // default true
  invertTones: boolean; // default false (darker = thicker)
  denoise: boolean;   // default false
  rotation: number;   // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  cropAspect: 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16';
  zoom: number;       // 1.0 to 3.0
  panX: number;       // -100 to 100
  panY: number;       // -100 to 100
}

export interface PhotoSlot {
  id: string;
  label: string;
  dataUrl: string;
  originalName: string;
  width: number;
  height: number;
  aspectRatio: number;
  adjustments: ImageAdjustmentSettings;
  processedCanvas?: HTMLCanvasElement;
  thumbnailUrl?: string;
  isLowRes?: boolean;
  // Backend storage reference once uploaded
  photoKey?: string;
  sha256?: string;
  isUploaded?: boolean;
}

export interface PrintSettings {
  modelHeightMm: number;        // e.g. 120 mm
  modelWidthMm: number;         // e.g. 90 mm (or width for box/panel)
  modelDiameterMm: number;      // e.g. 90 mm (for cylinder/moon/lantern)
  minThicknessMm: number;       // e.g. 0.8 mm (brightest pixel)
  maxThicknessMm: number;       // e.g. 3.2 mm (darkest pixel)
  borderWidthMm: number;        // e.g. 3.0 mm border around flat/curved panel
  frameThicknessMm: number;     // e.g. 4.0 mm
  curveAngleDeg: number;        // e.g. 110 deg for curved portrait
  samplingResolution: 'low' | 'medium' | 'high' | 'ultra'; // Low: 120px, Med: 200px, High: 300px, Ultra: 450px
  seamPosition: 'back' | 'side' | 'auto';
  smoothingRadius: number;      // 0 to 3 pixels
}

export type BaseShapeType = 'circular' | 'square' | 'hexagonal';

export interface LampBaseSettings {
  enabled: boolean;
  type: 'printed' | 'wooden' | 'none';
  shape: BaseShapeType;
  diameterMm: number;           // or width for square/hex
  heightMm: number;             // e.g. 24 mm
  cavityDiameterMm: number;     // e.g. 45 mm for 5V LED disc
  cavityDepthMm: number;        // e.g. 16 mm
  cableSlotWidthMm: number;     // e.g. 5.0 mm for USB cable
  slotToleranceMm: number;      // 0.3 to 0.6 mm fit clearance
  engravedText: string;
  engraveDepthMm: number;       // e.g. 0.8 mm
  separateLid: boolean;
  surfacePattern: 'smooth' | 'fluted' | 'knurled' | 'faceted';
}

export type PersonalizationTheme =
  | 'romantic'
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'family'
  | 'baby'
  | 'pet'
  | 'memorial'
  | 'mothers_day'
  | 'fathers_day'
  | 'diwali'
  | 'christmas'
  | 'minimal';

export interface PersonalizationSettings {
  theme: PersonalizationTheme;
  titleText: string;
  subtitleText: string;
  dateText: string;
  fontFamily: 'serif' | 'sans' | 'script' | 'mono';
  textStyle: 'engraved' | 'embossed';
  placement: 'base' | 'frame_bottom' | 'back_plaque' | 'none';
  decorativeIcon: 'heart' | 'star' | 'rings' | 'flower' | 'sparkle' | 'none';
}

export interface LedLightingSettings {
  isOn: boolean;
  puckType: 'warm_white' | 'cool_white' | 'rgb_remote' | 'none';
  colorPreset: 'warm' | 'cool' | 'neutral' | 'amber' | 'sunset' | 'custom';
  customColor: string; // hex #ffaa55
  brightness: number;  // 0 to 100
  rgbCycle: boolean;
  ambientDarkness: number; // 0 to 100 (0 = bright room, 100 = dark night room)
  backdrop: 'nightstand' | 'modern_studio' | 'wood_desk' | 'maker_bench';
}

export interface CostCalculatorSettings {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  filamentPricePerKg: number;    // ₹1,400 / kg
  filamentType: 'PLA_White' | 'PETG_White' | 'PLA_Wood' | 'Resin';
  infillPercentage: number;       // 100% for lithophanes
  printSpeedMmS: number;          // 50 mm/s
  layerHeightMm: number;          // 0.12 mm
  machineHourlyRate: number;      // ₹40 / hr
  electricityCostKwh: number;     // ₹9 / kWh
  machineWattage: number;         // 120W
  labourMinutes: number;          // 25 mins
  labourHourlyRate: number;       // ₹200 / hr
  ledKitCost: number;             // ₹180
  packagingCost: number;          // ₹80
  profitMarginPercent: number;    // 40%
}

export interface LithophaneProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  shape: LampShapeType;
  photos: PhotoSlot[];
  activePhotoIndex: number;
  printSettings: PrintSettings;
  baseSettings: LampBaseSettings;
  personalization: PersonalizationSettings;
  lighting: LedLightingSettings;
  costSettings: CostCalculatorSettings;
  packaging: {
    premiumGiftBox: boolean;
  };
}

export interface MeshValidationReport {
  triangleCount: number;
  vertexCount: number;
  dimensionsMm: { x: number; y: number; z: number };
  estimatedVolumeMm3: number;
  estimatedVolumeCm3: number;
  estimatedWeightGrams: number;
  estimatedPrintTimeHours: number;
  isWatertight: boolean;
  warnings: string[];
}
