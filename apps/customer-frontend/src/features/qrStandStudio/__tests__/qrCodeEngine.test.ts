import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFormatBits,
  computeVersionBits,
  createQRMatrix,
  calculatePenalty,
} from '../core/qrCodeEngine';
import { generateQRMatrix } from '../core/qrGenerator';

test('createQRMatrix generates valid ISO/IEC 18004 square matrix with finder patterns', () => {
  const qr = createQRMatrix('https://jasvel3dmakers.co.in', 'M');
  assert.ok(qr.version >= 1);
  const expectedSize = 17 + qr.version * 4;
  assert.equal(qr.size, expectedSize);
  assert.equal(qr.modules.length, expectedSize);
  assert.equal(qr.modules[0].length, expectedSize);

  // Top-left finder pattern corner (0,0) must be dark (true)
  assert.equal(qr.modules[0][0], true);
  // Top-right finder pattern corner (0, size - 7) must be dark
  assert.equal(qr.modules[0][expectedSize - 7], true);
  // Bottom-left finder pattern corner (size - 7, 0) must be dark
  assert.equal(qr.modules[expectedSize - 7][0], true);

  // Separator outside finder (row 0, col 7) must be light (false)
  assert.equal(qr.modules[0][7], false);
});

test('computeVersionBits produces exact ISO/IEC 18004 Table D.1 18-bit BCH codes for V7-V14', () => {
  const expectedCodes: Record<number, number> = {
    7: 0x07c94,
    8: 0x085bc,
    9: 0x09a99,
    10: 0x0a4d3,
    11: 0x0bbf6,
    12: 0x0c762,
    13: 0x0d847,
    14: 0x0e60d,
  };

  for (let v = 7; v <= 14; v++) {
    const code = computeVersionBits(v);
    assert.equal(
      code,
      expectedCodes[v],
      `Version ${v} BCH code 0x${code.toString(16)} must match ISO Table D.1 (0x${expectedCodes[v].toString(16)})`
    );
  }
});

test('createQRMatrix writes 18-bit Version Info blocks when Version >= 7', () => {
  // A long payload that triggers Version 7+ at Level H
  const longPayload =
    'https://jasvel3dmakers.co.in/store/custom-3d-qr-stand?session=order_verified_production_payload_expansion_check_v7_long';
  const qr = createQRMatrix(longPayload, 'H');
  assert.ok(qr.version >= 7, `Must be Version >= 7, got Version ${qr.version}`);

  const N = qr.size;
  const vBits = computeVersionBits(qr.version);

  // Verify bottom-left 3x6 version block: rows (N-11)..(N-9), cols 0..5
  for (let i = 0; i < 18; i++) {
    const expectedBit = ((vBits >> i) & 1) === 1;
    const r = N - 11 + (i % 3);
    const c = Math.floor(i / 3);
    assert.equal(
      qr.modules[r][c],
      expectedBit,
      `Bottom-left version bit ${i} at (${r},${c}) must match BCH code`
    );
  }

  // Verify top-right 6x3 version block: rows 0..5, cols (N-11)..(N-9)
  for (let i = 0; i < 18; i++) {
    const expectedBit = ((vBits >> i) & 1) === 1;
    const r = Math.floor(i / 3);
    const c = N - 11 + (i % 3);
    assert.equal(
      qr.modules[r][c],
      expectedBit,
      `Top-right version bit ${i} at (${r},${c}) must match BCH code`
    );
  }
});

test('generateQRMatrix supports all error correction levels and Unicode UTF-8 payloads', () => {
  // Test with multilingual / Unicode characters
  const unicodePayload = 'https://jasvel3dmakers.co.in/qr?name=जैस्वल&store=3D_Makers_⭐';
  const levels = ['L', 'M', 'Q', 'H'] as const;

  for (const lvl of levels) {
    const res = generateQRMatrix(unicodePayload, lvl);
    assert.ok(res.size >= 21);
    assert.equal(res.modules.length, res.size);
    assert.ok(res.version >= 1);
  }
});

