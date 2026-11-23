import React from 'react';
import { PrintSettings, LampShapeType } from '../types/lithophane';
import {
  Ruler,
  Cpu,
} from 'lucide-react';

interface PrintSettingsPanelProps {
  settings: PrintSettings;
  shape: LampShapeType;
  onChangeSettings: (updated: Partial<PrintSettings>) => void;
}

export const PrintSettingsPanel: React.FC<PrintSettingsPanelProps> = ({
  settings,
  shape,
  onChangeSettings,
}) => {
  const isCylinderOrRound = shape === 'cylinder' || shape === 'circular' || shape === 'moon' || shape === 'curved';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Ruler className="w-4 h-4 text-amber-400" />
          3D Printing & Lithophane Geometry Controls
        </h3>
        <p className="text-xs text-stone-400">
          Fine-tune physical dimensions, wall thickness limits, and mesh sampling resolution.
        </p>
      </div>

      <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-4 space-y-4">
        {/* Model Dimensions */}
        <div>
          <label className="text-xs font-semibold text-stone-300 mb-2 block">
            Physical Dimensions (Millimeters)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Height */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">Model Height</span>
                <span className="font-mono text-amber-400">{settings.modelHeightMm} mm</span>
              </div>
              <input
                type="range"
                min={70}
                max={220}
                value={settings.modelHeightMm}
                onChange={(e) =>
                  onChangeSettings({ modelHeightMm: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Diameter or Width */}
            {isCylinderOrRound ? (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium">Outer Diameter</span>
                  <span className="font-mono text-amber-400">
                    {settings.modelDiameterMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={160}
                  value={settings.modelDiameterMm}
                  onChange={(e) =>
                    onChangeSettings({ modelDiameterMm: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium">Panel Width</span>
                  <span className="font-mono text-amber-400">{settings.modelWidthMm} mm</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={200}
                  value={settings.modelWidthMm}
                  onChange={(e) =>
                    onChangeSettings({ modelWidthMm: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Lithophane Optical Thickness Range */}
        <div className="pt-2 border-t border-stone-800">
          <label className="text-xs font-semibold text-stone-300 mb-2 block">
            Optical Thickness Calibration (Z-Depth Range)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Minimum Thickness */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">
                  Min Thickness (Bright Highlights)
                </span>
                <span className="font-mono text-amber-400">
                  {settings.minThicknessMm.toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.6}
                step={0.1}
                value={settings.minThicknessMm}
                onChange={(e) =>
                  onChangeSettings({ minThicknessMm: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-stone-500">
                Recommended: 0.8mm for PLA strength & high light transmission
              </span>
            </div>

            {/* Maximum Thickness */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">
                  Max Thickness (Deep Shadows)
                </span>
                <span className="font-mono text-amber-400">
                  {settings.maxThicknessMm.toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min={2.4}
                max={4.2}
                step={0.1}
                value={settings.maxThicknessMm}
                onChange={(e) =>
                  onChangeSettings({ maxThicknessMm: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-stone-500">
                Recommended: 3.0mm - 3.2mm for rich contrast and deep blacks
              </span>
            </div>
          </div>
        </div>

        {/* Mesh Sampling Resolution & Quality */}
        <div className="pt-2 border-t border-stone-800">
          <label className="text-xs font-semibold text-stone-300 mb-2 block flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            Image Sampling Grid Quality
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'low', label: 'Draft', desc: '120px • Fast preview' },
              { id: 'medium', label: 'Standard', desc: '200px • Balanced' },
              { id: 'high', label: 'Fine Maker', desc: '300px • Sharp details' },
              { id: 'ultra', label: 'Ultra HD', desc: '450px • Museum quality' },
            ].map((q) => (
              <button
                key={q.id}
                onClick={() => onChangeSettings({ samplingResolution: q.id as any })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  settings.samplingResolution === q.id
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                }`}
              >
                <div className="text-xs font-bold text-white">{q.label}</div>
                <div className="text-[10px] text-stone-500">{q.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Edge Border & Curve Angle if applicable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300 font-medium">Solid Border Width</span>
              <span className="font-mono text-amber-400">{settings.borderWidthMm} mm</span>
            </div>
            <input
              type="range"
              min={1.5}
              max={6.0}
              step={0.5}
              value={settings.borderWidthMm}
              onChange={(e) =>
                onChangeSettings({ borderWidthMm: Number(e.target.value) })
              }
              className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
            />
          </div>

          {shape === 'curved' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">Arc Curve Angle</span>
                <span className="font-mono text-amber-400">{settings.curveAngleDeg}°</span>
              </div>
              <input
                type="range"
                min={60}
                max={180}
                value={settings.curveAngleDeg}
                onChange={(e) =>
                  onChangeSettings({ curveAngleDeg: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
