import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import { createQRMatrix, type QRErrorCorrectionLevel } from '../core/qrCodeEngine';
import {
  buildQRPayload,
  generateQRMatrix,
  createDefaultQRFields,
} from '../core/qrGenerator';
import {
  calculateBlockCodewordDamage,
  validateCenterLogo,
  applyCenterLogoPunchout,
} from '../core/qrLogoValidator';
import type { QRCodeConfig, LogoConfig } from '../types/studio';

/**
 * Renders a boolean QR module matrix to an RGBA pixel buffer with a 4-module quiet zone.
 * Suitable for independent optical decoding with jsQR.
 */
function renderQRToRgba(
  modules: boolean[][],
  scale = 4,
  quietZone = 4
): { data: Uint8ClampedArray; width: number; height: number } {
  const size = modules.length;
  const totalDim = (size + quietZone * 2) * scale;
  const buffer = new Uint8ClampedArray(totalDim * totalDim * 4);

  // Background: white (255, 255, 255, 255)
  buffer.fill(255);

  // Dark modules: black (0, 0, 0, 255)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        const startY = (r + quietZone) * scale;
        const startX = (c + quietZone) * scale;
        for (let y = 0; y < scale; y++) {
          for (let x = 0; x < scale; x++) {
            const idx = ((startY + y) * totalDim + (startX + x)) * 4;
            buffer[idx] = 0;
            buffer[idx + 1] = 0;
            buffer[idx + 2] = 0;
            buffer[idx + 3] = 255;
          }
        }
      }
    }
  }

  return { data: buffer, width: totalDim, height: totalDim };
}

test('jsQR optical decoder successfully decodes all 7 supported payload types', () => {
  const fields = createDefaultQRFields();
  const types = [
    'url',
    'upi',
    'wifi',
    'whatsapp',
    'instagram',
    'google_review',
    'vcard',
  ] as const;

  for (const type of types) {
    const payload = buildQRPayload(type, fields);
    assert.ok(payload.length > 0, `Payload for ${type} must not be empty`);

    const qr = generateQRMatrix(payload, 'M');
    const image = renderQRToRgba(qr.modules, 4, 4);
    const decoded = jsQR(image.data, image.width, image.height);

    assert.ok(decoded !== null, `jsQR failed to decode ${type} payload: ${payload}`);
    assert.equal(
      decoded.data,
      payload,
      `Decoded optical content for ${type} must match original payload`
    );
  }
});

test('jsQR decodes ASCII, Unicode UTF-8, short and long payloads accurately', () => {
  const testCases = [
    { label: 'Short ASCII', text: 'OK' },
    { label: 'Standard URL', text: 'https://jasvel3dmakers.co.in/qr-stand-studio' },
    {
      label: 'Multilingual Indic Unicode UTF-8',
      text: 'https://jasvel3dmakers.co.in/qr?name=जैस्वल&product=3D_Makers_⭐',
    },
    {
      label: 'Long Payload (150 chars)',
      text: 'https://jasvel3dmakers.co.in/catalog/item/custom-3d-printed-qr-display-stand-with-interchangeable-base-and-dual-extrusion-inlay-for-retail-and-business-v7-check',
    },
  ];

  for (const tc of testCases) {
    const qr = createQRMatrix(tc.text, 'M');
    const image = renderQRToRgba(qr.modules, 4, 4);
    const decoded = jsQR(image.data, image.width, image.height);

    assert.ok(decoded !== null, `jsQR optical decoding failed for ${tc.label}`);
    assert.equal(decoded.data, tc.text, `Decoded text must match original for ${tc.label}`);
  }
});

test('jsQR optical decoder successfully decodes across all Error-Correction levels L, M, Q, H', () => {
  const payload = 'https://jasvel3dmakers.co.in';
  const levels: QRErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];

  for (const ec of levels) {
    const qr = createQRMatrix(payload, ec);
    const image = renderQRToRgba(qr.modules, 4, 4);
    const decoded = jsQR(image.data, image.width, image.height);

    assert.ok(decoded !== null, `Failed to decode at Error-Correction Level ${ec}`);
    assert.equal(decoded.data, payload);
    assert.equal(decoded.version, qr.version);
  }
});

