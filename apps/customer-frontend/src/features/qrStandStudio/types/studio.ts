export type TemplateId =
  | 'classic_upright'
  | 'angled_desk'
  | 'rounded_rect'
  | 'arch_shaped'
  | 'circular_display'
  | 'square_block'
  | 'double_sided'
  | 'triple_display'
  | 'restaurant_tent'
  | 'social_media'
  | 'business_plaque'
  | 'mini_keychain';

export type QRType =
  | 'url'
  | 'upi'
  | 'google_review'
  | 'instagram'
  | 'whatsapp'
  | 'facebook'
  | 'youtube'
  | 'wifi'
  | 'vcard'
  | 'menu'
  | 'email'
  | 'phone'
  | 'text';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type PrintingMode = 'raised' | 'recessed' | 'inlay';

export type MaterialType = 'pla' | 'petg' | 'matte' | 'metallic' | 'silk';

export type FontCategory =
  | 'Modern'
  | 'Bold'
  | 'Minimal'
  | 'Elegant'
  | 'Rounded'
  | 'Handwriting'
  | 'Retro'
  | 'Premium'
  | 'Playful';

export type TextPresetRole =
  | 'business_name'
  | 'payment_instruction'
  | 'social_username'
  | 'restaurant_name'
  | 'wifi_label'
  | 'custom_message'
  | 'thank_you';

export type DecorationKind =
  | 'heart'
  | 'star'
  | 'floral_frame'
  | 'geometric_border'
  | 'wave'
  | 'business_icon'
  | 'cafe_icon'
  | 'social_icon'
  | 'payment_icon'
  | 'ribbon'
  | 'corner_ornament';

export type CameraPreset = 'iso' | 'front' | 'back' | 'side' | 'top';

export type ViewportBackground = 'studio_light' | 'dark_slate' | 'workbench' | 'warm_concrete';

export type StudioMode = 'quick' | 'advanced';

export type QRFace = 'front' | 'back' | 'left' | 'right';

export interface QRFields {
  url: string;
  upiVpa: string;
  upiName: string;
  upiAmount: string;
  upiCurrency: string;
  upiNote: string;
  googlePlaceId: string;
  instagramHandle: string;
  whatsappPhone: string;
  whatsappMessage: string;
  facebookPage: string;
  youtubeHandle: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiSecurity: 'WPA' | 'WEP' | 'nopass';
  wifiHidden: boolean;
  vcardName: string;
  vcardCompany: string;
  vcardTitle: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardWebsite: string;
  menuUrl: string;
  emailAddress: string;
  emailSubject: string;
  emailBody: string;
  phoneNumber: string;
  customText: string;
}

export interface QRCodeConfig {
  id: string;
  label: string;
  type: QRType;
  fields: QRFields;
  sizeMm: number;
  errorCorrection: ErrorCorrectionLevel;
  quietZone: number;
  fgColor: string;
  bgColor: string;
  positionX: number;
  positionY: number;
  face: QRFace;
  visible: boolean;
}

export interface StandDimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
  baseThicknessMm: number;
  plateThicknessMm: number;
  cornerRadiusMm: number;
  inclinationDeg: number;
  baseWidthMm: number;
  baseDepthMm: number;
  borderThicknessMm: number;
  frameDepthMm: number;
  roundedEdges: boolean;
  frontAndRearLayout: boolean;
  wallMountHoles: boolean;
  qrReliefDepthMm: number;
  inlayClearanceMm: number;
}

export interface TextElement {
  id: string;
  content: string;
  presetRole: TextPresetRole;
  category: FontCategory;
  fontSizeMm: number;
  letterSpacing: number;
  align: 'left' | 'center' | 'right';
  xMm: number;
  yMm: number;
  rotationDeg: number;
  color: string;
  mode: 'raised' | 'engraved';
  depthMm: number;
  face: 'front' | 'back';
  visible: boolean;
}

export interface LogoConfig {
  enabled: boolean;
  dataUrl: string | null;
  fileName: string | null;
  isSvg: boolean;
  svgText: string | null;
  placement: 'center' | 'above' | 'below' | 'custom';
  sizeMm: number;
  xMm: number;
  yMm: number;
  frameStyle: 'none' | 'circle' | 'rounded' | 'badge';
  frameColor: string;
  backingColor: string;
  mode: 'raised' | 'engraved' | 'preview';
  depthMm: number;
}

export interface DecorationElement {
  id: string;
  kind: DecorationKind;
  xMm: number;
  yMm: number;
  sizeMm: number;
  rotationDeg: number;
  color: string;
  depthMm: number;
  visible: boolean;
}

export interface ColorPaletteConfig {
  presetId: string;
  standColor: string;
  baseColor: string;
  frameColor: string;
  qrColor: string;
  textColor: string;
  accentColor: string;
  materialType: MaterialType;
  rainbowPreview: boolean;
}

export interface ComponentVisibility {
  base: boolean;
  body: boolean;
  frame: boolean;
  qr: boolean;
  text: boolean;
  logo: boolean;
  decorations: boolean;
}

export interface StandDesign {
  id: string;
  name: string;
  templateId: TemplateId;
  presetId?: string;
  dimensions: StandDimensions;
  printingMode: PrintingMode;
  qrCodes: QRCodeConfig[];
  texts: TextElement[];
  logo: LogoConfig;
  decorations: DecorationElement[];
  colors: ColorPaletteConfig;
  visibility: ComponentVisibility;
  updatedAt: number;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: 'Desk' | 'Retail' | 'Hospitality' | 'Compact';
  description: string;
  defaultDimensions: StandDimensions;
  supportsRearQR: boolean;
  supportsTripleQR: boolean;
  hasBase: boolean;
  defaultQrSizeMm: number;
  defaultQrPosY: number;
  defaultTextPosY: number;
  defaultSubTextPosY: number;
}

export interface ColorPreset {
  id: string;
  name: string;
  standColor: string;
  baseColor: string;
  frameColor: string;
  qrColor: string;
  textColor: string;
  accentColor: string;
  materialType: MaterialType;
  rainbowPreview?: boolean;
}

export interface CustomPalette {
  id: string;
  name: string;
  standColor: string;
  baseColor: string;
  frameColor: string;
  qrColor: string;
  textColor: string;
  accentColor: string;
}

export interface ReadyPreset {
  id: string;
  name: string;
  subtitle: string;
  templateId: TemplateId;
  qrType: QRType;
  fieldsPatch: Partial<QRFields>;
  headline: string;
  subline: string;
  colorPresetId: string;
  decorations?: Omit<DecorationElement, 'id'>[];
}
