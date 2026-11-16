import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DesignConfig,
  DesignThemeId,
  ViewportOptions,
} from '../types/design';
import { createDefaultDesign, DESIGN_THEMES, getBedDimensions } from '../core/defaults';
import { calculatePrintEstimate } from '../core/estimation';
import {
  encodeDesignToShareHash,
  parseProjectJson,
  randomizePrintableDesign,
  saveDesignToStorage,
  serializeProjectJson,
} from '../core/storage';
import { instantiateTemplate, TEMPLATE_LIBRARY } from '../core/templates';
import { validateDesignConfig } from '../core/validation';
import {
  buildStandAssembly,
  disposeAssembly,
  type GeneratedAssembly,
} from '../geometry/standBuilder';
import {
  buildMultiPartZipBlob,
  buildSafeFilename,
  downloadPartStl,
  downloadSingleSolidStl,
  triggerBlobDownload,
} from '../geometry/stlExporter';
import { StudioLeftPanel } from '../components/StudioLeftPanel';
import { StudioRightPanel } from '../components/StudioRightPanel';
import { StudioToolbar } from '../components/StudioToolbar';
import { StudioViewport, type StudioViewportHandle } from '../components/StudioViewport';
import { ViewportControlsBar } from '../components/ViewportControlsBar';

interface StudioPageProps {
  design: DesignConfig;
  darkMode: boolean;
  onUpdateDesign: (next: DesignConfig) => void;
  onToggleTheme: () => void;
  onNavigateSaved: () => void;
  onSavedListChange: () => void;
}

type MobileTab = 'customize' | 'viewport' | 'export';