test('jsQR optical decoder successfully decodes across supported QR Versions 1 through 14', () => {
  // Test distinct versions with payloads that fit within each version's Level M capacity
  const versionPayloads: Record<number, string> = {
    1: 'v1:test', // 7 bytes (V1-M max is 14)
    2: 'https://j3d.in/v2', // 17 bytes (V2-M max is 26)
    3: 'https://j3d.in/v3/test_data', // 27 bytes (V3-M max is 42)
    4: 'https://jasvel3dmakers.co.in/v4', // 31 bytes (V4-M max is 62)
    5: 'https://jasvel3dmakers.co.in/store/v5_check', // 43 bytes (V5-M max is 84)
    6: 'https://jasvel3dmakers.co.in/catalog/v6_check_pos_demo', // 54 bytes (V6-M max is 106)
    7: 'https://jasvel3dmakers.co.in/store/v7_check_with_18bit_version_block', // 67 bytes (V7-M max is 122)
    8: 'https://jasvel3dmakers.co.in/store/v8_check_with_18bit_version_block_test', // 72 bytes (V8-M max is 152)
    9: 'https://jasvel3dmakers.co.in/store/v9_check_with_18bit_version_block_testing_long_9', // 83 bytes (V9-M max is 180)
    10: 'https://jasvel3dmakers.co.in/store/v10_check_with_18bit_version_block_testing_long_payload_10', // 93 bytes (V10-M max is 211)
    11: 'https://jasvel3dmakers.co.in/store/v11_check_with_18bit_version_block_testing_long_payload_expansion_11', // 103 bytes (V11-M max is 251)
    12: 'https://jasvel3dmakers.co.in/store/v12_check_with_18bit_version_block_testing_long_payload_expansion_check_12', // 109 bytes (V12-M max is 287)
    13: 'https://jasvel3dmakers.co.in/store/v13_check_with_18bit_version_block_testing_long_payload_expansion_check_large_13', // 115 bytes (V13-M max is 331)
    14: 'https://jasvel3dmakers.co.in/store/v14_check_with_18bit_version_block_testing_long_payload_expansion_check_large_14', // 115 bytes (V14-M max is 362)
  };

  for (let v = 1; v <= 14; v++) {
    const payload = versionPayloads[v];
    const qr = createQRMatrix(payload, 'M', v);
    assert.equal(qr.version, v, `Matrix must be Version ${v}`);

    const image = renderQRToRgba(qr.modules, 4, 4);
    const decoded = jsQR(image.data, image.width, image.height);

    assert.ok(
      decoded !== null,
      `jsQR failed to decode Version ${v} (Size ${qr.size}x${qr.size})`
    );
    assert.equal(decoded.data, payload);
    assert.equal(decoded.version, v);
  }
});

test('Center-logo optical verification: valid logo decodes cleanly, oversized logo is rejected and unreadable', () => {
  // Use Version 4-H with a payload that fits in V4-H (max 34 bytes data)
  const payload = 'https://j3d.in/store/pos-4'; // 26 chars
  const qr = createQRMatrix(payload, 'H', 4);
  assert.equal(qr.version, 4);
  const N = qr.size; // 33x33 for Version 4

  // Case 1: Baseline matrix without logo decodes
  const baseImage = renderQRToRgba(qr.modules, 4, 4);
  const baseDecoded = jsQR(baseImage.data, baseImage.width, baseImage.height);
  assert.ok(baseDecoded !== null);
  assert.equal(baseDecoded.data, payload);

  // Case 2: Approved small center logo (e.g. 7x7 modules = 49 / 1089 = 4.5% area, well within 10% limit)
  // Center is at index 16 (0..32). 7x7 aperture: rows 13..19, cols 13..19
  const safeBox = { minRow: 13, maxRow: 19, minCol: 13, maxCol: 19 };
  const safeAnalysis = calculateBlockCodewordDamage(4, 'H', safeBox);
  assert.equal(safeAnalysis.overlapsFunctionPattern, false);
  // Verify all blocks are within safe print budget
  for (const blk of safeAnalysis.blockAnalysis) {
    assert.ok(
      blk.isWithinSafeBudget,
      `Block ${blk.blockIndex} damage (${blk.damagedCodewords}) must be within safe budget (${blk.safeBudget})`
    );
  }

  // Punch out modules for logo
  const punchedModules = applyCenterLogoPunchout(qr.modules, safeBox);
  const punchedImage = renderQRToRgba(punchedModules, 4, 4);
  const punchedDecoded = jsQR(punchedImage.data, punchedImage.width, punchedImage.height);

  // jsQR MUST still optically decode it because Reed-Solomon Level H recovers the corrupted codewords!
  assert.ok(
    punchedDecoded !== null,
    'jsQR must optically decode QR matrix with approved center logo punchout'
  );
  assert.equal(punchedDecoded.data, payload);

  // Case 3: Oversized logo punchout (e.g. 19x19 modules = 361 / 1089 = 33% area)
  // Rows 7..25, cols 7..25
  const oversizedBox = { minRow: 7, maxRow: 25, minCol: 7, maxCol: 25 };
  const oversizedAnalysis = calculateBlockCodewordDamage(4, 'H', oversizedBox);

  // Verify that validator flags excessive damage
  const hasExceeded = oversizedAnalysis.blockAnalysis.some(
    (b) => b.damagedCodewords > b.theoreticalBudget
  );
  assert.ok(
    hasExceeded,
    'Oversized logo must exceed Reed-Solomon theoretical correction budget'
  );

  // Punch out oversized aperture
  const oversizedModules = applyCenterLogoPunchout(qr.modules, oversizedBox);
  const oversizedImage = renderQRToRgba(oversizedModules, 4, 4);
  const oversizedDecoded = jsQR(oversizedImage.data, oversizedImage.width, oversizedImage.height);

  // jsQR MUST fail to decode (returns null) because damage exceeds RS capacity
  assert.equal(
    oversizedDecoded,
    null,
    'jsQR must fail to decode when aperture destroys codewords beyond Reed-Solomon capacity'
  );
});