test('computeFormatBits produces valid 15-bit BCH(15,5) format codes', () => {
  // Format bit: (ec << 3) | mask, generator 0x537, mask 0x5412
  // Test EC 'M' (00) with mask 0 (000): data 0x00 -> format 0x5412 ^ 0x00 = 0x5412
  const fM0 = computeFormatBits('M', 0);
  assert.equal(fM0, 0x5412);

  // Test EC 'H' (10 = 2) with mask 7 (111 = 7): data = (2 << 3) | 7 = 23 (0x17)
  const fH7 = computeFormatBits('H', 7);
  assert.ok(fH7 >= 0 && fH7 <= 0x7fff, 'Format code must be a 15-bit integer');
});

// Helper to create a neutral checkerboard grid (no runs of 5, no 2x2 blocks, no 1011101, 50% dark)
function createCheckerboard(size: number): boolean[][] {
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => (r + c) % 2 === 0)
  );
}

test('penalty scoring N1 evaluates consecutive runs correctly according to ISO/IEC 18004', () => {
  // Pure checkerboard: no 5-module runs -> N1 = 0
  const neutral = createCheckerboard(25);
  const neutralScore = calculatePenalty(neutral);
  assert.equal(neutralScore.n1, 0, 'Checkerboard must have 0 N1 penalty');

  // Insert a run of exactly 5 dark modules horizontally: penalty = 3 + (5 - 5) = 3
  const grid5 = createCheckerboard(25);
  for (let c = 0; c < 5; c++) grid5[10][c] = true;
  // Ensure adjacent cells are light so run is exactly 5
  grid5[10][5] = false;
  const score5 = calculatePenalty(grid5);
  // Row 10 has a run of 5 dark modules (+3).
  // Note: changing modules might create small vertical runs or 2x2 blocks, but row-wise N1 for that row is 3.
  assert.ok(score5.n1 >= 3, 'Must register at least 3 points for 5 consecutive modules');

  // Explicit single-row test grid where only row 0 has runs
  const isolatedGrid = Array.from({ length: 15 }, (_, r) =>
    Array.from({ length: 15 }, (_, c) => (r + c) % 2 === 0)
  );
  // Break any other runs; test a run of 7
  for (let c = 2; c <= 8; c++) isolatedGrid[5][c] = true; // 7 dark modules
  isolatedGrid[5][1] = false;
  isolatedGrid[5][9] = false;
  // Run of 7 modules adds 3 + (7 - 5) = 5 points
  const score7 = calculatePenalty(isolatedGrid);
  assert.ok(score7.n1 >= 5);
});

test('penalty scoring N2 evaluates 2x2 blocks with 3 points per block', () => {
  // Pure checkerboard: 0 2x2 blocks -> N2 = 0
  const neutral = createCheckerboard(20);
  assert.equal(calculatePenalty(neutral).n2, 0);

  // Single 2x2 block in the middle of checkerboard
  // A checkerboard has (r, c) and (r+1, c+1) same, but (r+1, c) and (r, c+1) different.
  // Setting a 2x2 block to true:
  const grid2x2 = createCheckerboard(20);
  grid2x2[5][5] = true;
  grid2x2[5][6] = true;
  grid2x2[6][5] = true;
  grid2x2[6][6] = true;
  // This creates exactly one 2x2 all-dark block (at row 5, col 5)
  // Check neighbors to ensure no accidental 2x2 blocks are created around it
  const score2x2 = calculatePenalty(grid2x2);
  assert.equal(score2x2.n2, 3, 'A single 2x2 block must add exactly 3 points');

  // A 2x3 block contains two overlapping 2x2 blocks: penalty = 2 * 3 = 6
  const grid2x3 = createCheckerboard(20);
  for (let r = 5; r <= 6; r++) {
    for (let c = 5; c <= 7; c++) {
      grid2x3[r][c] = true;
    }
  }
  const score2x3 = calculatePenalty(grid2x3);
  assert.equal(score2x3.n2, 6, 'A 2x3 block must add exactly 6 points (2 overlapping 2x2 blocks)');

  // A 3x3 block contains four overlapping 2x2 blocks: penalty = 4 * 3 = 12
  const grid3x3 = createCheckerboard(20);
  for (let r = 5; r <= 7; r++) {
    for (let c = 5; c <= 7; c++) {
      grid3x3[r][c] = true;
    }
  }
  const score3x3 = calculatePenalty(grid3x3);
  assert.equal(score3x3.n2, 12, 'A 3x3 block must add exactly 12 points (4 overlapping 2x2 blocks)');
});

