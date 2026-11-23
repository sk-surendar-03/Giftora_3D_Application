import React, { useMemo } from 'react';
import type {
  CameraPreset,
  ErrorCorrectionLevel,
  PrintingMode,
  QRType,
  StandDesign,
  TemplateId,
} from '../types/studio';
import { TEMPLATES } from '../data/templates';
import { validateQRConfig } from '../core/qrGenerator';
import { validateCenterLogo } from '../core/qrLogoValidator';
import { evaluatePrintability } from '../core/printability';

interface QRStandCustomizerProps {
  design: StandDesign;
  onChange: (updated: StandDesign) => void;
  cameraPreset: CameraPreset;
  onCameraChange: (preset: CameraPreset) => void;
  wireframe: boolean;
  onWireframeToggle: () => void;
}

export const QRStandCustomizer: React.FC<QRStandCustomizerProps> = ({
  design,
  onChange,
  cameraPreset,
  onCameraChange,
  wireframe,
  onWireframeToggle,
}) => {
  const primaryQr = design.qrCodes[0];

  const qrValidation = useMemo(() => {
    if (!primaryQr) return null;
    return validateQRConfig(primaryQr, design.colors.standColor);
  }, [primaryQr, design.colors.standColor]);

  const logoReport = useMemo(() => {
    if (!primaryQr) return null;
    return validateCenterLogo(primaryQr, design.logo);
  }, [primaryQr, design.logo]);

  const printability = useMemo(() => {
    return evaluatePrintability(design);
  }, [design]);

  const updateQrFields = (patch: Partial<typeof primaryQr.fields>) => {
    if (!primaryQr) return;
    const updatedQr = {
      ...primaryQr,
      fields: { ...primaryQr.fields, ...patch },
    };
    onChange({
      ...design,
      qrCodes: [updatedQr, ...design.qrCodes.slice(1)],
      updatedAt: Date.now(),
    });
  };

  const updateQrConfig = (patch: Partial<typeof primaryQr>) => {
    if (!primaryQr) return;
    const updatedQr = {
      ...primaryQr,
      ...patch,
    };
    onChange({
      ...design,
      qrCodes: [updatedQr, ...design.qrCodes.slice(1)],
      updatedAt: Date.now(),
    });
  };

  const updateTemplate = (templateId: TemplateId) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    onChange({
      ...design,
      templateId,
      name: tpl.name,
      dimensions: { ...tpl.defaultDimensions },
      updatedAt: Date.now(),
    });
  };

  const updatePrintingMode = (mode: PrintingMode) => {
    onChange({
      ...design,
      printingMode: mode,
      updatedAt: Date.now(),
    });
  };

  const updateLogo = (patch: Partial<typeof design.logo>) => {
    onChange({
      ...design,
      logo: { ...design.logo, ...patch },
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 text-slate-100 shadow-2xl">
      {/* Camera & Viewport Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Camera View:</span>
          {(['iso', 'front', 'side', 'top', 'back'] as CameraPreset[]).map((cam) => (
            <button
              key={cam}
              type="button"
              onClick={() => onCameraChange(cam)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                cameraPreset === cam
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cam.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onWireframeToggle}
          className={`px-3 py-1 text-xs rounded-md border font-medium transition-all ${
            wireframe
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          {wireframe ? 'Wireframe ON' : 'Solid Mesh'}
        </button>
      </div>

      {/* Template Archetype Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stand Archetype</label>
        <select
          value={design.templateId}
          onChange={(e) => updateTemplate(e.target.value as TemplateId)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.category})
            </option>
          ))}
        </select>
      </div>

      {/* Printing Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">3D Printing Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'raised', label: 'Raised (+Z)', desc: 'Fastest / Single-Color' },
              { id: 'recessed', label: 'Recessed (-Z)', desc: 'Debossed Negative Pockets' },
              { id: 'inlay', label: 'Dual-Color Inlay', desc: 'Flush Multi-Material' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => updatePrintingMode(m.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs text-center transition-all ${
                design.printingMode === m.id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>{m.label}</span>
              <span className="text-[10px] text-slate-500">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* QR Content & Payload Type */}
      {primaryQr && (
        <div className="flex flex-col gap-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">QR Code Content</span>
            <select
              value={primaryQr.type}
              onChange={(e) => updateQrConfig({ type: e.target.value as QRType })}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
            >
              <option value="url">Website URL</option>
              <option value="upi">UPI Digital Payment</option>
              <option value="wifi">Wi-Fi Connect</option>
              <option value="whatsapp">WhatsApp Direct</option>
              <option value="instagram">Instagram Profile</option>
              <option value="google_review">Google Review</option>
              <option value="vcard">Contact Card (vCard)</option>
              <option value="menu">Digital Food Menu</option>
              <option value="email">Direct Email</option>
              <option value="phone">Direct Phone Call</option>
            </select>
          </div>

          {/* Dynamic Payload Form */}
          {primaryQr.type === 'url' && (
            <input
              type="url"
              placeholder="https://yourwebsite.com"
              value={primaryQr.fields.url}
              onChange={(e) => updateQrFields({ url: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
            />
          )}

          {primaryQr.type === 'upi' && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Merchant VPA (e.g. merchant@okaxis)"
                value={primaryQr.fields.upiVpa}
                onChange={(e) => updateQrFields({ upiVpa: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Payee Name"
                  value={primaryQr.fields.upiName}
                  onChange={(e) => updateQrFields({ upiName: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
                <input
                  type="number"
                  placeholder="Optional Amount (INR)"
                  value={primaryQr.fields.upiAmount}
                  onChange={(e) => updateQrFields({ upiAmount: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>
          )}

          {primaryQr.type === 'wifi' && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Network Name (SSID)"
                value={primaryQr.fields.wifiSsid}
                onChange={(e) => updateQrFields({ wifiSsid: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
              <input
                type="text"
                placeholder="Password"
                value={primaryQr.fields.wifiPassword}
                onChange={(e) => updateQrFields({ wifiPassword: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>
          )}

          {primaryQr.type === 'whatsapp' && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="WhatsApp Phone with country code (+91...)"
                value={primaryQr.fields.whatsappPhone}
                onChange={(e) => updateQrFields({ whatsappPhone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
              <input
                type="text"
                placeholder="Pre-filled greeting message"
                value={primaryQr.fields.whatsappMessage}
                onChange={(e) => updateQrFields({ whatsappMessage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>
          )}

          {primaryQr.type === 'instagram' && (
            <input
              type="text"
              placeholder="@handle or full URL"
              value={primaryQr.fields.instagramHandle}
              onChange={(e) => updateQrFields({ instagramHandle: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
            />
          )}

          {primaryQr.type === 'google_review' && (
            <input
              type="text"
              placeholder="Place ID or Google Business Review URL"
              value={primaryQr.fields.googlePlaceId}
              onChange={(e) => updateQrFields({ googlePlaceId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
            />
          )}

          {/* Error Correction & Quiet Zone */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Error Correction</label>
              <select
                value={primaryQr.errorCorrection}
                onChange={(e) => updateQrConfig({ errorCorrection: e.target.value as ErrorCorrectionLevel })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
              >
                <option value="L">Level L (~7% recovery)</option>
                <option value="M">Level M (~15% recovery)</option>
                <option value="Q">Level Q (~25% recovery)</option>
                <option value="H">Level H (~30% recovery - Logo safe)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Quiet Zone (Modules)</label>
              <input
                type="number"
                min={2}
                max={8}
                value={primaryQr.quietZone}
                onChange={(e) => updateQrConfig({ quietZone: Math.max(2, parseInt(e.target.value, 10) || 4) })}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Center Logo Controls & Validation Section */}
      <div className="flex flex-col gap-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Optional Center Logo</span>
            <span className="text-[11px] text-slate-500">Requires scan verification & Level H recovery</span>
          </div>
          <button
            type="button"
            onClick={() => updateLogo({ enabled: !design.logo.enabled })}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              design.logo.enabled
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {design.logo.enabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {design.logo.enabled && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Logo Size (mm):</span>
              <span className="font-mono text-slate-200">{design.logo.sizeMm} mm</span>
            </div>
            <input
              type="range"
              min={10}
              max={28}
              value={design.logo.sizeMm}
              onChange={(e) => updateLogo({ sizeMm: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500"
            />

            {/* Logo Validation Safety Report */}
            {logoReport && (
              <div
                className={`p-3 rounded-lg text-xs flex flex-col gap-1 border ${
                  logoReport.isValid
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{logoReport.isValid ? '✓ Logo Geometry Safe' : '✗ Logo Validation Failed'}</span>
                  <span>Area: {logoReport.areaRatioPercent}% (Max 10%)</span>
                </div>
                {logoReport.issues.map((iss, i) => (
                  <p key={i} className="text-[11px] opacity-90">
                    • {iss.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real-Time Printability Summary */}
      <div className="flex flex-col gap-2 p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
        <span className="font-semibold uppercase tracking-wider text-slate-400">Printability & Scan Audit</span>
        <div className="grid grid-cols-2 gap-2 text-slate-300">
          <div>
            QR Module Width: <span className="font-mono font-bold text-amber-400">{qrValidation?.moduleSizeMm ?? 1.5} mm</span>
          </div>
          <div>
            Contrast Ratio: <span className="font-mono font-bold text-cyan-400">{qrValidation?.contrastRatio ?? 21}:1</span>
          </div>
          <div>
            Estimated Volume: <span className="font-mono">{printability.estimatedVolumeCm3} cm³</span>
          </div>
          <div>
            Filament Weight: <span className="font-mono">{printability.estimatedFilamentGrams} g</span>
          </div>
        </div>

        {printability.warnings.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {printability.warnings.map((w, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-[11px] border ${
                  w.severity === 'error'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : 'bg-amber-950/40 border-amber-800 text-amber-300'
                }`}
              >
                <strong>{w.title}:</strong> {w.detail}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
