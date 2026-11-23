import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCenterLogoPunchout,
  calculateBlockCodewordDamage,
  validateCenterLogo,
} from '../core/qrLogoValidator';
import { createDesignFromTemplate } from '../data/templates';
import type { LogoConfig, QRCodeConfig } from '../types/studio';

test('validateCenterLogo rejects center logo when Error Correction is not H', () => {
  const design = createDesignFromTemplate('classic_upright');
  const qr: QRCodeConfig = { ...design.qrCodes[0], errorCorrection: 'M' };
  const logo: LogoConfig = { ...design.logo, enabled: true, sizeMm: 10 };

  const report = validateCenterLogo(qr, logo);
  assert.equal(report.isValid, false);
  assert.equal(report.safeToRender, false);
  assert.ok(report.issues.some((i) => i.code === 'INSUFFICIENT_ERROR_CORRECTION'));
});

test('validateCenterLogo passes when Error Correction is H, Version >= 3, and area <= 10%', () => {
  const design = createDesignFromTemplate('classic_upright');
  // 62mm stand with 10mm logo covers ~4.5% of 33x33 matrix (Version 4-H)
  const qr: QRCodeConfig = { ...design.qrCodes[0], errorCorrection: 'H', sizeMm: 62 };
  const logo: LogoConfig = { ...design.logo, enabled: true, sizeMm: 10 };

  const report = validateCenterLogo(qr, logo);
  assert.equal(report.isValid, true);
  assert.equal(report.safeToRender, true);
  assert.ok(report.areaRatioPercent <= 10.0, 'Area ratio must not exceed conservative 10% limit');
  assert.ok(report.blockAnalysis.every((b) => b.isWithinSafeBudget), 'All RS blocks must be within safe budget');
  assert.ok(report.punchoutBox !== undefined);
  assert.ok(report.issues.some((i) => i.code === 'SCAN_RELIABILITY_DISCLAIMER'));
});

test('validateCenterLogo rejects logo exceeding conservative 10% area ceiling', () => {
  const design = createDesignFromTemplate('classic_upright');
  // 18mm logo on 62mm stand covers ~13.2% of matrix (exceeds 10%)
  const qr: QRCodeConfig = { ...design.qrCodes[0], errorCorrection: 'H', sizeMm: 62 };
  const logo: LogoConfig = { ...design.logo, enabled: true, sizeMm: 18 };

  const report = validateCenterLogo(qr, logo);
  assert.equal(report.isValid, false);
  assert.ok(
    report.issues.some((i) => i.code === 'LOGO_EXCEEDS_AREA_LIMIT'),
    'Should reject logo exceeding 10% area limit'
  );
});

test('calculateBlockCodewordDamage detects when block damage exceeds Reed-Solomon budget', () => {
  // In Version 4-H (33x33, 4 blocks, theoretical budget = 8 per block)
  // An oversized 15x15 module aperture damages 11-12 codewords in Block 2
  const box = { minRow: 9, maxRow: 23, minCol: 9, maxCol: 23 };
  const result = calculateBlockCodewordDamage(4, 'H', box);

  const block2 = result.blockAnalysis[2];
  assert.ok(block2.damagedCodewords > block2.theoreticalBudget, 'Block 2 damage should exceed theoretical budget');
  assert.equal(block2.isWithinSafeBudget, false);
});

test('validateCenterLogo rejects center logo on Version 1 or 2', () => {
  const design = createDesignFromTemplate('mini_keychain');
  // Short URL on small keychain drops to Version 1 (21x21)
  const qr: QRCodeConfig = {
    ...design.qrCodes[0],
    errorCorrection: 'H',
    sizeMm: 34,
    fields: { ...design.qrCodes[0].fields, url: 'https://j3d.in' },
  };
  const logo: LogoConfig = { ...design.logo, enabled: true, sizeMm: 8 };

  const report = validateCenterLogo(qr, logo);
  assert.equal(report.isValid, false);
  assert.ok(
    report.issues.some((i) => i.code === 'VERSION_TOO_LOW_FOR_LOGO'),
    'Must reject center logo on QR versions < 3'
  );
});

test('applyCenterLogoPunchout clears central modules leaving clean aperture', () => {
  const size = 33;
  const original = Array.from({ length: size }, () => new Array<boolean>(size).fill(true));
  const box = { minRow: 13, maxRow: 19, minCol: 13, maxCol: 19 };

  const punched = applyCenterLogoPunchout(original, box);
  for (let r = 13; r <= 19; r++) {
    for (let c = 13; c <= 19; c++) {
      assert.equal(punched[r][c], false, `Module at (${r},${c}) should be cleared for logo`);
    }
  }
  // Peripheral modules remain unaffected
  assert.equal(punched[0][0], true);
  assert.equal(punched[32][32], true);
});