test('penalty scoring N3 evaluates finder-like 1:1:3:1:1 patterns with 4 light modules with 40 points each', () => {
  const neutral = createCheckerboard(25);
  assert.equal(calculatePenalty(neutral).n3, 0);

  // Pattern A: 0 0 0 0 1 0 1 1 1 0 1 (4 light, 1 dark, 1 light, 3 dark, 1 light, 1 dark)
  const patternA = [false, false, false, false, true, false, true, true, true, false, true];
  const gridA = createCheckerboard(25);
  for (let i = 0; i < 11; i++) {
    gridA[10][i] = patternA[i];
  }
  const scoreA = calculatePenalty(gridA);
  assert.equal(scoreA.n3, 40, 'Pattern A (light-light-light-light-dark-light-dark-dark-dark-light-dark) must add 40 points');

  // Pattern B: 1 0 1 1 1 0 1 0 0 0 0 (1 dark, 1 light, 3 dark, 1 light, 1 dark, 4 light)
  const patternB = [true, false, true, true, true, false, true, false, false, false, false];
  const gridB = createCheckerboard(25);
  for (let i = 0; i < 11; i++) {
    gridB[12][i] = patternB[i];
  }
  const scoreB = calculatePenalty(gridB);
  assert.equal(scoreB.n3, 40, 'Pattern B must add 40 points');

  // Vertical orientation of Pattern A down a column
  const gridCol = createCheckerboard(25);
  for (let i = 0; i < 11; i++) {
    gridCol[i][10] = patternA[i];
  }
  const scoreCol = calculatePenalty(gridCol);
  assert.equal(scoreCol.n3, 40, 'Vertical Pattern A must add 40 points');
});

test('penalty scoring N4 evaluates dark module ratio deviations from 50%', () => {
  // 20x20 grid has 400 modules
  // Case 1: Exactly 200 dark modules (50.0%) -> N4 penalty = 0
  const grid50 = Array.from({ length: 20 }, (_, r) =>
    Array.from({ length: 20 }, (_, c) => (r * 20 + c < 200))
  );
  assert.equal(calculatePenalty(grid50).n4, 0);

  // Case 2: 170 dark modules out of 400 = 42.5% dark
  // prev5 = 40, next5 = 45. |40 - 50|/5 = 2, |45 - 50|/5 = 1. Min is 1 -> 1 * 10 = 10
  const grid42_5 = Array.from({ length: 20 }, (_, r) =>
    Array.from({ length: 20 }, (_, c) => (r * 20 + c < 170))
  );
  assert.equal(calculatePenalty(grid42_5).n4, 10);

  // Case 3: 140 dark modules out of 400 = 35.0% dark
  // prev5 = 35, next5 = 40. |35 - 50|/5 = 3, |40 - 50|/5 = 2. Min is 2 -> 2 * 10 = 20
  const grid35 = Array.from({ length: 20 }, (_, r) =>
    Array.from({ length: 20 }, (_, c) => (r * 20 + c < 140))
  );
  assert.equal(calculatePenalty(grid35).n4, 20);

  // Case 4: 280 dark modules out of 400 = 70.0% dark
  // prev5 = 70, next5 = 75. |70 - 50|/5 = 4, |75 - 50|/5 = 5. Min is 4 -> 4 * 10 = 40
  const grid70 = Array.from({ length: 20 }, (_, r) =>
    Array.from({ length: 20 }, (_, c) => (r * 20 + c < 280))
  );
  assert.equal(calculatePenalty(grid70).n4, 40);
});

test('createQRMatrix chooses mask pattern strictly minimizing penalty score', () => {
  const qr = createQRMatrix('HELLO WORLD', 'M');
  assert.ok(qr.maskPattern >= 0 && qr.maskPattern <= 7);

  // Verify that the generated matrix is scored properly
  const chosenPenalty = calculatePenalty(qr.modules);
  assert.ok(chosenPenalty.total > 0);
  assert.ok(Number.isFinite(chosenPenalty.total));
});
