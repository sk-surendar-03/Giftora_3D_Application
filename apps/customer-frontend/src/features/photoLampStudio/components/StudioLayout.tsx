import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import {
  LithophaneProject,
  ImageAdjustmentSettings,
  PhotoSlot,
  MeshValidationReport,
} from '../types/lithophane';
import {
  Wand2,
  Sliders,
  Ruler,
  Boxes,
  Sparkles,
  Download,
  Calculator,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
} from 'lucide-react';

import { LithophaneViewer } from './LithophaneViewer';
import { TemplateSelector } from './TemplateSelector';
import { PhotoManager } from './PhotoManager';
import { PhotoEditorModal } from './PhotoEditorModal';
import { PrintSettingsPanel } from './PrintSettingsPanel';
import { BaseCustomizer } from './BaseCustomizer';
import { PersonalizationPanel } from './PersonalizationPanel';
import { LightingPanel } from './LightingPanel';

import {
  generateCylindricalLithophane,
  generateRectangularLithophane,
  generateCurvedLithophane,
  generateHeartLithophane,
  generateMoonLithophane,
  generateCircularLithophane,
  generatePrismLithophane,
  generatePrintableLampBase,
  generateLampFrame,
  validateMeshGeometry,
} from '../geometry/lithophaneGeometry';
import { processImageForLithophane, loadImageElement } from '../geometry/imageProcessor';

interface StudioLayoutProps {
  project: LithophaneProject;
  onChangeProject: (updated: Partial<LithophaneProject>) => void;
  onOpenExport: () => void;
  onOpenEstimator: () => void;
  onAddToCart: () => void;
  onSnapshotCaptured: (dataUrl: string) => void;
  validationReport: MeshValidationReport;
  onUpdateValidationReport: (rep: MeshValidationReport) => void;
  lithophaneGeometry: THREE.BufferGeometry | null;
  baseGeometry: THREE.BufferGeometry | null;
  frameGeometry: THREE.BufferGeometry | null;
  onGeometriesGenerated: (
    litho: THREE.BufferGeometry,
    base: THREE.BufferGeometry | null,
    frame: THREE.BufferGeometry | null
  ) => void;
}

type StudioTab = 'template' | 'photos' | 'print' | 'base' | 'personalize' | 'lighting';

