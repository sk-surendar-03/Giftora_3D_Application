import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Download, FileArchive, FileJson, Upload, XCircle } from 'lucide-react';
import type { BuildBedPreset, CostEstimate, DesignConfig, FilamentType, ValidationReport } from '../types/design';
import type { GeneratedAssembly } from '../geometry/standBuilder';
import { FILAMENT_PROFILES } from '../core/estimation';
import { buildSafeFilename } from '../geometry/stlExporter';
import { useAddStandToCart, PHASE_LABELS } from '../../standDesign/useAddStandToCart.js';
import { computeStandPriceCents, formatRupees } from '../../standDesign/standPricing.js';
import { useAuth } from '../../auth/useAuth.js';

interface StudioRightPanelProps {
  config: DesignConfig;
  assembly: GeneratedAssembly;
  validation: ValidationReport;
  estimate: CostEstimate;
  isExportingZip: boolean;
  onChangePrint: (updater: (prev: DesignConfig['print']) => DesignConfig['print']) => void;
  onDownloadSingleStl: () => void;
  onDownloadMultiPartZip: () => void;
  onDownloadSinglePartStl: (partId: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

export const StudioRightPanel: React.FC<StudioRightPanelProps> = ({
  config, assembly, validation, estimate, isExportingZip,
  onChangePrint, onDownloadSingleStl, onDownloadMultiPartZip,
  onDownloadSinglePartStl, onExportJson, onImportJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addToCart, phase, error: cartError, added, busy: cartBusy } = useAddStandToCart();
  const [quantity, setQuantity] = useState(1);

  const { dimensions, bedLimit, fitsBed, issues, validForExport } = validation;
  const activeProfile = FILAMENT_PROFILES[config.print.filament];

  const shippingMethod = { name: 'standard', priceCents: 5000 };
  const volumeCm3 = assembly?.solidVolumeCm3 ?? 0;
  const standPriceCents = computeStandPriceCents(config.category, volumeCm3);
  const totalCents = standPriceCents * quantity + shippingMethod.priceCents;

  async function handleAddStandToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/customise/stand' } });
      return;
    }
    if (!validForExport) return;
    try {
      await addToCart({
        design: config,
        assembly,
        quantity,
        shippingMethod,
        capturePreview: null,
      });
    } catch (err) {
      // error state is handled by the hook
    }
  }

