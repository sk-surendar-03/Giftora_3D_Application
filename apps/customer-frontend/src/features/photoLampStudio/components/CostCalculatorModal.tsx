import React from 'react';
import {
  CostCalculatorSettings,
  MeshValidationReport,
} from '../types/lithophane';
import {
  Calculator,
  Coins,
  Cpu,
  Zap,
  Clock,
  Package,
  Lightbulb,
  TrendingUp,
  X,
  Info,
} from 'lucide-react';
import {
  calculateCostBreakdown,
  CURRENCY_SYMBOLS,
} from '../services/costEstimator';

interface CostCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MeshValidationReport;
  settings: CostCalculatorSettings;
  onChangeSettings: (updated: Partial<CostCalculatorSettings>) => void;
}

export const CostCalculatorModal: React.FC<CostCalculatorModalProps> = ({
  isOpen,
  onClose,
  report,
  settings,
  onChangeSettings,
}) => {
  if (!isOpen) return null;

  const breakdown = calculateCostBreakdown(report, settings);
  const symbol = CURRENCY_SYMBOLS[settings.currency] || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Maker 3D Print Cost & Margin Estimator
              </h3>
              <p className="text-xs text-stone-400">
                Transparent production cost calculation for makers, gift shops, and 3D printing services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency selector */}
            <select
              value={settings.currency}
              onChange={(e) =>
                onChangeSettings({ currency: e.target.value as any })
              }
              className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-xl px-2.5 py-1.5 font-mono cursor-pointer"
            >
              <option value="INR">₹ INR (Default)</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Left Inputs, Right Output Cards */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto">
          {/* Left Inputs */}
          <div className="md:col-span-6 space-y-3.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              1. Production & Hardware Inputs
            </h4>

            {/* Filament Price */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">Filament Price per Kg</span>
                <span className="font-mono text-white">
                  {symbol}
                  {settings.filamentPricePerKg}
                </span>
              </div>
              <input
                type="number"
                value={settings.filamentPricePerKg}
                onChange={(e) =>
                  onChangeSettings({ filamentPricePerKg: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* LED Kit Cost */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">5V USB LED Module / Disc</span>
                <span className="font-mono text-white">
                  {symbol}
                  {settings.ledKitCost}
                </span>
              </div>
              <input
                type="number"
                value={settings.ledKitCost}
                onChange={(e) =>
                  onChangeSettings({ ledKitCost: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Packaging & Gift Box */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">Packaging & Gift Box</span>
                <span className="font-mono text-white">
                  {symbol}
                  {settings.packagingCost}
                </span>
              </div>
              <input
                type="number"
                value={settings.packagingCost}
                onChange={(e) =>
                  onChangeSettings({ packagingCost: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Electricity Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">Electricity Cost per kWh</span>
                <span className="font-mono text-white">
                  {symbol}
                  {settings.electricityCostKwh}
                </span>
              </div>
              <input
                type="number"
                value={settings.electricityCostKwh}
                onChange={(e) =>
                  onChangeSettings({ electricityCostKwh: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Labour Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-stone-300 mb-1 block">Labour (Mins)</label>
                <input
                  type="number"
                  value={settings.labourMinutes}
                  onChange={(e) =>
                    onChangeSettings({ labourMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-300 mb-1 block">Labour {symbol}/hr</label>
                <input
                  type="number"
                  value={settings.labourHourlyRate}
                  onChange={(e) =>
                    onChangeSettings({ labourHourlyRate: Number(e.target.value) })
                  }
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Target Profit Margin */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">Desired Profit Margin</span>
                <span className="font-mono text-amber-400 font-bold">
                  {settings.profitMarginPercent}%
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={75}
                value={settings.profitMarginPercent}
                onChange={(e) =>
                  onChangeSettings({ profitMarginPercent: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Right Breakdown Summary */}
          <div className="md:col-span-6 space-y-3.5">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              2. Cost & Profit Breakdown
            </h4>

            <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-900">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> PLA Filament Material
                </span>
                <span className="font-mono font-medium text-white">
                  {breakdown.formatted.material}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-900">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Electricity Consumption
                </span>
                <span className="font-mono font-medium text-white">
                  {breakdown.formatted.electricity}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-900">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> 3D Printer Wear & Runtime
                </span>
                <span className="font-mono font-medium text-white">
                  {breakdown.formatted.machine}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-900">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Assembly & Post-Processing
                </span>
                <span className="font-mono font-medium text-white">
                  {breakdown.formatted.labour}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-900">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> 5V LED Module Hardware
                </span>
                <span className="font-mono font-medium text-white">
                  {breakdown.formatted.hardware}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-stone-900">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-400" /> Premium Gift Box & Packaging
                </span>
                <span className="font-mono font-medium text-white">
                  {breakdown.formatted.packaging}
                </span>
              </div>

              {/* Total Cost */}
              <div className="flex justify-between pt-2 border-t border-stone-700/80 font-bold text-sm">
                <span className="text-stone-300">Total Production Cost:</span>
                <span className="font-mono text-amber-300">
                  {breakdown.formatted.totalCost}
                </span>
              </div>
            </div>

            {/* Suggested Selling Price Card */}
            <div className="bg-gradient-to-br from-amber-500/15 via-amber-600/10 to-stone-950 border border-amber-500/30 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                  Suggested Retail Price
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                  {settings.profitMarginPercent}% Margin
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white mb-2">
                {breakdown.formatted.sellingPrice}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-500/20 text-stone-300">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" /> Estimated Net Profit:
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  +{breakdown.formatted.profit}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-stone-500">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-stone-400" />
              <span>
                Calculations are derived from estimated shell volume ({report.estimatedVolumeMm3.toLocaleString()} mm³), standard 100% infill PLA density, and your entered material rates.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