test('Reed-Solomon block damage calculation accurately maps zig-zag interleaving', () => {
  // In Version 3-H: size is 29x29. Total codewords = 70.
  // EC info: 2 blocks, 15 data codewords each, 22 EC codewords each (T = 11).
  const box = { minRow: 12, maxRow: 16, minCol: 12, maxCol: 16 };
  const res = calculateBlockCodewordDamage(3, 'H', box);

  assert.equal(res.overlapsFunctionPattern, false);
  assert.equal(res.blockAnalysis.length, 2);

  let totalDamagedAcrossBlocks = 0;
  for (const blk of res.blockAnalysis) {
    assert.equal(blk.theoreticalBudget, 11);
    assert.equal(blk.safeBudget, Math.floor(11 * 0.65)); // 7
    totalDamagedAcrossBlocks += blk.damagedCodewords;
  }

  // The 5x5 aperture covers 25 modules. Because each codeword is 8 bits,
  // 25 modules intersect a small subset of codewords across both interleaved blocks.
  assert.ok(totalDamagedAcrossBlocks > 0);
  assert.ok(totalDamagedAcrossBlocks <= 15);
});

test('Optical verification of rejected logo conditions: Level L punchout, V1 punchout, and function pattern damage fail optical decoding', () => {
  // Condition 1: Attempting center punchout on Level L (only ~7% error correction budget)
  const payloadL = 'https://j3d.in/store/pos-l';
  const qrL = createQRMatrix(payloadL, 'L', 4);
  // An 8x8 aperture in 33x33 matrix (64 modules = 5.8% area)
  const box = { minRow: 12, maxRow: 19, minCol: 12, maxCol: 19 };
  const punchedL = applyCenterLogoPunchout(qrL.modules, box);
  const imgL = renderQRToRgba(punchedL, 4, 4);
  const decL = jsQR(imgL.data, imgL.width, imgL.height);
  // Level L has only 1 block with 20 EC codewords (T = 10 codewords total across entire symbol).
  // A 64-module hole corrupts more than 10 codewords, so Level L fails to decode
  assert.equal(decL, null, 'Optical decode on Level L must fail when center is punched out');

  // Condition 2: Attempting center punchout on Version 1 (21x21 modules)
  // Version 1 has only 26 total codewords (Level H: 1 block, 9 data, 17 EC, T = 8)
  const payloadV1 = 'v1:test';
  const qrV1 = createQRMatrix(payloadV1, 'H', 1);
  const boxV1 = { minRow: 8, maxRow: 14, minCol: 8, maxCol: 14 }; // 7x7 hole = 49 modules (11% of 441)
  const punchedV1 = applyCenterLogoPunchout(qrV1.modules, boxV1);
  const imgV1 = renderQRToRgba(punchedV1, 4, 4);
  const decV1 = jsQR(imgV1.data, imgV1.width, imgV1.height);
  assert.equal(decV1, null, 'Optical decode on Version 1 must fail when center is punched out');

  // Condition 3: Damaging a finder pattern (function pattern)
  // Destroying 4 modules in top-left finder pattern
  const qrFinder = createQRMatrix('https://j3d.in/test', 'H', 4);
  const corruptedFinder = qrFinder.modules.map((r) => r.slice());
  for (let r = 2; r <= 4; r++) {
    for (let c = 2; c <= 4; c++) {
      corruptedFinder[r][c] = false; // wipe out center of top-left finder
    }
  }
  const imgFinder = renderQRToRgba(corruptedFinder, 4, 4);
  const decFinder = jsQR(imgFinder.data, imgFinder.width, imgFinder.height);
  assert.equal(decFinder, null, 'Optical decode must fail when finder pattern is corrupted');
});
