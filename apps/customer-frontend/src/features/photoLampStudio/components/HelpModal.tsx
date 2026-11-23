import React from 'react';
import {
  HelpCircle,
  X,
  Lightbulb,
  Printer,
  ShieldAlert,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Lithophane Maker Guide & FAQ
              </h3>
              <p className="text-xs text-stone-400">
                Everything you need to know about designing, printing, and assembling 3D photo lamps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-stone-300">
          <div className="space-y-1.5 bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              What is a 3D Lithophane?
            </h4>
            <p className="leading-relaxed text-stone-400">
              A lithophane is an etched or molded artwork in thin, translucent material (like White PLA polymer) that appears gray and indistinct in regular room light, but when backlit with an LED, the varying thicknesses reveal a stunning, highly detailed photographic grayscale image with genuine optical contrast.
            </p>
          </div>

          <div className="space-y-1.5 bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-amber-400" />
              Essential Slicer Settings for 3D Printing
            </h4>
            <ul className="space-y-1 text-stone-400 list-disc list-inside">
              <li>
                <strong className="text-white">Print Orientation:</strong> Print cylinder and flat panels standing vertically upright! Vertical orientation allows the Z-axis layer height (0.12 - 0.16mm) to render razor-sharp image resolution.
              </li>
              <li>
                <strong className="text-white">Infill:</strong> Must be set to <span className="text-amber-400 font-bold">100% Solid Infill</span> (or 99 perimeter walls). Any hollow infill pattern (grid/gyroid) would cast ugly criss-cross shadows when illuminated.
              </li>
              <li>
                <strong className="text-white">Filament:</strong> Standard Opaque or Matte White PLA. Natural translucent PLA also works nicely.
              </li>
              <li>
                <strong className="text-white">Speed:</strong> Print slowly (30 - 45 mm/s) for ultra-clean layer consistency.
              </li>
            </ul>
          </div>

          <div className="space-y-1.5 bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Electrical Safety & LED Module Recommendations
            </h4>
            <p className="leading-relaxed text-stone-400">
              3D printed plastics (PLA/PETG) soften above 55°C (130°F). <strong className="text-amber-300">Never use high-heat incandescent or halogen bulbs!</strong>
            </p>
            <p className="leading-relaxed text-stone-400">
              Always use low-voltage, low-heat 5V USB LED discs (35mm - 45mm diameter) or cool-running 5V COB LED strips. The lamp base features dedicated ventilation and cable exit slots for a standard USB cable.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