export const StudioLayout: React.FC<StudioLayoutProps> = ({
  project,
  onChangeProject,
  onOpenExport,
  onOpenEstimator,
  onAddToCart,
  onSnapshotCaptured,
  validationReport: _validationReport,
  onUpdateValidationReport,
  lithophaneGeometry,
  baseGeometry,
  frameGeometry,
  onGeometriesGenerated,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('template');
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState(0);
  const [explodedProgress, setExplodedProgress] = useState(0);

  // Active processed canvas for Three.js material
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | undefined>(undefined);

  // Re-generate geometry when project parameters or photo data change
  useEffect(() => {
    let isCancelled = false;

    const runGeneration = async () => {
      const activePhoto = project.photos[project.activePhotoIndex] || project.photos[0];
      if (!activePhoto?.dataUrl) return;

      try {
        const img = await loadImageElement(activePhoto.dataUrl);
        if (isCancelled) return;

        // Determine grid sample size based on quality setting
        let sampleWidth = 200;
        if (project.printSettings.samplingResolution === 'low') sampleWidth = 120;
        else if (project.printSettings.samplingResolution === 'high') sampleWidth = 300;
        else if (project.printSettings.samplingResolution === 'ultra') sampleWidth = 450;

        const processed = processImageForLithophane(
          img,
          activePhoto.adjustments,
          sampleWidth
        );
        if (isCancelled) return;

        setProcessedCanvas(processed.canvas);

        // Generate geometry based on shape
        let lithoGeo: THREE.BufferGeometry;
        const gridW = processed.width;
        const gridH = processed.height;

        switch (project.shape) {
          case 'cylinder':
          case 'rotating':
            lithoGeo = generateCylindricalLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            );
            break;
          case 'curved':
            lithoGeo = generateCurvedLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            );
            break;
          case 'four_sided':
          case 'hexagonal':
            lithoGeo = generatePrismLithophane(
              [processed.thicknessMap],
              project.shape === 'four_sided' ? 4 : 6,
              Math.min(160, gridW),
              Math.min(160, gridH),
              project.printSettings
            );
            break;
          case 'heart':
            lithoGeo = generateHeartLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            );
            break;
          case 'moon':
            lithoGeo = generateMoonLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            );
            break;
          case 'circular':
            lithoGeo = generateCircularLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            );
            break;
          case 'rectangle':
          default:
            lithoGeo = generateRectangularLithophane(
              processed.thicknessMap,
              gridW,
              gridH,
              project.printSettings
            );
            break;
        }

        // Generate base geometry if enabled
        let baseGeo: THREE.BufferGeometry | null = null;
        if (project.baseSettings.enabled) {
          baseGeo = generatePrintableLampBase(
            project.shape,
            project.baseSettings,
            project.printSettings,
            project.personalization
          );
        }

        // Generate top cap / frame geometry
        const frameGeo = generateLampFrame(project.shape, project.printSettings);

        // Compute validation stats
        const report = validateMeshGeometry(lithoGeo, project.printSettings);
        onUpdateValidationReport(report);

        onGeometriesGenerated(lithoGeo, baseGeo, frameGeo);
      } catch (err) {
        console.error('Mesh generation failed:', err);
      }
    };

    runGeneration();

    return () => {
      isCancelled = true;
    };
  }, [
    project.shape,
    project.photos,
    project.activePhotoIndex,
    project.printSettings,
    project.baseSettings,
    project.personalization,
    onGeometriesGenerated,
    onUpdateValidationReport,
  ]);

  // Tab definitions
  const TABS = [
    { id: 'template', label: '1. Lamp Shape', icon: Wand2 },
    { id: 'photos', label: '2. Photos & Edit', icon: Sliders },
    { id: 'print', label: '3. 3D Dimensions', icon: Ruler },
    { id: 'base', label: '4. Lamp Base', icon: Boxes },
    { id: 'personalize', label: '5. Personalize', icon: Sparkles },
    { id: 'lighting', label: '6. LED Lighting', icon: Lightbulb },
  ];

  const handleUpdatePhotoSlot = (index: number, updated: Partial<PhotoSlot>) => {
    const newPhotos = [...project.photos];
    newPhotos[index] = { ...newPhotos[index], ...updated };
    onChangeProject({ photos: newPhotos });
  };

  const handleOpenEditor = (index: number) => {
    setEditingPhotoIndex(index);
    setEditorModalOpen(true);
  };

  const handleSavePhotoAdjustments = (
    adjustments: ImageAdjustmentSettings,
    processedDataUrl: string
  ) => {
    handleUpdatePhotoSlot(editingPhotoIndex, {
      adjustments,
      thumbnailUrl: processedDataUrl,
    });
  };

  const handleLoadSamplePreset = async (dataUrl: string, title: string) => {
    const img = await loadImageElement(dataUrl);
    handleUpdatePhotoSlot(project.activePhotoIndex, {
      originalName: title,
      dataUrl,
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight,
      isLowRes: false,
    });
  };

  return (
    <div className="w-full h-[calc(100vh-65px)] flex flex-col bg-stone-950 text-white overflow-hidden">
      {/* Top Studio Action Bar */}
      <div className="border-b border-stone-800 bg-stone-900/60 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Design Title & Dimensions chip */}
        <div className="flex items-center gap-2.5 min-w-0">
          <input
            type="text"
            value={project.name}
            onChange={(e) => onChangeProject({ name: e.target.value })}
            className="bg-transparent border-b border-transparent hover:border-stone-700 focus:border-amber-500 text-sm font-extrabold text-white px-1 py-0.5 focus:outline-none truncate max-w-[200px] sm:max-w-xs"
            title="Click to rename project"
          />
          <span className="hidden sm:inline-block text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
            {project.printSettings.modelHeightMm}mm H × {project.printSettings.modelDiameterMm || project.printSettings.modelWidthMm}mm
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEstimator}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Cost Estimator</span>
          </button>

          <button
            onClick={onAddToCart}
            className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Order</span>
          </button>

          <button
            onClick={onOpenExport}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export 3D Files</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: Left Configuration Drawer, Right 3D Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Side: Navigation Stepper & Active Tab Panel */}
        <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 border-r border-stone-800 flex flex-col bg-stone-900/40 min-h-0 h-full overflow-hidden">
          {/* Stepper Tabs Bar */}
          <div className="border-b border-stone-800 bg-stone-950/80 p-2 overflow-x-auto flex items-center gap-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as StudioTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Body */}
          <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto">
            {activeTab === 'template' && (
              <TemplateSelector
                selectedShape={project.shape}
                onSelectShape={(shape) => onChangeProject({ shape })}
              />
            )}

            {activeTab === 'photos' && (
              <PhotoManager
                photos={project.photos}
                activePhotoIndex={project.activePhotoIndex}
                shape={project.shape}
                onSelectActiveIndex={(idx) =>
                  onChangeProject({ activePhotoIndex: idx })
                }
                onUpdatePhoto={handleUpdatePhotoSlot}
                onOpenEditorForIndex={handleOpenEditor}
                onLoadPreset={handleLoadSamplePreset}
              />
            )}

            {activeTab === 'print' && (
              <PrintSettingsPanel
                settings={project.printSettings}
                shape={project.shape}
                onChangeSettings={(up) =>
                  onChangeProject({
                    printSettings: { ...project.printSettings, ...up },
                  })
                }
              />
            )}

            {activeTab === 'base' && (
              <BaseCustomizer
                baseSettings={project.baseSettings}
                onChangeBaseSettings={(up) =>
                  onChangeProject({
                    baseSettings: { ...project.baseSettings, ...up },
                  })
                }
              />
            )}

            {activeTab === 'personalize' && (
              <PersonalizationPanel
                personalization={project.personalization}
                onChangePersonalization={(up) =>
                  onChangeProject({
                    personalization: { ...project.personalization, ...up },
                  })
                }
              />
            )}

            {activeTab === 'lighting' && (
              <LightingPanel
                lighting={project.lighting}
                onChangeLighting={(up) =>
                  onChangeProject({
                    lighting: { ...project.lighting, ...up },
                  })
                }
                explodedProgress={explodedProgress}
                onChangeExplodedProgress={setExplodedProgress}
              />
            )}
          </div>

          {/* Bottom Step Navigation Bar */}
          <div className="p-3 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between">
            <button
              onClick={() => {
                const curIdx = TABS.findIndex((t) => t.id === activeTab);
                if (curIdx > 0) setActiveTab(TABS[curIdx - 1].id as StudioTab);
              }}
              disabled={activeTab === 'template'}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-400 hover:text-white disabled:opacity-30 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>

            <span className="text-[11px] text-stone-500 font-mono">
              Step {TABS.findIndex((t) => t.id === activeTab) + 1} of 6
            </span>

            <button
              onClick={() => {
                const curIdx = TABS.findIndex((t) => t.id === activeTab);
                if (curIdx < TABS.length - 1) setActiveTab(TABS[curIdx + 1].id as StudioTab);
                else onOpenExport();
              }}
              className="px-4 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <span>{activeTab === 'lighting' ? 'Review & Export' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Central Unobstructed Three.js 3D Viewport */}
        <div className="flex-1 min-w-0 relative h-[480px] lg:h-full min-h-0 bg-stone-950 flex flex-col overflow-hidden">
          <LithophaneViewer
            lithophaneGeometry={lithophaneGeometry}
            baseGeometry={baseGeometry}
            frameGeometry={frameGeometry}
            shape={project.shape}
            lighting={project.lighting}
            explodedProgress={explodedProgress}
            onSnapshotReady={onSnapshotCaptured}
            processedCanvas={processedCanvas}
          />
        </div>
      </div>

      {/* Photo Editor Modal */}
      {editorModalOpen && (
        <PhotoEditorModal
          photo={project.photos[editingPhotoIndex]}
          isOpen={editorModalOpen}
          onClose={() => setEditorModalOpen(false)}
          onSave={handleSavePhotoAdjustments}
        />
      )}
    </div>
  );
};
