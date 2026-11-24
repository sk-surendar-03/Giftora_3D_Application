import React from 'react';
import { LedLightingSettings } from '../types/lithophane';
import {
  Lightbulb,
  Sun,
  Moon,
  Palette,
  Power,
  Sliders,
  Info,
} from 'lucide-react';

interface LightingPanelProps {
  lighting: LedLightingSettings;
  onChangeLighting: (updated: Partial<LedLightingSettings>) => void;
  explodedProgress?: number;
  onChangeExplodedProgress?: (val: number) => void;
}

export const LightingPanel: React.FC<LightingPanelProps> = ({
  lighting,
  onChangeLighting,
  explodedProgress = 0,
  onChangeExplodedProgress = () => {},
}) => {
  const PRESET_COLORS = [
    { id: 'warm', label: 'Warm 2700K', hex: '#ffdfa0', desc: 'Cozy golden bedside ambiance' },
    { id: 'cool', label: 'Cool 6500K', hex: '#e0f0ff', desc: 'Crisp photographic daylight' },
    { id: 'neutral', label: 'Neutral 4000K', hex: '#fff6e6', desc: 'Balanced natural tone' },
    { id: 'amber', label: 'Amber Gold', hex: '#ff9c38', desc: 'Deep romantic dusk warmth' },
    { id: 'sunset', label: 'Sunset Coral', hex: '#ff5e3a', desc: 'Vibrant celebratory glow' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            LED Illumination & Studio Environment
          </h3>
          <p className="text-xs text-stone-400">
            Simulate realistic internal LED lighting passing through varying plastic thicknesses.
          </p>
        </div>

        {/* Master LED Power Toggle */}
        <button
          onClick={() => onChangeLighting({ isOn: !lighting.isOn })}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
            lighting.isOn
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
              : 'bg-stone-800 text-stone-400 hover:text-white border border-stone-700'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>LED Light: {lighting.isOn ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Color Presets & Custom Picker */}
      <div>
        <label className="text-xs font-semibold text-stone-300 mb-2 block">
          LED Color Temperature & Tint
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_COLORS.map((col) => {
            const isSelected = !lighting.rgbCycle && lighting.colorPreset === col.id;
            return (
              <button
                key={col.id}
                onClick={() =>
                  onChangeLighting({
                    isOn: true,
                    rgbCycle: false,
                    colorPreset: col.id as any,
                  })
                }
                className={`p-2 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                  style={{ backgroundColor: col.hex }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{col.label}</div>
                  <div className="text-[10px] text-stone-400 truncate">{col.desc}</div>
                </div>
              </button>
            );
          })}

          {/* RGB Cycle Preset */}
          <button
            onClick={() =>
              onChangeLighting({
                isOn: true,
                rgbCycle: !lighting.rgbCycle,
              })
            }
            className={`p-2 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
              lighting.rgbCycle
                ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500 shadow-inner flex-shrink-0 animate-pulse" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">RGB Cycling</div>
              <div className="text-[10px] text-stone-400 truncate">Party rainbow flow</div>
            </div>
          </button>
        </div>

        {/* Custom Hex Color Option */}
        <div className="mt-2.5 flex items-center gap-3 bg-stone-900/60 border border-stone-800 rounded-xl p-2.5">
          <Palette className="w-4 h-4 text-stone-400" />
          <span className="text-xs text-stone-300 font-medium">Custom LED Color:</span>
          <input
            type="color"
            value={lighting.customColor}
            onChange={(e) =>
              onChangeLighting({
                isOn: true,
                rgbCycle: false,
                colorPreset: 'custom',
                customColor: e.target.value,
              })
            }
            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
          />
          <span className="text-xs font-mono text-amber-400 uppercase">
            {lighting.customColor}
          </span>
        </div>
      </div>

      {/* Sliders: LED Brightness & Ambient Darkness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
        {/* Brightness */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-300 font-medium flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" /> LED Intensity
            </span>
            <span className="font-mono text-amber-400">{lighting.brightness}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={lighting.brightness}
            disabled={!lighting.isOn}
            onChange={(e) => onChangeLighting({ brightness: Number(e.target.value) })}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer disabled:opacity-40"
          />
        </div>

        {/* Ambient Room Darkness */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-300 font-medium flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-amber-400" /> Room Darkness
            </span>
            <span className="font-mono text-amber-400">{lighting.ambientDarkness}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={lighting.ambientDarkness}
            onChange={(e) => onChangeLighting({ ambientDarkness: Number(e.target.value) })}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Exploded View Slider */}
      <div className="pt-2 border-t border-stone-800">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-stone-300 font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" /> Exploded Assembly View
          </span>
          <span className="font-mono text-amber-400">
            {Math.round(explodedProgress * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={explodedProgress}
          onChange={(e) => onChangeExplodedProgress(Number(e.target.value))}
          className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
          <span>Assembled Lamp</span>
          <span>Inspect Internal LED Cavity & Base</span>
        </div>
      </div>

      {/* Backdrop selector */}
      <div>
        <label className="text-xs font-semibold text-stone-300 mb-1.5 block">
          Backdrop Environment
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'nightstand', label: 'Cozy Nightstand' },
            { id: 'modern_studio', label: 'Modern Studio' },
            { id: 'wood_desk', label: 'Warm Wood Desk' },
            { id: 'maker_bench', label: 'Maker Bench' },
          ].map((env) => (
            <button
              key={env.id}
              onClick={() => onChangeLighting({ backdrop: env.id as any })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                lighting.backdrop === env.id
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {env.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hardware Disclosure Notice */}
      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-2.5 flex items-start gap-2 text-stone-400 text-[11px]">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Maker Note:</strong> Lighting effects are interactive 3D simulations. Real illumination depends on the physical 5V USB LED module (35-45mm) installed in the base. Always use low-heat 5V LED modules.
        </span>
      </div>
    </div>
  );
};
