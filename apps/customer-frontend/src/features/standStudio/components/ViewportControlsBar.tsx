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
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 max-w-[95%] flex flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible items-center sm:justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-card bg-surface/95 border border-line shadow-card backdrop-blur-md">
      {/* Camera Presets */}
      <div className="flex items-center gap-0.5 bg-alt p-0.5 rounded-control border border-line">
        {(['iso', 'front', 'side', 'top'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              onChange((v) => ({ ...v, cameraPreset: preset }));
              onFitCamera();
            }}
            className={`px-2 py-1 text-[11px] font-semibold uppercase rounded-control transition-colors whitespace-nowrap ${
              viewport.cameraPreset === preset
                ? 'bg-accent text-on-accent font-bold shadow-xs'
                : 'text-muted hover:text-ink hover:bg-surface/50'
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
        className="px-2 py-1 text-[11px] font-medium rounded-control border border-line bg-alt text-muted hover:text-accent hover:border-accent inline-flex items-center gap-1 whitespace-nowrap transition-colors"
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
        className="px-2 py-1 text-[11px] font-medium rounded-control border border-line bg-alt text-muted hover:text-accent hover:border-accent inline-flex items-center gap-1 whitespace-nowrap transition-colors"
      >
        <Box className="w-3 h-3" />
        <span>{viewport.projection === 'perspective' ? 'Persp' : 'Ortho'}</span>
      </button>

      <span className="w-px h-4 bg-line" aria-hidden="true" />

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
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-line">
          <label htmlFor="exploded-view-slider" className="text-[11px] font-medium text-muted whitespace-nowrap">
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
            className="w-16 h-1.5 cursor-pointer accent-accent"
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
    className={`px-2 py-1 text-[11px] font-medium rounded-control border inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
      active
        ? 'bg-accent border-accent text-on-accent font-semibold shadow-xs'
        : 'border-line text-muted hover:text-ink hover:bg-alt'
    }`}
  >
    {children}
    <span>{label}</span>
  </button>
);
