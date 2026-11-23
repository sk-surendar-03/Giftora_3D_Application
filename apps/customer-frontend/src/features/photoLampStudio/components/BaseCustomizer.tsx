import React from 'react';
import { LampBaseSettings, BaseShapeType } from '../types/lithophane';
import {
  Boxes,
  Circle,
  Square,
  Hexagon,
  Cable,
  Type,
  Maximize,
  Sliders,
} from 'lucide-react';

interface BaseCustomizerProps {
  baseSettings: LampBaseSettings;
  onChangeBaseSettings: (updated: Partial<LampBaseSettings>) => void;
}

export const BaseCustomizer: React.FC<BaseCustomizerProps> = ({
  baseSettings,
  onChangeBaseSettings,
}) => {
  const SHAPES: { id: BaseShapeType; label: string; icon: React.ElementType }[] = [
    { id: 'circular', label: 'Circular Base', icon: Circle },
    { id: 'square', label: 'Square Base', icon: Square },
    { id: 'hexagonal', label: 'Hexagonal Base', icon: Hexagon },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-400" />
            Printable LED Lamp Base Generator
          </h3>
          <p className="text-xs text-stone-400">
            Engineered base with LED puck cavity, cable exit channel, and snap-fit lithophane slot.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl">
          <input
            type="checkbox"
            checked={baseSettings.enabled}
            onChange={(e) => onChangeBaseSettings({ enabled: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded bg-stone-800 border-stone-700"
          />
          <span className="text-xs text-stone-200 font-semibold">
            Generate Separate Base STL
          </span>
        </label>
      </div>

      {baseSettings.enabled && (
        <div className="space-y-4 bg-stone-900/40 border border-stone-800/80 rounded-2xl p-4">
          {/* Base Shape Selector */}
          <div>
            <label className="text-xs font-semibold text-stone-300 mb-2 block">
              Base Profile Geometry
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SHAPES.map((s) => {
                const Icon = s.icon;
                const isSelected = baseSettings.shape === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onChangeBaseSettings({ shape: s.id })}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimensions: Diameter & Height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium flex items-center gap-1.5">
                  <Maximize className="w-3.5 h-3.5 text-amber-400" /> Base Outer Diameter
                </span>
                <span className="font-mono text-amber-400">{baseSettings.diameterMm} mm</span>
              </div>
              <input
                type="range"
                min={70}
                max={150}
                value={baseSettings.diameterMm}
                onChange={(e) =>
                  onChangeBaseSettings({ diameterMm: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" /> Base Height
                </span>
                <span className="font-mono text-amber-400">{baseSettings.heightMm} mm</span>
              </div>
              <input
                type="range"
                min={16}
                max={45}
                value={baseSettings.heightMm}
                onChange={(e) =>
                  onChangeBaseSettings({ heightMm: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* LED Puck Cavity & Cable Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">LED Disc Cavity Dia</span>
                <span className="font-mono text-amber-400">
                  {baseSettings.cavityDiameterMm} mm
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={65}
                value={baseSettings.cavityDiameterMm}
                onChange={(e) =>
                  onChangeBaseSettings({ cavityDiameterMm: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-stone-500">
                Fits standard 35mm-45mm 5V LED USB pucks
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium flex items-center gap-1.5">
                  <Cable className="w-3.5 h-3.5 text-amber-400" /> Cable Exit Slot Width
                </span>
                <span className="font-mono text-amber-400">
                  {baseSettings.cableSlotWidthMm} mm
                </span>
              </div>
              <input
                type="range"
                min={3.5}
                max={8.0}
                step={0.5}
                value={baseSettings.cableSlotWidthMm}
                onChange={(e) =>
                  onChangeBaseSettings({ cableSlotWidthMm: Number(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-stone-500">
                Pass-through for Type-C or Micro-USB cable
              </span>
            </div>
          </div>

          {/* Engraved Personal Text on Base */}
          <div className="pt-2 border-t border-stone-800">
            <label className="text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              Engraved Text on Base Face (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Always & Forever • 24.10.2024"
              value={baseSettings.engravedText}
              onChange={(e) => onChangeBaseSettings({ engravedText: e.target.value })}
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
        </div>
      )}
    </div>
  );
};
