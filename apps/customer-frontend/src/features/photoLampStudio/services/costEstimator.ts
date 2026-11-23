import { CostCalculatorSettings, MeshValidationReport } from '../types/lithophane';

export interface CostBreakdownResult {
  materialCost: number;
  electricityCost: number;
  machineDepreciationCost: number;
  labourCost: number;
  hardwareCost: number;
  packagingCost: number;
  totalProductionCost: number;
  suggestedSellingPrice: number;
  estimatedNetProfit: number;
  marginPercent: number;
  currencySymbol: string;
  formatted: {
    material: string;
    electricity: string;
    machine: string;
    labour: string;
    hardware: string;
    packaging: string;
    totalCost: string;
    sellingPrice: string;
    profit: string;
  };
}

export const CURRENCY_SYMBOLS: Record<CostCalculatorSettings['currency'], string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const DEFAULT_COST_SETTINGS: CostCalculatorSettings = {
  currency: 'INR',
  filamentPricePerKg: 1400, // ₹1,400 per kg standard quality white PLA
  filamentType: 'PLA_White',
  infillPercentage: 100,
  printSpeedMmS: 45,
  layerHeightMm: 0.16,
  machineHourlyRate: 35, // ₹35 / hr wear & tear
  electricityCostKwh: 9, // ₹9 / kWh
  machineWattage: 120, // 120W typical bed + hotend
  labourMinutes: 20, // post-processing & assembly
  labourHourlyRate: 180, // ₹180 / hr
  ledKitCost: 160, // 5V USB LED module
  packagingCost: 75, // Gift box + protective bubble
  profitMarginPercent: 45, // 45% markup
};

export function calculateCostBreakdown(
  report: MeshValidationReport,
  settings: CostCalculatorSettings
): CostBreakdownResult {
  // If base is also printed, add ~35g
  const totalWeightGrams = Math.max(25, report.estimatedWeightGrams + 30);
  const printHours = Math.max(1, report.estimatedPrintTimeHours + 2.0);

  // 1. Material cost
  const materialCost = (totalWeightGrams / 1000) * settings.filamentPricePerKg;

  // 2. Electricity cost
  const kwhUsed = (settings.machineWattage / 1000) * printHours;
  const electricityCost = kwhUsed * settings.electricityCostKwh;

  // 3. Machine hourly depreciation
  const machineDepreciationCost = printHours * settings.machineHourlyRate;

  // 4. Labour cost
  const labourCost = (settings.labourMinutes / 60) * settings.labourHourlyRate;

  // 5. Hardware & Packaging
  const hardwareCost = settings.ledKitCost;
  const packagingCost = settings.packagingCost;

  // Total production cost
  const totalProductionCost =
    materialCost +
    electricityCost +
    machineDepreciationCost +
    labourCost +
    hardwareCost +
    packagingCost;

  // Suggested selling price with target margin
  const marginFrac = Math.min(0.9, Math.max(0.1, settings.profitMarginPercent / 100));
  const suggestedSellingPrice = totalProductionCost / (1 - marginFrac);
  const estimatedNetProfit = suggestedSellingPrice - totalProductionCost;

  const symbol = CURRENCY_SYMBOLS[settings.currency] || '₹';

  const fmt = (val: number) => {
    return `${symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return {
    materialCost,
    electricityCost,
    machineDepreciationCost,
    labourCost,
    hardwareCost,
    packagingCost,
    totalProductionCost,
    suggestedSellingPrice,
    estimatedNetProfit,
    marginPercent: settings.profitMarginPercent,
    currencySymbol: symbol,
    formatted: {
      material: fmt(materialCost),
      electricity: fmt(electricityCost),
      machine: fmt(machineDepreciationCost),
      labour: fmt(labourCost),
      hardware: fmt(hardwareCost),
      packaging: fmt(packagingCost),
      totalCost: fmt(totalProductionCost),
      sellingPrice: fmt(suggestedSellingPrice),
      profit: fmt(estimatedNetProfit),
    },
  };
}
