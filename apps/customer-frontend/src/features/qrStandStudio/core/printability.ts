import type {
  MaterialType,
  PrintingMode,
  StandDesign,
  StandDimensions,
  TemplateId,
} from '../types/studio';
import { buildQRPayload, generateQRMatrix } from './qrGenerator';

export interface PrintabilityWarning {
  severity: 'error' | 'warning' | 'info';
  title: string;
  detail: string;
}

export interface PrintSettingsSuggestion {
  nozzleDiameterMm: number;
  layerHeightMm: number;
  infillPercent: number;
  wallLineCount: number;
  supportsRequired: boolean;
  supportReason: string;
  adhesionType: string;
  printOrientation: string;
}

export interface PrintabilityReport {
  overallWidthMm: number;
  overallHeightMm: number;
  overallDepthMm: number;
  estimatedVolumeCm3: number;
  estimatedFilamentGrams: number;
  estimatedPrintTimeMinutes: number;
  minWallThicknessMm: number;
  qrModuleSizeMm: number;
  overhangRisk: 'none' | 'moderate' | 'high';
  warnings: PrintabilityWarning[];
  assemblyInstructions: string[];
  suggestedSettings: PrintSettingsSuggestion;
}

export interface DimensionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDimensions(
  dims: StandDimensions,
  templateId: TemplateId
): DimensionValidationResult {
  const isKeychain = templateId === 'mini_keychain';
  const errors: string[] = [];
  const warnings: string[] = [];

  const minW = isKeychain ? 32 : 55;
  const maxW = isKeychain ? 75 : 220;
  if (dims.widthMm < minW || dims.widthMm > maxW) {
    errors.push(`Width (${dims.widthMm} mm) must be between ${minW} mm and ${maxW} mm.`);
  }

  const minH = isKeychain ? 40 : 65;
  const maxH = isKeychain ? 95 : 280;
  if (dims.heightMm < minH || dims.heightMm > maxH) {
    errors.push(`Height (${dims.heightMm} mm) must be between ${minH} mm and ${maxH} mm.`);
  }

  if (dims.plateThicknessMm < 2.2) {
    errors.push(`Plate thickness (${dims.plateThicknessMm} mm) must be at least 2.2 mm for structural rigidity.`);
  } else if (dims.plateThicknessMm > 16) {
    warnings.push(`Plate thickness (${dims.plateThicknessMm} mm) is unusually heavy and increases print time.`);
  }

  if (dims.qrReliefDepthMm >= dims.plateThicknessMm - 0.8) {
    errors.push(
      `QR relief depth (${dims.qrReliefDepthMm} mm) leaves less than 0.8 mm backing floor. Increase plate thickness or reduce relief.`
    );
  }

  if (!isKeychain && dims.inclinationDeg > 45) {
    warnings.push(`Tilt inclination of ${dims.inclinationDeg}° requires supports or risks cantilever sagging.`);
  }

  // Bed dimensions check (Standard 220x220mm bed)
  const maxBedX = 220;
  const maxBedY = 220;
  if (dims.widthMm > maxBedX || dims.heightMm > maxBedY) {
    warnings.push(`Stand dimensions (${dims.widthMm} x ${dims.heightMm} mm) approach or exceed standard 220x220 mm build plate limits.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function clampDimensions(
  dims: StandDimensions,
  templateId: TemplateId
): StandDimensions {
  const isKeychain = templateId === 'mini_keychain';
  const widthMm = clamp(dims.widthMm, isKeychain ? 32 : 55, isKeychain ? 75 : 220);
  const heightMm = clamp(dims.heightMm, isKeychain ? 40 : 65, isKeychain ? 95 : 280);
  const depthMm = clamp(dims.depthMm, 3, 90);
  const plateThicknessMm = clamp(dims.plateThicknessMm, 2.2, 16);
  const baseThicknessMm = isKeychain ? 0 : clamp(dims.baseThicknessMm, 2.5, 22);
  const baseWidthMm = isKeychain
    ? widthMm
    : clamp(dims.baseWidthMm, Math.max(45, widthMm * 0.75), Math.min(260, widthMm + 60));
  const baseDepthMm = isKeychain ? depthMm : clamp(dims.baseDepthMm, 24, 110);
  const maxCorner = Math.floor(Math.min(widthMm, heightMm) * 0.45);
  const cornerRadiusMm = clamp(dims.cornerRadiusMm, 0, maxCorner);
  const inclinationDeg =
    templateId === 'double_sided' || templateId === 'triple_display' || isKeychain
      ? 0
      : clamp(dims.inclinationDeg, 0, 40);
  const borderThicknessMm = clamp(dims.borderThicknessMm, 0, 12);
  const frameDepthMm = clamp(dims.frameDepthMm, 0, 8);
  const qrReliefDepthMm = clamp(dims.qrReliefDepthMm, 0.6, Math.max(0.8, plateThicknessMm - 1.2));
  const inlayClearanceMm = clamp(dims.inlayClearanceMm, 0.05, 0.35);

  return {
    ...dims,
    widthMm,
    heightMm,
    depthMm,
    baseThicknessMm,
    plateThicknessMm,
    baseWidthMm,
    baseDepthMm,
    cornerRadiusMm,
    inclinationDeg,
    borderThicknessMm,
    frameDepthMm,
    qrReliefDepthMm,
    inlayClearanceMm,
  };
}

function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, Number(val.toFixed(2))));
}

export function materialDensityGcm3(material: MaterialType): number {
  switch (material) {
    case 'petg':
      return 1.27;
    case 'matte':
    case 'silk':
    case 'metallic':
    case 'pla':
    default:
      return 1.24;
  }
}

export function evaluatePrintability(design: StandDesign): PrintabilityReport {
  const dims = design.dimensions;
  const primaryQr = design.qrCodes[0];
  const warnings: PrintabilityWarning[] = [];

  // Check dimension validity first
  const dimValidation = validateDimensions(dims, design.templateId);
  for (const err of dimValidation.errors) {
    warnings.push({
      severity: 'error',
      title: 'Dimension Out of Bounds',
      detail: err,
    });
  }
  for (const warn of dimValidation.warnings) {
    warnings.push({
      severity: 'warning',
      title: 'Dimension Advisory',
      detail: warn,
    });
  }

  // Module size calculation
  let qrModuleSizeMm = 1.5;
  if (primaryQr) {
    try {
      const payload = buildQRPayload(primaryQr.type, primaryQr.fields);
      const matrix = generateQRMatrix(payload, primaryQr.errorCorrection);
      qrModuleSizeMm = Number(
        (primaryQr.sizeMm / (matrix.size + primaryQr.quietZone * 2)).toFixed(3)
      );
    } catch {
      qrModuleSizeMm = 0.6;
    }

    const maxQrFit = Math.min(dims.widthMm, dims.heightMm) - dims.borderThicknessMm * 2 - 8;
    if (primaryQr.sizeMm > maxQrFit) {
      warnings.push({
        severity: 'error',
        title: 'QR code exceeds stand face bounds',
        detail: `QR size (${primaryQr.sizeMm} mm) is wider than the available inner plate (${Math.max(0, maxQrFit).toFixed(1)} mm). Reduce QR size or widen the stand.`,
      });
    }

    if (primaryQr.quietZone < 2) {
      warnings.push({
        severity: 'warning',
        title: 'Insufficient quiet zone',
        detail: `Quiet zone (${primaryQr.quietZone} modules) is too small. ISO standard requires at least 4 modules.`,
      });
    }
  }

  if (qrModuleSizeMm < 0.75) {
    warnings.push({
      severity: 'error',
      title: 'Sub-nozzle QR modules detected',
      detail: `Each QR module is ${qrModuleSizeMm.toFixed(2)} mm wide, which is smaller than the 0.8 mm minimum required for a standard 0.4 mm nozzle. Increase QR size or reduce payload.`,
    });
  } else if (qrModuleSizeMm < 1.0) {
    warnings.push({
      severity: 'info',
      title: 'Fine QR modules detected',
      detail: `Each QR module is ${qrModuleSizeMm.toFixed(2)} mm wide. Print outer walls slowly (25-35 mm/s) for crisp edges.`,
    });
  }

  // Min wall thickness check
  const remainingBacking =
    design.printingMode === 'recessed' || design.printingMode === 'inlay'
      ? dims.plateThicknessMm - dims.qrReliefDepthMm
      : dims.plateThicknessMm;

  const minWallThicknessMm = Number(
    Math.min(
      remainingBacking,
      dims.plateThicknessMm,
      design.templateId === 'mini_keychain' ? dims.plateThicknessMm : dims.baseThicknessMm
    ).toFixed(2)
  );

  if (remainingBacking < 1.2) {
    warnings.push({
      severity: 'warning',
      title: 'Thin QR backing floor',
      detail: `Backing behind recessed QR is ${remainingBacking.toFixed(2)} mm. Keep at least 1.2 mm (6 layers at 0.2 mm) to prevent light bleed or bed heat warping.`,
    });
  }

  // Overhang check
  let overhangRisk: 'none' | 'moderate' | 'high' = 'none';
  if (dims.inclinationDeg > 35) {
    overhangRisk = 'high';
    warnings.push({
      severity: 'warning',
      title: 'Steep cantilever angle',
      detail: `Tilt angle is ${dims.inclinationDeg}°. Rear surface may show stair-stepping or require brim/supports if oriented vertically.`,
    });
  } else if (dims.inclinationDeg > 20) {
    overhangRisk = 'moderate';
  }

  // Volume & Filament Weight Estimation
  const plateVol = (dims.widthMm * dims.heightMm * dims.plateThicknessMm) / 1000;
  const isKeychain = design.templateId === 'mini_keychain';
  const baseVol = isKeychain ? 0 : (dims.baseWidthMm * dims.baseDepthMm * dims.baseThicknessMm) / 1000;
  const qrVol = primaryQr ? (primaryQr.sizeMm * primaryQr.sizeMm * dims.qrReliefDepthMm * 0.45) / 1000 : 0;
  const estimatedVolumeCm3 = Number((plateVol * 0.45 + baseVol * 0.35 + qrVol).toFixed(1));

  const density = materialDensityGcm3(design.colors.materialType);
  const estimatedFilamentGrams = Number((estimatedVolumeCm3 * density).toFixed(1));
  const estimatedPrintTimeMinutes = Math.round(estimatedFilamentGrams * 2.2 + 15);

  const assemblyInstructions: string[] = [];
  if (design.printingMode === 'raised') {
    assemblyInstructions.push('Single piece print: Use manual filament swap (M600) at QR layer height for high-contrast dual colors.');
  } else if (design.printingMode === 'recessed') {
    assemblyInstructions.push('Print body face-up. Accent QR module pockets can be filled with liquid acrylic enamel or printed with contrast layers.');
  } else if (design.printingMode === 'inlay') {
    assemblyInstructions.push('Dual-Color Inlay: Print the Stand Body and QR Inlay tiles as separate parts. Press inlay modules into pockets using 0.15 mm clearance.');
  }

  const suggestedSettings: PrintSettingsSuggestion = {
    nozzleDiameterMm: qrModuleSizeMm < 0.9 ? 0.25 : 0.4,
    layerHeightMm: 0.2,
    infillPercent: 15,
    wallLineCount: 3,
    supportsRequired: dims.inclinationDeg > 35 && design.templateId !== 'restaurant_tent',
    supportReason: dims.inclinationDeg > 35 ? 'Inclined rear surface overhang exceeds 35°.' : 'None required.',
    adhesionType: isKeychain ? 'Skirt' : 'Brim (5mm) recommended for upright stability',
    printOrientation: isKeychain ? 'Flat on build plate (Z-up)' : 'Base seated flat on build plate',
  };

  return {
    overallWidthMm: dims.baseWidthMm,
    overallHeightMm: dims.heightMm + (isKeychain ? 0 : dims.baseThicknessMm),
    overallDepthMm: Math.max(dims.depthMm, dims.baseDepthMm),
    estimatedVolumeCm3,
    estimatedFilamentGrams,
    estimatedPrintTimeMinutes,
    minWallThicknessMm,
    qrModuleSizeMm,
    overhangRisk,
    warnings,
    assemblyInstructions,
    suggestedSettings,
  };
}
