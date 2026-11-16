import React, { useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileArchive,
  FileJson,
  Upload,
  XCircle,
} from 'lucide-react';
import type {
  BuildBedPreset,
  CostEstimate,
  DesignConfig,
  FilamentType,
  ValidationReport,
} from '../types/design';
import type { GeneratedAssembly } from '../geometry/standBuilder';
import { FILAMENT_PROFILES } from '../core/estimation';
import { buildSafeFilename } from '../geometry/stlExporter';

interface StudioRightPanelProps {
  config: DesignConfig;
  assembly: GeneratedAssembly;
  validation: ValidationReport;
  estimate: CostEstimate;
  isExportingZip: boolean;
  onChangePrint: (updater: (prev: DesignConfig['print']) => DesignConfig['print']) => void;
  onDownloadSingleStl: () => void;
  onDownloadMultiPartZip: () => void;
  onDownloadSinglePartStl: (partId: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export const StudioRightPanel: React.FC<StudioRightPanelProps> = ({
  config,
  assembly,
  validation,
  estimate,
  isExportingZip,
  onChangePrint,
  onDownloadSingleStl,
  onDownloadMultiPartZip,
  onDownloadSinglePartStl,
  onExportJson,
  onImportJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { dimensions, bedLimit, fitsBed, issues, validForExport } = validation;
  const activeProfile = FILAMENT_PROFILES[config.print.filament];

  return (
    <aside
      aria-label="Dimensions, print checks, and STL export"
      className="flex flex-col h-full bg-white dark:bg-[#161B22] border-l border-slate-200 dark:border-slate-800 overflow-y-auto studio-scroll p-4 space-y-5"
    >
      {/* 1. Model Dimensions & Mesh Telemetry */}
      <section className="space-y-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Model Dimensions
          </h3>
          <span
            className={`text-[11px] font-medium inline-flex items-center gap-1 ${
              fitsBed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {fitsBed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {fitsBed ? 'Fits Print Bed' : 'Exceeds Bed'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Width (X)</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
              {dimensions.width.toFixed(1)} <span className="text-[10px] font-normal">mm</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Depth (Y)</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
              {dimensions.depth.toFixed(1)} <span className="text-[10px] font-normal">mm</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Height (Z)</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
              {dimensions.height.toFixed(1)} <span className="text-[10px] font-normal">mm</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Volume: {estimate.solidVolumeCm3.toFixed(1)} cm³</span>
          <span>Triangles: {assembly.triangleCount.toLocaleString()}</span>
        </div>
      </section>

      {/* 2. 3D Printing Safety & Bed Checks */}
      <section className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Printability & Fit Checks
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Bed {bedLimit.x}×{bedLimit.y}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="bed-preset-select"
              className="block text-[11px] text-slate-500 mb-1"
            >
              Build Plate Preset
            </label>
            <select
              id="bed-preset-select"
              value={config.print.bedPreset}
              onChange={(e) =>
                onChangePrint((p) => ({ ...p, bedPreset: e.target.value as BuildBedPreset }))
              }
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
            >
              <option value="180x180">180×180 (Mini)</option>
              <option value="220x220">220×220 (Std)</option>
              <option value="256x256">256×256 (CoreXY)</option>
              <option value="custom">Custom Bed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="min-wall-input"
              className="block text-[11px] text-slate-500 mb-1"
            >
              Min Wall Rule (mm)
            </label>
            <input
              id="min-wall-input"
              type="number"
              min={1.2}
              max={6}
              step={0.2}
              value={config.print.minWallThickness}
              onChange={(e) =>
                onChangePrint((p) => ({
                  ...p,
                  minWallThickness: Math.max(1.2, parseFloat(e.target.value) || 2.4),
                }))
              }
              className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
            />
          </div>
        </div>

        {config.print.bedPreset === 'custom' && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="custom-bed-x" className="block text-[10px] text-slate-500">
                Bed X (mm)
              </label>
              <input
                id="custom-bed-x"
                type="number"
                min={60}
                max={600}
                value={config.print.customBedX}
                onChange={(e) =>
                  onChangePrint((p) => ({ ...p, customBedX: Number(e.target.value) || 220 }))
                }
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
              />
            </div>
            <div>
              <label htmlFor="custom-bed-y" className="block text-[10px] text-slate-500">
                Bed Y (mm)
              </label>
              <input
                id="custom-bed-y"
                type="number"
                min={60}
                max={600}
                value={config.print.customBedY}
                onChange={(e) =>
                  onChangePrint((p) => ({ ...p, customBedY: Number(e.target.value) || 220 }))
                }
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
              />
            </div>
            <div>
              <label htmlFor="custom-bed-z" className="block text-[10px] text-slate-500">
                Bed Z (mm)
              </label>
              <input
                id="custom-bed-z"
                type="number"
                min={60}
                max={600}
                value={config.print.customBedZ}
                onChange={(e) =>
                  onChangePrint((p) => ({ ...p, customBedZ: Number(e.target.value) || 220 }))
                }
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
              />
            </div>
          </div>
        )}

        {issues.length === 0 ? (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">All Print Checks Passed</div>
              <p className="text-[11px] opacity-90">
                Manifold solid rests flat on bed with safe wall thickness and clearances.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <div
                key={issue.id}
                role={issue.severity === 'error' ? 'alert' : undefined}
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  issue.severity === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {issue.severity === 'error' ? (
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{issue.title}</span>
                </div>
                <p className="text-[11px] leading-snug opacity-90">{issue.detail}</p>
                <p className="text-[11px] font-medium">Fix: {issue.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Material Profile & Price Estimator */}
      <section className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Filament & Price Estimator
        </h3>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0D1117]">
          {(['PLA', 'PETG', 'ABS'] as FilamentType[]).map((mat) => (
            <button
              key={mat}
              type="button"
              onClick={() => onChangePrint((p) => ({ ...p, filament: mat }))}
              className={`py-1 text-xs font-semibold rounded-md transition-colors ${
                config.print.filament === mat
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {mat}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Nozzle {activeProfile.nozzleTempC} · Bed {activeProfile.bedTempC} · {activeProfile.notes}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="layer-height-select" className="block text-[11px] text-slate-500 mb-1">
              Layer Height
            </label>
            <select
              id="layer-height-select"
              value={config.print.layerHeight}
              onChange={(e) =>
                onChangePrint((p) => ({
                  ...p,
                  layerHeight: parseFloat(e.target.value) as 0.12 | 0.16 | 0.2 | 0.28,
                }))
              }
              className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
            >
              <option value={0.12}>0.12 mm Fine</option>
              <option value={0.16}>0.16 mm Quality</option>
              <option value={0.2}>0.20 mm Std</option>
              <option value={0.28}>0.28 mm Draft</option>
            </select>
          </div>

          <div>
            <label htmlFor="infill-input" className="block text-[11px] text-slate-500 mb-1">
              Infill ({config.print.infillPercent}%)
            </label>
            <input
              id="infill-input"
              type="range"
              min={10}
              max={100}
              step={5}
              value={config.print.infillPercent}
              onChange={(e) =>
                onChangePrint((p) => ({ ...p, infillPercent: parseInt(e.target.value, 10) }))
              }
              className="w-full mt-2"
            />
          </div>

          <div>
            <label htmlFor="filament-cost-input" className="block text-[11px] text-slate-500 mb-1">
              Spool Cost ($/kg)
            </label>
            <input
              id="filament-cost-input"
              type="number"
              min={5}
              max={200}
              step={1}
              value={config.print.filamentCostPerKg}
              onChange={(e) =>
                onChangePrint((p) => ({
                  ...p,
                  filamentCostPerKg: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
              className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
            />
          </div>

          <div>
            <label htmlFor="markup-percent-input" className="block text-[11px] text-slate-500 mb-1">
              Markup (%)
            </label>
            <input
              id="markup-percent-input"
              type="number"
              min={0}
              max={1000}
              step={10}
              value={config.print.markupPercent}
              onChange={(e) =>
                onChangePrint((p) => ({
                  ...p,
                  markupPercent: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
              className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Filament Mass</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
              {estimate.weightGrams} g
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              ~{estimate.filamentMeters} m
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Est. Print Time</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
              ~{estimate.formattedPrintTime}
            </div>
            <div className="text-[10px] text-slate-500">Estimate, not slicer</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0D1117] border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Material Cost</div>
            <div className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
              ${estimate.materialCostUsd.toFixed(2)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900">
            <div className="text-[11px] text-blue-700 dark:text-blue-300">Suggested Price</div>
            <div className="text-sm font-mono font-semibold text-blue-900 dark:text-blue-100">
              ${estimate.suggestedPriceUsd.toFixed(2)}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Export Center */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Export Center
        </h3>

        <div className="text-[11px] font-mono text-slate-500 truncate" title={buildSafeFilename(config)}>
          File: {buildSafeFilename(config)}.stl
        </div>

        <button
          type="button"
          disabled={!validForExport}
          onClick={onDownloadSingleStl}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Download className="w-4 h-4" />
          <span>Download Binary STL</span>
        </button>

        <button
          type="button"
          disabled={!validForExport || isExportingZip}
          onClick={onDownloadMultiPartZip}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <FileArchive className="w-4 h-4" />
          <span>
            {isExportingZip
              ? 'Bundling Multi-Part ZIP...'
              : `Multi-Part Aligned ZIP (${assembly.parts.length} STLs + Guide)`}
          </span>
        </button>

        {!validForExport && (
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Resolve critical printability errors above before exporting STL files.
          </p>
        )}

        {assembly.parts.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <span className="block text-[11px] font-medium text-slate-500">
              Individual Aligned Part STLs
            </span>
            <div className="space-y-1">
              {assembly.parts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  disabled={!validForExport}
                  onClick={() => onDownloadSinglePartStl(part.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 disabled:opacity-50"
                >
                  <span className="truncate">{part.name}</span>
                  <Download className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onExportJson}
            className="py-1.5 px-2.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center justify-center gap-1.5"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Save JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-1.5 px-2.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportJson(f);
              e.target.value = '';
            }}
          />
        </div>
      </section>
    </aside>
  );
};
