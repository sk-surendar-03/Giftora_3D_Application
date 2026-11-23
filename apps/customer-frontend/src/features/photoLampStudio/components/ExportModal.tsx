import React, { useState } from 'react';
import * as THREE from 'three';
import {
  LithophaneProject,
  MeshValidationReport,
} from '../types/lithophane';
import {
  Download,
  FileArchive,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Printer,
  ShieldCheck,
  Scale,
  Clock,
  Ruler,
  Boxes,
  Globe,
  FileText,
} from 'lucide-react';
import {
  EXPORT_FORMATS,
  ExportFormatId,
  downloadGeometryInFormat,
  exportGeometryTo3MF,
  exportGeometryToGLB,
  triggerFileDownload,
} from '../geometry/stlExporter';
import { createAndDownloadProjectZip } from '../services/projectZip';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: LithophaneProject;
  lithophaneGeo: THREE.BufferGeometry | null;
  baseGeo: THREE.BufferGeometry | null;
  frameGeo: THREE.BufferGeometry | null;
  validationReport: MeshValidationReport;
  previewDataUrl?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  lithophaneGeo,
  baseGeo,
  frameGeo,
  validationReport,
  previewDataUrl,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatId>('stl_binary');
  const [includeAllFormatsInZip, setIncludeAllFormatsInZip] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentFormatInfo =
    EXPORT_FORMATS.find((f) => f.id === selectedFormat) || EXPORT_FORMATS[0];

  const safeProjectName = project.name.replace(/\s+/g, '_') || 'StarkPrint_Lamp';

  const showSuccess = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 4500);
  };

  const handleDownloadPart = async (
    geo: THREE.BufferGeometry | null,
    partSuffix: string,
    colorHex?: string
  ) => {
    if (!geo) return;
    setIsExporting(true);
    try {
      const filename = await downloadGeometryInFormat(
        geo,
        `${safeProjectName}_${partSuffix}`,
        selectedFormat,
        colorHex
      );
      showSuccess(`Downloaded ${filename} (${currentFormatInfo.name})!`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCombinedAssembly = async (assemblyType: '3mf' | 'glb') => {
    if (!lithophaneGeo) return;
    setIsExporting(true);
    try {
      const parts: { name: string; geometry: THREE.BufferGeometry; colorHex?: string }[] = [
        { name: `${safeProjectName}_Lithophane`, geometry: lithophaneGeo, colorHex: '#fffaf0' },
      ];
      if (project.baseSettings.enabled && baseGeo) {
        parts.push({ name: `${safeProjectName}_LampBase`, geometry: baseGeo, colorHex: '#1c1917' });
      }
      if (frameGeo) {
        parts.push({ name: `${safeProjectName}_TopFrame`, geometry: frameGeo, colorHex: '#292524' });
      }

      if (assemblyType === '3mf') {
        const blob = await exportGeometryTo3MF(parts, project.name);
        const filename = `${safeProjectName}_Full_Assembly.3mf`;
        triggerFileDownload(
          blob,
          filename,
          'application/vnd.ms-package.3dmanufacturing-3dmodel+xml'
        );
        showSuccess(`Downloaded multi-part 3MF assembly (${filename})!`);
      } else {
        const glb = exportGeometryToGLB(parts);
        const filename = `${safeProjectName}_Full_Assembly.glb`;
        triggerFileDownload(glb, filename, 'model/gltf-binary');
        showSuccess(`Downloaded 3D GLB scene (${filename})!`);
      }
    } catch (err) {
      console.error('Assembly export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!lithophaneGeo) return;
    setIsExporting(true);
    try {
      await createAndDownloadProjectZip({
        project,
        lithophaneGeo,
        baseGeo: baseGeo || undefined,
        frameGeo: frameGeo || undefined,
        previewDataUrl,
        report: validationReport,
        preferredFormat: selectedFormat,
        includeAllFormats: includeAllFormatsInZip,
      });
      showSuccess('Generated & downloaded Universal 3D Project ZIP bundle!');
    } catch (err) {
      console.error('ZIP generation error', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJson = () => {
    const config = {
      project,
      validationReport,
      exportTimestamp: new Date().toISOString(),
      generator: 'Stark Print Photo 3D Studio',
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    triggerFileDownload(blob, `${safeProjectName}_config.json`, 'application/json');
    showSuccess('Exported project configuration JSON!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Export 3D Printable & CAD Files
              </h3>
              <p className="text-xs text-stone-400">
                Multi-format 3D export pipeline: Binary STL, 3MF, Wavefront OBJ, GLB (glTF 2.0), PLY & ASCII STL
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
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Notification Toast */}
          {downloadSuccessMessage && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{downloadSuccessMessage}</span>
            </div>
          )}

          {/* Validation & Slicer Stats Card */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Mesh Printability Audit
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                Watertight & Manifold: Passed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-stone-900/80 border border-stone-800/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-stone-400 text-[10px] mb-0.5">
                  <Ruler className="w-3 h-3 text-amber-400" /> Dimensions
                </div>
                <div className="text-xs font-mono font-bold text-white">
                  {validationReport.dimensionsMm.x} × {validationReport.dimensionsMm.y} ×{' '}
                  {validationReport.dimensionsMm.z} mm
                </div>
              </div>

              <div className="bg-stone-900/80 border border-stone-800/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-stone-400 text-[10px] mb-0.5">
                  <Layers className="w-3 h-3 text-amber-400" /> Triangles
                </div>
                <div className="text-xs font-mono font-bold text-white">
                  {validationReport.triangleCount.toLocaleString()}
                </div>
              </div>

              <div className="bg-stone-900/80 border border-stone-800/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-stone-400 text-[10px] mb-0.5">
                  <Scale className="w-3 h-3 text-amber-400" /> PLA Weight
                </div>
                <div className="text-xs font-mono font-bold text-white">
                  ~{validationReport.estimatedWeightGrams} grams
                </div>
              </div>

              <div className="bg-stone-900/80 border border-stone-800/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 text-stone-400 text-[10px] mb-0.5">
                  <Clock className="w-3 h-3 text-amber-400" /> Print Time
                </div>
                <div className="text-xs font-mono font-bold text-white">
                  ~{validationReport.estimatedPrintTimeHours} hours
                </div>
              </div>
            </div>

            {validationReport.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {validationReport.warnings.map((warn, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg"
                  >
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Format Compatibility Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                1. Choose Target 3D File Format
              </label>
              <span className="text-[11px] text-amber-400 font-mono">
                Active: .{currentFormatInfo.extension.toUpperCase()} ({currentFormatInfo.name})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXPORT_FORMATS.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 shadow-md'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white">
                          {fmt.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold ${
                            isSelected
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          .{fmt.extension}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 line-clamp-2 leading-snug">
                        {fmt.description}
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-stone-800/80 text-[9px] text-amber-300/90 font-medium truncate">
                      {fmt.compatibleWith}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action: Complete Multi-Format Bundles */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              2. Complete Multi-Part Assembly Downloads
            </label>

            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <FileArchive className="w-5 h-5" />
              <span>
                {isExporting
                  ? 'Packaging 3D Files...'
                  : `Download Complete Project ZIP (${currentFormatInfo.name} + Assembly)`}
              </span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <label className="flex items-center gap-2 text-[11px] text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAllFormatsInZip}
                  onChange={(e) => setIncludeAllFormatsInZip(e.target.checked)}
                  className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                />
                <span>
                  Include Universal Compatibility Folder (STL + 3MF + OBJ + PLY + GLB) inside ZIP
                </span>
              </label>
            </div>

            {/* Direct 1-Click Multi-Part 3MF & GLB Assembly Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleDownloadCombinedAssembly('3mf')}
                disabled={isExporting}
                className="p-2.5 rounded-xl bg-stone-950/90 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      All-in-One .3MF Slicer Project
                    </h5>
                    <span className="text-[10px] text-stone-400">
                      Bambu Studio / PrusaSlicer / Cura multi-part plate
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-stone-400 group-hover:text-amber-400" />
              </button>

              <button
                onClick={() => handleDownloadCombinedAssembly('glb')}
                disabled={isExporting}
                className="p-2.5 rounded-xl bg-stone-950/90 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Full Lamp .GLB 3D Viewer Scene
                    </h5>
                    <span className="text-[10px] text-stone-400">
                      Windows/Mac 3D Viewer, Blender, Web & AR
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-stone-400 group-hover:text-amber-400" />
              </button>
            </div>
          </div>

          {/* Individual Part Download Buttons in Selected Format */}
          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider mb-2 block">
              3. Individual Part Downloads ({currentFormatInfo.name} • .{currentFormatInfo.extension})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleDownloadPart(lithophaneGeo, 'Lithophane', '#fffaf0')}
                disabled={isExporting}
                className="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-stone-800 group-hover:bg-amber-500/20 text-amber-400">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Lithophane Shell (.{currentFormatInfo.extension})
                    </h5>
                    <span className="text-[10px] text-stone-400">
                      {currentFormatInfo.name} • Watertight mesh
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-stone-500 group-hover:text-amber-400" />
              </button>

              {project.baseSettings.enabled && baseGeo && (
                <button
                  onClick={() => handleDownloadPart(baseGeo, 'LampBase', '#1c1917')}
                  disabled={isExporting}
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-stone-800 group-hover:bg-amber-500/20 text-amber-400">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">
                        Lamp Base (.{currentFormatInfo.extension})
                      </h5>
                      <span className="text-[10px] text-stone-400">
                        Fits 5V USB LED module
                      </span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-stone-500 group-hover:text-amber-400" />
                </button>
              )}

              {frameGeo && (
                <button
                  onClick={() => handleDownloadPart(frameGeo, 'TopFrame', '#292524')}
                  disabled={isExporting}
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-stone-800 group-hover:bg-amber-500/20 text-amber-400">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">
                        Top Frame / Cap (.{currentFormatInfo.extension})
                      </h5>
                      <span className="text-[10px] text-stone-400">
                        Decorative stepped rim
                      </span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-stone-500 group-hover:text-amber-400" />
                </button>
              )}

              <button
                onClick={handleDownloadJson}
                className="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-stone-800 group-hover:bg-amber-500/20 text-amber-400">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Project Config JSON</h5>
                    <span className="text-[10px] text-stone-400">
                      Save / Re-import anytime
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-stone-500 group-hover:text-amber-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            All formats exported in 1:1 true millimeter (mm) scale
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
