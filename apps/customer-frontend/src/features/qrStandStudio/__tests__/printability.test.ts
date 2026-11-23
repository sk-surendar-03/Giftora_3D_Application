import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesignFromTemplate } from '../data/templates';
import {
  clampDimensions,
  evaluatePrintability,
  materialDensityGcm3,
  validateDimensions,
} from '../core/printability';

test('validateDimensions detects invalid dimensions without silently mutating user input', () => {
  const design = createDesignFromTemplate('classic_upright');
  const invalidDims = {
    ...design.dimensions,
    widthMm: 10, // too narrow for classic stand
    plateThicknessMm: 1.0, // too thin
    qrReliefDepthMm: 1.5, // deeper than plate
  };

  const validation = validateDimensions(invalidDims, 'classic_upright');
  assert.equal(validation.isValid, false);
  assert.ok(validation.errors.some((e) => e.includes('Width (10 mm)')));
  assert.ok(validation.errors.some((e) => e.includes('Plate thickness (1 mm)')));
  assert.ok(validation.errors.some((e) => e.includes('QR relief depth (1.5 mm)')));
});

test('clampDimensions provides safe baseline bounds when required', () => {
  const design = createDesignFromTemplate('classic_upright');
  const clamped = clampDimensions(
    {
      ...design.dimensions,
      widthMm: 5,
      heightMm: 1000,
      cornerRadiusMm: 500,
      plateThicknessMm: 0.5,
      qrReliefDepthMm: 10,
    },
    'classic_upright'
  );

  assert.equal(clamped.widthMm, 55);
  assert.equal(clamped.heightMm, 280);
  assert.ok(clamped.cornerRadiusMm <= Math.floor(55 * 0.45));
  assert.ok(clamped.plateThicknessMm >= 2.2);
  assert.ok(clamped.qrReliefDepthMm <= clamped.plateThicknessMm - 1.2);
});

test('evaluatePrintability computes volume, filament weight, and warns on oversize QR', () => {
  const design = createDesignFromTemplate('angled_desk');
  design.printingMode = 'inlay';
  const report = evaluatePrintability(design);

  assert.ok(report.estimatedVolumeCm3 > 10, 'Estimated volume > 10 cm³');
  assert.ok(report.estimatedFilamentGrams > 5, 'Estimated filament > 5 grams');
  assert.ok(report.estimatedPrintTimeMinutes >= 15, 'Print time estimate >= 15 mins');
  assert.ok(report.qrModuleSizeMm > 1.0, 'Module size > 1.0 mm for default stand');
  assert.equal(report.suggestedSettings.nozzleDiameterMm, 0.4);

  // Oversize QR warning
  const oversizeDesign = createDesignFromTemplate('classic_upright');
  oversizeDesign.qrCodes[0].sizeMm = 120; // exceeds 96mm stand width
  const overReport = evaluatePrintability(oversizeDesign);
  assert.ok(overReport.warnings.some((w) => w.severity === 'error'));

  // Density helper
  assert.equal(materialDensityGcm3('pla'), 1.24);
  assert.equal(materialDensityGcm3('petg'), 1.27);
});
