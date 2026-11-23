import React, { useRef } from 'react';
import { PhotoSlot, LampShapeType } from '../types/lithophane';
import {
  Upload,
  Sliders,
  Sparkles,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { SAMPLE_PRESETS } from '../services/sampleImages';
import { getDefaultAdjustments, loadImageElement } from '../geometry/imageProcessor';

interface PhotoManagerProps {
  photos: PhotoSlot[];
  activePhotoIndex: number;
  shape: LampShapeType;
  onSelectActiveIndex: (index: number) => void;
  onUpdatePhoto: (index: number, newPhoto: Partial<PhotoSlot>) => void;
  onOpenEditorForIndex: (index: number) => void;
  onLoadPreset: (presetDataUrl: string, title: string) => void;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  activePhotoIndex,
  shape: _shape,
  onSelectActiveIndex,
  onUpdatePhoto,
  onOpenEditorForIndex,
  onLoadPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePhoto = photos[activePhotoIndex] || photos[0];

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const img = await loadImageElement(file);
      onUpdatePhoto(activePhotoIndex, {
        originalName: file.name,
        dataUrl: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        isLowRes: img.naturalWidth < 400 || img.naturalHeight < 400,
        adjustments: getDefaultAdjustments(),
      });
    } catch (err) {
      console.error('Error reading image', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-400" />
            2. Photo Upload & Editing
          </h3>
          <p className="text-xs text-stone-400">
            High contrast photos with well-lit subjects yield breathtaking glowing 3D lithophanes.
          </p>
        </div>
      </div>

      {/* Multi-Panel Tabs if Template has > 1 Photo */}
      {photos.length > 1 && (
        <div className="bg-stone-900/80 p-1.5 rounded-xl border border-stone-800 flex items-center gap-1.5 overflow-x-auto">
          {photos.map((p, idx) => (
            <button
              key={p.id || idx}
              onClick={() => onSelectActiveIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activePhotoIndex === idx
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-stone-950/30 text-[10px] flex items-center justify-center font-mono">
                {idx + 1}
              </span>
              <span>{p.label || `Side ${idx + 1}`}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Upload Dropzone & Active Preview Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Upload Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="md:col-span-7 border-2 border-dashed border-stone-700/80 hover:border-amber-500/80 bg-stone-900/40 hover:bg-stone-900/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>

          <p className="text-sm font-bold text-white mb-1">
            Click to upload or drag & drop photo
          </p>
          <p className="text-xs text-stone-400 max-w-sm mb-2">
            Supports JPG, PNG, WebP. High-res portraits produce the sharpest illuminated detail.
          </p>
          <span className="text-[10px] font-mono uppercase text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Targeting: {activePhoto?.label || 'Front Panel'}
          </span>
        </div>

        {/* Active Photo Thumbnail & Edit Trigger */}
        <div className="md:col-span-5 bg-stone-900/60 border border-stone-800 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-stone-950 border border-stone-800 flex-shrink-0">
              <img
                src={activePhoto?.dataUrl}
                alt="Active lithophane source"
                className="w-full h-full object-cover"
              />
              {activePhoto?.isLowRes && (
                <div
                  title="Low resolution image"
                  className="absolute top-1 right-1 bg-amber-500/90 text-stone-950 p-0.5 rounded"
                >
                  <AlertTriangle className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                {activePhoto?.originalName || 'Photo Preview'}
              </h4>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Resolution: {activePhoto?.width} x {activePhoto?.height} px
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded border border-stone-700">
                  Contrast: {activePhoto?.adjustments?.contrast || 0}
                </span>
                <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded border border-stone-700">
                  {activePhoto?.adjustments?.invertTones ? 'Inverted' : 'Standard'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenEditorForIndex(activePhotoIndex)}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Sliders className="w-4 h-4" />
            <span>Edit & Enhance This Photo</span>
          </button>
        </div>
      </div>

      {/* Instant 1-Click Sample Preset Gallery */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Or try instant sample presets:
          </span>
          <span className="text-[10px] text-stone-500">1-click test</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                const url = preset.generateDataUrl();
                onLoadPreset(url, preset.title);
              }}
              className="group p-2 rounded-xl bg-stone-900/60 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                  {preset.title}
                </p>
                <p className="text-[10px] text-stone-400 truncate">
                  {preset.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
