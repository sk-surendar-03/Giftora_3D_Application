import React from 'react';
import {
  Box,
  Grid,
  Layers,
  Maximize2,
  PenTool,
  Ruler,
  Smartphone,
} from 'lucide-react';
import type { ViewportOptions } from '../types/design';

interface ViewportControlsBarProps {
  viewport: ViewportOptions;
  hasPhone: boolean;
  hasPens: boolean;
  hasMultipleParts: boolean;
  onChange: (updater: (prev: ViewportOptions) => ViewportOptions) => void;
  onFitCamera: () => void;
}

export const ViewportControlsBar: React.FC<ViewportControlsBarProps> = ({
  viewport,
  hasPhone,
  hasPens,
  hasMultipleParts,
  onChange,
  onFitCamera,
}) => {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 max-w-[95%] flex flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible items-center sm:justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/95 dark:bg-[#161B22]/95 border border-slate-200 dark:border-slate-700 shadow-lg">
      {/* Camera Presets */}
      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#0D1117] p-0.5 rounded-lg">
        {(['iso', 'front', 'side', 'top'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              onChange((v) => ({ ...v, cameraPreset: preset }));
              onFitCamera();
            }}
            className={`px-2 py-1 text-[11px] font-semibold uppercase rounded-md transition-colors whitespace-nowrap ${
              viewport.cameraPreset === preset
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      <button
        type="button"
        title="Fit model to viewport"
        aria-label="Fit model to viewport"
        onClick={onFitCamera}
        className="px-2 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 whitespace-nowrap"
      >
        <Maximize2 className="w-3 h-3" />
        <span>Fit</span>
      </button>

      <button
        type="button"
        title="Toggle Perspective / Orthographic"
        onClick={() =>
          onChange((v) => ({
            ...v,
            projection: v.projection === 'perspective' ? 'orthographic' : 'perspective',
          }))
        }
        className="px-2 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 whitespace-nowrap"
      >
        <Box className="w-3 h-3" />
        <span>{viewport.projection === 'perspective' ? 'Persp' : 'Ortho'}</span>
      </button>

      <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />

      {/* Overlays */}
      <ToggleChip
        active={viewport.showGrid}
        label="Grid"
        onClick={() => onChange((v) => ({ ...v, showGrid: !v.showGrid }))}
      >
        <Grid className="w-3 h-3" />
      </ToggleChip>

      <ToggleChip
        active={viewport.showBuildPlate}
        label="Bed"
        onClick={() => onChange((v) => ({ ...v, showBuildPlate: !v.showBuildPlate }))}
      >
        <Layers className="w-3 h-3" />
      </ToggleChip>

      <ToggleChip
        active={viewport.showDimensions}
        label="Dims"
        onClick={() => onChange((v) => ({ ...v, showDimensions: !v.showDimensions }))}
      >
        <Ruler className="w-3 h-3" />
      </ToggleChip>

      {hasPhone && (
        <ToggleChip
          active={viewport.showPhoneMockup}
          label="Phone"
          onClick={() => onChange((v) => ({ ...v, showPhoneMockup: !v.showPhoneMockup }))}
        >
          <Smartphone className="w-3 h-3" />
        </ToggleChip>
      )}

      {hasPens && (
        <ToggleChip
          active={viewport.showPensMockup}
          label="Pens"
          onClick={() => onChange((v) => ({ ...v, showPensMockup: !v.showPensMockup }))}
        >
          <PenTool className="w-3 h-3" />
        </ToggleChip>
      )}

      {hasMultipleParts && (
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-700">
          <label htmlFor="exploded-view-slider" className="text-[11px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Explode
          </label>
          <input
            id="exploded-view-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={viewport.explodedAmount}
            onChange={(e) =>
              onChange((v) => ({ ...v, explodedAmount: parseFloat(e.target.value) }))
            }
            className="w-16 h-1.5 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

const ToggleChip: React.FC<{
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, label, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`px-2 py-1 text-[11px] font-medium rounded-lg border inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
      active
        ? 'bg-blue-600 border-blue-600 text-white'
        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {children}
    <span>{label}</span>
  </button>
);