export const StudioPage: React.FC<StudioPageProps> = ({
  design,
  darkMode,
  onUpdateDesign,
  onToggleTheme,
  onNavigateSaved,
  onSavedListChange,
}) => {
  const [history, setHistory] = useState<DesignConfig[]>([design]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('viewport');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [frameTrigger, setFrameTrigger] = useState(1);

  const [viewport, setViewport] = useState<ViewportOptions>({
    cameraPreset: 'iso',
    projection: 'perspective',
    showGrid: true,
    showBuildPlate: true,
    showDimensions: false,
    showPhoneMockup: false,
    showPensMockup: false,
    explodedAmount: 0,
  });

  const viewportRef = useRef<StudioViewportHandle | null>(null);
  const bannerTimerRef = useRef<number | null>(null);
  const prevCategoryRef = useRef(design.category);

  const flashBanner = useCallback((msg: string) => {
    setStatusBanner(msg);
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setStatusBanner(null), 3200);
  }, []);

  // Sync external template/saved loads into history cleanly
  useEffect(() => {
    setHistory((prev) => {
      if (prev[historyIndex]?.id === design.id && prev[historyIndex]?.updatedAt === design.updatedAt) {
        return prev;
      }
      return [design];
    });
    setHistoryIndex(0);
    if (prevCategoryRef.current !== design.category) {
      prevCategoryRef.current = design.category;
      setFrameTrigger((t) => t + 1);
    }
  }, [design.id, design.updatedAt]);

  // Debounce heavy CSG rebuilds slightly while sliders drag rapidly, while keeping UI instantaneous
  const [debouncedDesign, setDebouncedDesign] = useState<DesignConfig>(design);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedDesign(design);
    }, 35);
    return () => window.clearTimeout(timer);
  }, [design]);

  // Generate 3D manifold assembly and dispose previous GPU buffers safely
  const assemblyRef = useRef<GeneratedAssembly | null>(null);
  const assembly = useMemo(() => {
    const built = buildStandAssembly(debouncedDesign);
    const prev = assemblyRef.current;
    assemblyRef.current = built;
    if (prev && prev !== built) {
      // Defer disposal slightly so React Three Fiber renders new geometry before old is freed
      setTimeout(() => disposeAssembly(prev), 50);
    }
    return built;
  }, [debouncedDesign]);

  useEffect(() => {
    return () => {
      disposeAssembly(assemblyRef.current);
      assemblyRef.current = null;
    };
  }, []);

  // Auto-frame camera when category or primary model type switches
  useEffect(() => {
    if (prevCategoryRef.current !== design.category) {
      prevCategoryRef.current = design.category;
      setFrameTrigger((t) => t + 1);
    }
  }, [design.category]);

  const commitChange = useCallback(
    (updater: (prev: DesignConfig) => DesignConfig) => {
      const next = {
        ...updater(design),
        updatedAt: new Date().toISOString(),
      };
      onUpdateDesign(next);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const appended = [...sliced, next].slice(-30);
        setHistoryIndex(appended.length - 1);
        return appended;
      });
    },
    [design, historyIndex, onUpdateDesign]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIdx = historyIndex - 1;
    setHistoryIndex(nextIdx);
    onUpdateDesign(history[nextIdx]);
  }, [history, historyIndex, onUpdateDesign]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    setHistoryIndex(nextIdx);
    onUpdateDesign(history[nextIdx]);
  }, [history, historyIndex, onUpdateDesign]);

  // Keyboard Undo/Redo shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const validation = useMemo(
    () => validateDesignConfig(debouncedDesign, assembly.dimensions),
    [debouncedDesign, assembly.dimensions]
  );

  const estimate = useMemo(
    () => calculatePrintEstimate(assembly.solidVolumeCm3, debouncedDesign.print),
    [assembly.solidVolumeCm3, debouncedDesign.print]
  );

  const bedLimit = useMemo(
    () =>
      getBedDimensions(
        debouncedDesign.print.bedPreset,
        debouncedDesign.print.customBedX,
        debouncedDesign.print.customBedY,
        debouncedDesign.print.customBedZ
      ),
    [debouncedDesign.print]
  );

  const handleApplyTheme = (themeId: DesignThemeId) => {
    const theme = DESIGN_THEMES[themeId];
    commitChange((prev) => ({
      ...prev,
      phone: { ...prev.phone, cornerRadius: theme.recommendedCornerRadius },
      personalization: {
        ...prev.personalization,
        fontStyle: theme.recommendedFont,
        motif: theme.recommendedMotif,
      },
      appearance: {
        themeId,
        finish: theme.finish,
        colors: { ...theme.colors },
      },
    }));
    flashBanner(`Applied ${theme.label} theme`);
  };

  const handleApplyTemplate = (templateId: string) => {
    const tpl = TEMPLATE_LIBRARY.find((t) => t.id === templateId);
    if (!tpl) return;
    const instantiated = instantiateTemplate(tpl, design.print);
    onUpdateDesign(instantiated);
    setHistory([instantiated]);
    setHistoryIndex(0);
    setFrameTrigger((t) => t + 1);
    flashBanner(`Loaded "${tpl.name}"`);
  };

  const handleSave = () => {
    saveDesignToStorage(design);
    onSavedListChange();
    flashBanner('Saved to My Designs');
  };

  const handleDuplicate = () => {
    const copy: DesignConfig = {
      ...design,
      id: `design-${Date.now()}`,
      name: `${design.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    saveDesignToStorage(copy);
    onUpdateDesign(copy);
    onSavedListChange();
    flashBanner('Duplicated & saved');
  };

  const handleReset = () => {
    const fresh = createDefaultDesign(design.category, design.appearance.themeId);
    onUpdateDesign(fresh);
    setHistory([fresh]);
    setHistoryIndex(0);
    setFrameTrigger((t) => t + 1);
    flashBanner('Reset to category defaults');
  };

  const handleRandomize = () => {
    const rand = randomizePrintableDesign(design);
    commitChange(() => rand);
    setFrameTrigger((t) => t + 1);
    flashBanner(`Generated "${rand.name}"`);
  };

  const handleShareLink = async () => {
    const encoded = encodeDesignToShareHash(design);
    if (!encoded) {
      flashBanner('Design too large for URL sharing; use Save JSON.');
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?design=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      flashBanner('Share link copied to clipboard');
    } catch {
      window.history.replaceState(null, '', `?design=${encoded}`);
      flashBanner('Share URL updated in address bar');
    }
  };

  const handleCapturePreview = () => {
    const dataUrl = viewportRef.current?.capturePngDataUrl();
    if (!dataUrl) {
      flashBanner('Switch to 3D View to capture preview.');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${buildSafeFilename(design)}-preview.png`;
    a.click();
    flashBanner('Downloaded PNG preview');
  };

  const handleDownloadSingleStl = () => {
    if (!validation.validForExport) return;
    downloadSingleSolidStl(assembly, design);
    flashBanner('Binary STL downloaded');
  };

  const handleDownloadMultiPartZip = async () => {
    if (!validation.validForExport) return;
    setIsExportingZip(true);
    try {
      const blob = await buildMultiPartZipBlob(assembly, design, estimate, validation);
      triggerBlobDownload(blob, `${buildSafeFilename(design)}-multipart.zip`);
      flashBanner('Multi-part ZIP downloaded');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadSinglePartStl = (partId: string) => {
    const part = assembly.parts.find((p) => p.id === partId);
    if (!part || !validation.validForExport) return;
    downloadPartStl(part.geometry, design, part.id);
    flashBanner(`Downloaded ${part.name} STL`);
  };

  const handleExportJson = () => {
    const json = serializeProjectJson(design);
    const blob = new Blob([json], { type: 'application/json' });
    triggerBlobDownload(blob, `${buildSafeFilename(design)}.starkprint.json`);
    flashBanner('Project JSON exported');
  };

  const handleImportJson = async (file: File) => {
    const text = await file.text();
    const res = parseProjectJson(text);
    if (!res.ok) {
      flashBanner(res.error);
      return;
    }
    onUpdateDesign(res.design);
    setHistory([res.design]);
    setHistoryIndex(0);
    setFrameTrigger((t) => t + 1);
    flashBanner(`Imported "${res.design.name}"`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] min-h-[600px] overflow-hidden">
      <StudioToolbar
        designName={design.name}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        canExport={validation.validForExport}
        darkMode={darkMode}
        statusBanner={statusBanner}
        onRename={(name) => commitChange((prev) => ({ ...prev, name }))}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onDuplicate={handleDuplicate}
        onOpenSaved={onNavigateSaved}
        onReset={handleReset}
        onRandomize={handleRandomize}
        onShareLink={handleShareLink}
        onCapturePreview={handleCapturePreview}
        onToggleTheme={onToggleTheme}
        onDownloadStl={handleDownloadSingleStl}
      />

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden grid grid-cols-3 gap-1 p-1.5 bg-slate-100 dark:bg-[#0D1117] border-b border-slate-200 dark:border-slate-800">
        {(
          [
            { id: 'customize', label: 'Customize' },
            { id: 'viewport', label: '3D View' },
            { id: 'export', label: 'Checks & STL' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mobileTab === tab.id
                ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`${
            mobileTab === 'customize' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-[320px] xl:w-[340px] shrink-0 h-full overflow-hidden flex-col`}
        >
          <StudioLeftPanel
            config={design}
            svgError={assembly.svgError}
            onChange={commitChange}
            onApplyTheme={handleApplyTheme}
            onApplyTemplate={handleApplyTemplate}
          />
        </div>

        {/* Center 3D Viewport */}
        <div
          className={`${
            mobileTab === 'viewport' ? 'flex' : 'hidden'
          } lg:flex flex-1 relative h-full overflow-hidden`}
        >
          <StudioViewport
            ref={viewportRef}
            config={debouncedDesign}
            assembly={assembly}
            viewport={viewport}
            bedLimit={bedLimit}
            darkMode={darkMode}
            frameTrigger={frameTrigger}
          />
          <ViewportControlsBar
            viewport={viewport}
            hasPhone={assembly.phonePose.enabled}
            hasPens={assembly.penSlots.length > 0}
            hasMultipleParts={assembly.parts.length > 1}
            onChange={setViewport}
            onFitCamera={() => setFrameTrigger((t) => t + 1)}
          />
        </div>

        {/* Right Sidebar */}
        <div
          className={`${
            mobileTab === 'export' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-[310px] xl:w-[330px] shrink-0 h-full overflow-hidden flex-col`}
        >
          <StudioRightPanel
            config={debouncedDesign}
            assembly={assembly}
            validation={validation}
            estimate={estimate}
            isExportingZip={isExportingZip}
            onChangePrint={(updater) =>
              commitChange((prev) => ({ ...prev, print: updater(prev.print) }))
            }
            onDownloadSingleStl={handleDownloadSingleStl}
            onDownloadMultiPartZip={handleDownloadMultiPartZip}
            onDownloadSinglePartStl={handleDownloadSinglePartStl}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
          />
        </div>
      </div>
    </div>
  );
};