  return (
    <aside aria-label="Dimensions, print checks, and STL export" className="flex flex-col h-full bg-surface overflow-y-auto custom-scrollbar p-4 space-y-5">
      
      {/* 1. Model Dimensions */}
      <section className="space-y-2.5 pb-4 border-b border-line">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-bold tracking-wider text-accent uppercase">Model Dimensions</h3>
          <span className={`text-[11px] font-medium inline-flex items-center gap-1 ${fitsBed ? 'text-[#17683f]' : 'text-danger'}`}>
            {fitsBed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {fitsBed ? 'Fits Print Bed' : 'Exceeds Bed'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-control bg-alt border border-line/50">
            <div className="text-[10px] text-muted">Width (X)</div>
            <div className="text-sm font-mono font-semibold text-ink">{dimensions.width.toFixed(1)} mm</div>
          </div>
          <div className="p-2 rounded-control bg-alt border border-line/50">
            <div className="text-[10px] text-muted">Depth (Y)</div>
            <div className="text-sm font-mono font-semibold text-ink">{dimensions.depth.toFixed(1)} mm</div>
          </div>
          <div className="p-2 rounded-control bg-alt border border-line/50">
            <div className="text-[10px] text-muted">Height (Z)</div>
            <div className="text-sm font-mono font-semibold text-ink">{dimensions.height.toFixed(1)} mm</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted font-mono bg-soft p-2 rounded">
          <span>Volume: {estimate.solidVolumeCm3.toFixed(1)} cm3</span>
          <span>Triangles: {assembly.triangleCount.toLocaleString()}</span>
        </div>
      </section>

      {/* 2. Printability Checks */}
      <section className="space-y-3 pb-4 border-b border-line">
        <h3 className="text-[12px] font-bold tracking-wider text-accent uppercase">Printability and Fit</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-muted mb-1">Build Plate Preset</label>
            <select value={config.print.bedPreset} onChange={(e) => onChangePrint((p) => ({ ...p, bedPreset: e.target.value as BuildBedPreset }))} className="w-full h-[30px] px-2 text-xs rounded-control border border-line bg-surface text-ink focus:border-accent">
              <option value="180x180">180x180</option>
              <option value="220x220">220x220</option>
              <option value="256x256">256x256</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted mb-1">Min Wall (mm)</label>
            <input type="number" min={1.2} max={6} step={0.2} value={config.print.minWallThickness} onChange={(e) => onChangePrint((p) => ({ ...p, minWallThickness: Math.max(1.2, parseFloat(e.target.value) || 2.4) }))} className="w-full h-[30px] px-2 text-xs font-mono rounded-control border border-line bg-surface text-ink focus:border-accent" />
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="flex items-start gap-2 p-2 rounded-control bg-[#e3f4ea]/20 border border-[#17683f]/30 text-[11px] text-[#17683f]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div><div className="font-semibold">All Print Checks Passed</div><p className="opacity-90">Manifold solid rests flat with safe wall thickness.</p></div>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue) => (
              <div key={issue.id} className={`p-2 rounded-control border text-[11px] space-y-1 ${issue.severity === 'error' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-amber-500/10 border-amber-500/30 text-amber-600'}`}>
                <div className="flex items-center gap-1.5 font-semibold">{issue.severity === 'error' ? <XCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}<span>{issue.title}</span></div>
                <p className="opacity-90">{issue.detail}</p>
                <p className="font-medium">Fix: {issue.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Material Profile */}
      <section className="space-y-3 pb-4 border-b border-line">
        <h3 className="text-[12px] font-bold tracking-wider text-accent uppercase">Filament Estimator</h3>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-control bg-alt border border-line/50">
          {(['PLA', 'PETG', 'ABS'] as FilamentType[]).map((mat) => (
            <button key={mat} onClick={() => onChangePrint((p) => ({ ...p, filament: mat }))} className={`py-1 text-xs font-semibold rounded-control transition-colors ${config.print.filament === mat ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-ink'}`}>{mat}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-muted mb-1">Layer Height</label>
            <select value={config.print.layerHeight} onChange={(e) => onChangePrint((p) => ({ ...p, layerHeight: parseFloat(e.target.value) as any }))} className="w-full h-[30px] px-2 text-xs font-mono rounded-control border border-line bg-surface text-ink focus:border-accent">
              <option value={0.12}>0.12 mm</option>
              <option value={0.16}>0.16 mm</option>
              <option value={0.2}>0.20 mm</option>
              <option value={0.28}>0.28 mm</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted mb-1">Infill ({config.print.infillPercent}%)</label>
            <input type="range" min={10} max={100} step={5} value={config.print.infillPercent} onChange={(e) => onChangePrint((p) => ({ ...p, infillPercent: parseInt(e.target.value, 10) }))} className="w-full mt-2 accent-[var(--color-accent,#D9AE4E)]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 rounded-control bg-alt border border-line/50">
            <div className="text-[10px] text-muted">Mass</div>
            <div className="text-xs font-mono font-semibold text-ink">{estimate.weightGrams} g</div>
          </div>
          <div className="p-2 rounded-control bg-alt border border-line/50">
            <div className="text-[10px] text-muted">Time</div>
            <div className="text-xs font-mono font-semibold text-ink">~{estimate.formattedPrintTime}</div>
          </div>
        </div>
      </section>

      {/* 4. Export Center */}
      <section className="space-y-3 pb-4 border-b border-line">
        <h3 className="text-[12px] font-bold tracking-wider text-accent uppercase">Export Center</h3>
        <div className="text-[10px] font-mono text-muted truncate" title={buildSafeFilename(config)}>File: {buildSafeFilename(config)}.stl</div>
        
        <button disabled={!validForExport} onClick={onDownloadSingleStl} className="w-full py-2.5 rounded-control text-[13px] font-bold inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:bg-soft disabled:text-muted text-on-accent transition-colors">
          <Download className="w-4 h-4" /> <span>Download Binary STL</span>
        </button>

        <button disabled={!validForExport || isExportingZip} onClick={onDownloadMultiPartZip} className="w-full py-2 rounded-control text-[12px] font-semibold inline-flex items-center justify-center gap-2 border border-line hover:bg-soft disabled:opacity-50 text-ink transition-colors">
          <FileArchive className="w-4 h-4" /> <span>{isExportingZip ? 'Bundling ZIP...' : `Multi-Part ZIP (${assembly.parts.length} STLs)`}</span>
        </button>

        {assembly.parts.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <span className="block text-[10px] font-medium text-muted">Individual Parts</span>
            <div className="space-y-1">
              {assembly.parts.map((part) => (
                <button key={part.id} disabled={!validForExport} onClick={() => onDownloadSinglePartStl(part.id)} className="w-full flex items-center justify-between px-2 py-1 text-[11px] rounded border border-line hover:bg-soft text-ink transition-colors">
                  <span className="truncate">{part.name}</span><Download className="w-3 h-3 text-muted shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
          <button onClick={onExportJson} className="py-1.5 rounded-control text-[11px] font-medium border border-line hover:bg-soft inline-flex items-center justify-center gap-1.5 text-ink transition-colors">
            <FileJson className="w-3.5 h-3.5" /> <span>Save JSON</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="py-1.5 rounded-control text-[11px] font-medium border border-line hover:bg-soft inline-flex items-center justify-center gap-1.5 text-ink transition-colors">
            <Upload className="w-3.5 h-3.5" /> <span>Load JSON</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportJson(f); e.target.value = ''; }} />
        </div>
      </section>

      {/* 5. Add to Cart */}
      <section className="space-y-3 pb-6">
        <h3 className="text-[12px] font-bold tracking-wider text-accent uppercase">Order This Stand</h3>

        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted">Quantity</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded border border-line bg-surface text-ink hover:bg-soft">-</button>
            <span className="w-8 text-center font-mono font-semibold text-ink">{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(10, q + 1))} className="w-8 h-8 rounded border border-line bg-surface text-ink hover:bg-soft">+</button>
          </div>
        </div>

        <div className="rounded bg-alt p-2.5 space-y-1 text-[11px]">
          <div className="flex justify-between text-muted"><span>Base ({config.category})</span><span className="font-mono">{formatRupees(computeStandPriceCents(config.category, 0))}</span></div>
          <div className="flex justify-between text-muted"><span>Volume ({volumeCm3.toFixed(1)} cm3 x 100p)</span><span className="font-mono">{formatRupees(Math.round(volumeCm3 * 100))}</span></div>
          <div className="flex justify-between text-muted"><span>Shipping</span><span className="font-mono">{formatRupees(shippingMethod.priceCents)}</span></div>
          <div className="flex justify-between pt-1.5 mt-1.5 border-t border-line/50 text-ink font-semibold"><span>Total</span><span className="font-mono">{formatRupees(totalCents)}</span></div>
        </div>

        {added && (
          <p className="text-[11px] font-semibold text-[#17683f] bg-[#e3f4ea] px-2.5 py-2 rounded">
            Added to cart. <Link to="/cart" className="underline">View cart</Link>
          </p>
        )}
        {cartError && (
          <p className="text-[11px] text-danger bg-danger/10 px-2.5 py-2 rounded">{cartError}</p>
        )}

        <button
          onClick={handleAddStandToCart}
          disabled={cartBusy || !validForExport}
          className="w-full py-3 rounded-control text-[13px] font-bold bg-accent hover:bg-accent/90 disabled:bg-soft disabled:text-muted text-on-accent transition-colors"
        >
          {cartBusy ? (PHASE_LABELS[phase] || 'Working...') : ('Add to Cart - ' + formatRupees(totalCents))}
        </button>

        {!validForExport && (
          <p className="text-[10px] text-muted text-center">Resolve printability errors before ordering.</p>
        )}
      </section>
    </aside>
  );
};