import type { CostEstimate, FilamentType, PrintSettings } from '../types/design';

export interface FilamentProfile {
  name: FilamentType;
  densityGCm3: number;
  nozzleTempC: string;
  bedTempC: string;
  coolingPercent: string;
  notes: string;
}

export const FILAMENT_PROFILES: Record<FilamentType, FilamentProfile> = {
  PLA: {
    name: 'PLA',
    densityGCm3: 1.24,
    nozzleTempC: '205–215 °C',
    bedTempC: '60 °C',
    coolingPercent: '100%',
    notes: 'Best dimensional accuracy, crisp overhangs, minimal warping.',
  },
  PETG: {
    name: 'PETG',
    densityGCm3: 1.27,
    nozzleTempC: '235–245 °C',
    bedTempC: '75–80 °C',
    coolingPercent: '30–50%',
    notes: 'Higher impact toughness and heat resistance for desk sun exposure.',
  },
  ABS: {
    name: 'ABS',
    densityGCm3: 1.04,
    nozzleTempC: '245–260 °C',
    bedTempC: '100–110 °C',
    coolingPercent: '0–20%',
    notes: 'Lightweight and heat-resistant; requires enclosed printer chamber.',
  },
};

/**
 * Estimates filament mass, length, cost, suggested retail price, and approximate print time
 * from real solid mesh volume (cm³), infill, layer height, and filament profile.
 * Note: Print time is an analytical estimate, not a G-code slicer result.
 */
export function calculatePrintEstimate(
  solidVolumeCm3: number,
  print: PrintSettings
): CostEstimate {
  const safeVolume = Math.max(0.5, solidVolumeCm3);
  const profile = FILAMENT_PROFILES[print.filament];

  // Shell accounts for ~32% of solid volume; interior scales by infill percentage.
  // Add 6% waste/skirt/purge allowance.
  const shellFraction = 0.34;
  const infillFraction = Math.min(1, Math.max(0.05, print.infillPercent / 100));
  const fillMultiplier = shellFraction + (1 - shellFraction) * infillFraction;
  const wasteMultiplier = 1.06;

  const effectiveVolumeCm3 = safeVolume * fillMultiplier * wasteMultiplier;
  const weightGrams = effectiveVolumeCm3 * profile.densityGCm3;

  // Standard 1.75 mm filament cross-section area = pi * (0.875 mm)^2 = 2.40528 mm^2 = 0.0240528 cm^2
  // 1 meter = 100 cm -> 2.40528 cm^3 per meter
  const filamentMeters = effectiveVolumeCm3 / 2.40528;

  const costPerGram = Math.max(0, print.filamentCostPerKg) / 1000;
  const materialCostUsd = weightGrams * costPerGram;
  const markupFactor = 1 + Math.max(0, print.markupPercent) / 100;
  const suggestedPriceUsd = materialCostUsd * markupFactor;

  // Approximate volumetric flow model (cm³/hr) calibrated to typical 0.4mm nozzle FDM speeds
  const layerSpeedFactor =
    print.layerHeight === 0.12
      ? 0.58
      : print.layerHeight === 0.16
        ? 0.78
        : print.layerHeight === 0.2
          ? 1.0
          : 1.32;

  const materialSpeedFactor = print.filament === 'PLA' ? 1.0 : print.filament === 'PETG' ? 0.85 : 0.82;
  const baseCm3PerHour = 13.5 * layerSpeedFactor * materialSpeedFactor;

  // Add 6 min startup/bed-leveling overhead
  const estimatedMinutes = Math.max(12, Math.round((effectiveVolumeCm3 / baseCm3PerHour) * 60 + 6));

  return {
    solidVolumeCm3: Number(safeVolume.toFixed(2)),
    effectiveVolumeCm3: Number(effectiveVolumeCm3.toFixed(2)),
    weightGrams: Number(weightGrams.toFixed(1)),
    filamentMeters: Number(filamentMeters.toFixed(2)),
    materialCostUsd: Number(materialCostUsd.toFixed(2)),
    suggestedPriceUsd: Number(suggestedPriceUsd.toFixed(2)),
    estimatedMinutes,
    formattedPrintTime: formatMinutes(estimatedMinutes),
  };
}

export function formatMinutes(totalMinutes: number): string {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}

export function generatePrintSettingsReadme(
  designName: string,
  estimate: CostEstimate,
  print: PrintSettings,
  dimensions: { width: number; depth: number; height: number }
): string {
  const profile = FILAMENT_PROFILES[print.filament];
  return [
    `STARK PRINT STUDIO - RECOMMENDED PRINT SETTINGS`,
    `==============================================`,
    `Model Name: ${designName}`,
    `Bounding Dimensions (W x D x H): ${dimensions.width.toFixed(1)} x ${dimensions.depth.toFixed(1)} x ${dimensions.height.toFixed(1)} mm`,
    ``,
    `FILAMENT & THERMAL PROFILE`,
    `--------------------------`,
    `Material: ${profile.name}`,
    `Nozzle Temp: ${profile.nozzleTempC}`,
    `Bed Temp: ${profile.bedTempC}`,
    `Part Cooling: ${profile.coolingPercent}`,
    `Notes: ${profile.notes}`,
    ``,
    `SLICER PARAMETERS`,
    `-----------------`,
    `Layer Height: ${print.layerHeight} mm`,
    `Wall Loops: 3-4 perimeters (min ${print.minWallThickness.toFixed(1)} mm wall thickness)`,
    `Infill Density: ${print.infillPercent}% (Gyroid or Grid recommended)`,
    `Supports: Usually none required for angles >= 55 deg; enable tree supports if < 50 deg`,
    `Bed Adhesion: Skirt (use Brim if narrow contact warning is present)`,
    ``,
    `ANALYTICAL ESTIMATE (NOT A SLICER RESULT)`,
    `-----------------------------------------`,
    `Solid Volume: ${estimate.solidVolumeCm3} cm^3`,
    `Estimated Filament Weight: ${estimate.weightGrams} g (~${estimate.filamentMeters} m of 1.75 mm)`,
    `Estimated Print Time: ~${estimate.formattedPrintTime} (approximate)`,
  ].join('\n');
}
