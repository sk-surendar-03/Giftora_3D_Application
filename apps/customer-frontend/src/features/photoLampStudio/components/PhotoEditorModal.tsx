import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ImageAdjustmentSettings,
  PhotoSlot,
} from '../types/lithophane';
import {
  Sliders,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  SlidersHorizontal,
  AlertTriangle,
  Sparkles,
  Check,
  X,
  SplitSquareVertical,
} from 'lucide-react';
import { processImageForLithophane } from '../geometry/imageProcessor';

interface PhotoEditorModalProps {
  photo: PhotoSlot;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAdjustments: ImageAdjustmentSettings, processedDataUrl: string) => void;
}

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  photo,
  isOpen,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState<ImageAdjustmentSettings>(photo.adjustments);
  const [splitSlider, setSplitSlider] = useState<number>(50); // 0 to 100
  const [showSplit, setShowSplit] = useState<boolean>(true);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);

  const renderLivePreview = useCallback(
    (img: HTMLImageElement, adj: ImageAdjustmentSettings) => {
      const result = processImageForLithophane(img, adj, 320);
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      canvas.width = result.width;
      canvas.height = result.height;
      const ctx = canvas.getContext('2d')!;

      // Draw processed image
      ctx.drawImage(result.canvas, 0, 0);

      // If split mode enabled, draw original on the left side
      if (showSplit) {
        const splitX = (splitSlider / 100) * canvas.width;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, canvas.height);
        ctx.clip();

        // Draw original fitted
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Split line
        ctx.restore();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, canvas.height);
        ctx.stroke();

        // Split line handle circle
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(splitX, canvas.height / 2, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [showSplit, splitSlider]
  );

  // Load source image
  useEffect(() => {
    if (!isOpen) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImgRef.current = img;
      renderLivePreview(img, settings);
    };
    img.src = photo.dataUrl;
  }, [isOpen, photo.dataUrl, renderLivePreview, settings]);

  // Re-render preview whenever settings change
  useEffect(() => {
    if (!originalImgRef.current) return;
    renderLivePreview(originalImgRef.current, settings);
  }, [settings, renderLivePreview]);

  const handleRotate = () => {
    setSettings((prev) => ({
      ...prev,
      rotation: ((prev.rotation + 90) % 360) as any,
    }));
  };

  const handleFlipH = () => {
    setSettings((prev) => ({ ...prev, flipH: !prev.flipH }));
  };

  const handleFlipV = () => {
    setSettings((prev) => ({ ...prev, flipV: !prev.flipV }));
  };

  const handleReset = () => {
    setSettings({
      brightness: 0,
      contrast: 15,
      gamma: 1.0,
      sharpness: 20,
      grayscale: true,
      invertTones: false,
      denoise: false,
      rotation: 0,
      flipH: false,
      flipV: false,
      cropAspect: 'free',
      zoom: 1.0,
      panX: 0,
      panY: 0,
    });
  };

  const handleApply = () => {
    if (!originalImgRef.current) return;
    const finalResult = processImageForLithophane(originalImgRef.current, settings, 400);
    const processedUrl = finalResult.canvas.toDataURL('image/jpeg', 0.9);
    onSave(settings, processedUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Photo Lithophane Editor
              </h3>
              <p className="text-[11px] text-stone-400">
                Enhance tone balance and dynamic range for crisp, glowing 3D prints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Left Preview, Right Controls */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto">
          {/* Left Canvas Preview */}
          <div className="md:col-span-6 p-4 flex flex-col items-center justify-center bg-stone-950/90 border-b md:border-b-0 md:border-r border-stone-800">
            {photo.isLowRes && (
              <div className="mb-2.5 w-full bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-2 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Low resolution detected ({photo.width}x{photo.height}). For best detail, use images &gt; 800px.
                </span>
              </div>
            )}

            <div className="relative max-w-full max-h-[360px] flex items-center justify-center rounded-xl overflow-hidden border border-stone-800 bg-stone-900/50 p-1">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[340px] max-w-full object-contain rounded-lg shadow-xl"
              />
            </div>

            {/* Split Screen Slider & Indicator */}
            <div className="w-full mt-3 flex items-center justify-between text-xs text-stone-400">
              <button
                onClick={() => setShowSplit(!showSplit)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  showSplit
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-stone-900 text-stone-400 border-stone-800'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Split Comparison ({showSplit ? 'ON' : 'OFF'})</span>
              </button>

              {showSplit && (
                <div className="flex items-center gap-2 flex-1 max-w-[200px] ml-3">
                  <span className="text-[10px] text-stone-500 font-mono">Original</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={splitSlider}
                    onChange={(e) => setSplitSlider(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-amber-400 font-mono">Litho</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="md:col-span-6 p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Quick Transforms */}
            <div>
              <label className="text-xs font-semibold text-stone-300 mb-2 block">
                Transform & Orientation
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRotate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotate 90° ({settings.rotation}°)</span>
                </button>
                <button
                  onClick={handleFlipH}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    settings.flipH
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip H</span>
                </button>
                <button
                  onClick={handleFlipV}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    settings.flipV
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip V</span>
                </button>
              </div>
            </div>

            {/* Sliders: Brightness, Contrast, Gamma, Sharpness */}
            <div className="space-y-3 pt-2 border-t border-stone-800">
              {/* Contrast */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium flex items-center gap-1.5">
                    <Contrast className="w-3.5 h-3.5 text-amber-400" /> Contrast
                  </span>
                  <span className="font-mono text-amber-400">{settings.contrast}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={80}
                  value={settings.contrast}
                  onChange={(e) =>
                    setSettings({ ...settings, contrast: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Brightness
                  </span>
                  <span className="font-mono text-amber-400">{settings.brightness}</span>
                </div>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={settings.brightness}
                  onChange={(e) =>
                    setSettings({ ...settings, brightness: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Gamma */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> Gamma (Midtones)
                  </span>
                  <span className="font-mono text-amber-400">{settings.gamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={settings.gamma}
                  onChange={(e) =>
                    setSettings({ ...settings, gamma: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Sharpness */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Detail Sharpening
                  </span>
                  <span className="font-mono text-amber-400">{settings.sharpness}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={settings.sharpness}
                  onChange={(e) =>
                    setSettings({ ...settings, sharpness: Number(e.target.value) })
                  }
                  className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Zoom & Pan */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-300 font-medium">Zoom</span>
                    <span className="font-mono text-amber-400">{settings.zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={2.5}
                    step={0.1}
                    value={settings.zoom}
                    onChange={(e) =>
                      setSettings({ ...settings, zoom: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-300 font-medium">Aspect Ratio</span>
                  </div>
                  <select
                    value={settings.cropAspect}
                    onChange={(e) =>
                      setSettings({ ...settings, cropAspect: e.target.value as any })
                    }
                    className="w-full bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="free">Auto (Match Image)</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="4:3">4:3 Standard</option>
                    <option value="3:4">3:4 Portrait</option>
                    <option value="16:9">16:9 Wide</option>
                    <option value="9:16">9:16 Story</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Special Lithophane Flags: Invert Tones & Denoise */}
            <div className="pt-2 border-t border-stone-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.invertTones}
                  onChange={(e) =>
                    setSettings({ ...settings, invertTones: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded bg-stone-800 border-stone-700"
                />
                <span className="text-xs text-stone-200 font-medium">
                  Invert Tones (Negative Lithophane mode)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.denoise}
                  onChange={(e) =>
                    setSettings({ ...settings, denoise: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded bg-stone-800 border-stone-700"
                />
                <span className="text-xs text-stone-200 font-medium">
                  Portrait Denoising (Smooth noisy grain & artifacts)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply to 3D Lamp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
