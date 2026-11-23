import type { ErrorCorrectionLevel, LogoConfig, QRCodeConfig } from '../types/studio';
import {
  ALIGNMENT_PATTERN_POSITIONS,
  EC_TABLE,
} from './qrCodeEngine';
import { buildQRPayload, generateQRMatrix, type QRMatrixResult } from './qrGenerator';

export interface LogoValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface LogoBlockAnalysis {
  blockIndex: number;
  damagedCodewords: number;
  theoreticalBudget: number;
  safeBudget: number;
  isWithinSafeBudget: boolean;
}

export interface LogoValidationReport {
  isValid: boolean;
  safeToRender: boolean;
  effectiveEcLevel: ErrorCorrectionLevel;
  areaRatioPercent: number;
  linearRatioPercent: number;
  logoModulesSpan: number;
  matrixSize: number;
  version: number;
  blockAnalysis: LogoBlockAnalysis[];
  issues: LogoValidationIssue[];
  punchoutBox?: {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  };
}

/**
 * Calculates the exact number of damaged codewords per interleaved Reed-Solomon block
 * caused by an aperture punchout.
 */
export function calculateBlockCodewordDamage(
  version: number,
  ecLevel: ErrorCorrectionLevel,
  box: { minRow: number; maxRow: number; minCol: number; maxCol: number }
): {
  blockAnalysis: LogoBlockAnalysis[];
  overlapsFunctionPattern: boolean;
  functionPatternDetails?: string;
} {
  const N = 17 + version * 4;
  const isFunction = Array.from({ length: N }, () => new Array<boolean>(N).fill(false));

  const placeFinder = (rStart: number, cStart: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = rStart + r;
        const col = cStart + c;
        if (row >= 0 && row < N && col >= 0 && col < N) isFunction[row][col] = true;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, N - 7);
  placeFinder(N - 7, 0);

  // Timing patterns
  for (let i = 8; i < N - 8; i++) {
    isFunction[6][i] = true;
    isFunction[i][6] = true;
  }
  isFunction[4 * version + 9][8] = true;

  // Format info
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i <= 7; i++) {
    isFunction[8][N - 1 - i] = true;
    isFunction[N - 1 - i][8] = true;
  }

  // Alignment patterns
  const alignCoords = ALIGNMENT_PATTERN_POSITIONS[version] || [];
  for (const r of alignCoords) {
    for (const c of alignCoords) {
      if (
        (r === 6 && c === 6) ||
        (r === 6 && c === alignCoords[alignCoords.length - 1]) ||
        (r === alignCoords[alignCoords.length - 1] && c === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) isFunction[r + dr][c + dc] = true;
      }
    }
  }

  // Version info blocks for V >= 7
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        isFunction[N - 11 + j][i] = true;
        isFunction[i][N - 11 + j] = true;
      }
    }
  }

  // Check function pattern collision
  let overlapsFunctionPattern = false;
  let functionPatternDetails: string | undefined;
  for (let r = box.minRow; r <= box.maxRow; r++) {
    for (let c = box.minCol; c <= box.maxCol; c++) {
      if (isFunction[r][c]) {
        overlapsFunctionPattern = true;
        functionPatternDetails = `Aperture intersects function pattern at (${r}, ${c}).`;
        break;
      }
    }
    if (overlapsFunctionPattern) break;
  }

  // Traversal to map each (row, col) to codeword index
  const bitToCodeword: number[][] = Array.from({ length: N }, () => new Array<number>(N).fill(-1));
  let bitIdx = 0;
  let upward = true;
  for (let col = N - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    const rows = upward
      ? Array.from({ length: N }, (_, i) => N - 1 - i)
      : Array.from({ length: N }, (_, i) => i);
    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[row][c]) {
          bitToCodeword[row][c] = Math.floor(bitIdx / 8);
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }

  const ecInfo = EC_TABLE[version]?.[ecLevel] || EC_TABLE[1].H;
  const ecPerBlock = ecInfo[1];
  const numG1 = ecInfo[2];
  const dataG1 = ecInfo[3];
  const numG2 = ecInfo[4];
  const dataG2 = ecInfo[5];
  const totalBlocks = numG1 + numG2;

  // Interleave map
  const codewordToBlock = new Map<number, number>();
  let currentByte = 0;
  const maxDataLen = Math.max(dataG1, dataG2 || 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      const blockDataLen = b < numG1 ? dataG1 : dataG2;
      if (i < blockDataLen) {
        codewordToBlock.set(currentByte++, b);
      }
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      codewordToBlock.set(currentByte++, b);
    }
  }

  // Count damaged codewords per block
  const damagedCodewords = new Set<number>();
  for (let r = box.minRow; r <= box.maxRow; r++) {
    for (let c = box.minCol; c <= box.maxCol; c++) {
      const cw = bitToCodeword[r][c];
      if (cw >= 0) damagedCodewords.add(cw);
    }
  }

  const blockDamages = new Array<number>(totalBlocks).fill(0);
  for (const cw of damagedCodewords) {
    const b = codewordToBlock.get(cw);
    if (b !== undefined && b >= 0 && b < totalBlocks) {
      blockDamages[b]++;
    }
  }

  const theoreticalBudget = Math.floor(ecPerBlock / 2);
  // Reserve at least 35% margin for physical 3D printing and camera glare
  const safeBudget = Math.max(1, Math.floor(theoreticalBudget * 0.65));

  const blockAnalysis: LogoBlockAnalysis[] = [];
  for (let b = 0; b < totalBlocks; b++) {
    blockAnalysis.push({
      blockIndex: b,
      damagedCodewords: blockDamages[b],
      theoreticalBudget,
      safeBudget,
      isWithinSafeBudget: blockDamages[b] <= safeBudget,
    });
  }

  return {
    blockAnalysis,
    overlapsFunctionPattern,
    functionPatternDetails,
  };
}

/**
 * Validates center logo safety against ISO/IEC 18004 Reed-Solomon damage budgets.
 * Enforces:
 * - Error correction level 'H' (~30% recovery)
 * - Conservative maximum logo-area limit of 10%
 * - Minimum QR Version 3 (29x29) for center aperture
 * - Protection of finders, timing, alignment, and version blocks
 * - Actual affected codewords per Reed-Solomon block within 3D printing safety budget
 */
export function validateCenterLogo(
  qrConfig: QRCodeConfig,
  logoConfig: LogoConfig
): LogoValidationReport {
  const issues: LogoValidationIssue[] = [];

  if (!logoConfig.enabled) {
    return {
      isValid: true,
      safeToRender: false,
      effectiveEcLevel: qrConfig.errorCorrection,
      areaRatioPercent: 0,
      linearRatioPercent: 0,
      logoModulesSpan: 0,
      matrixSize: 21,
      version: 1,
      blockAnalysis: [],
      issues: [],
    };
  }

  // 1. Error correction level validation
  if (qrConfig.errorCorrection !== 'H') {
    issues.push({
      severity: 'error',
      code: 'INSUFFICIENT_ERROR_CORRECTION',
      message: `Center logo strictly requires Level 'H' (~30% recovery). Level '${qrConfig.errorCorrection}' cannot safely tolerate center module obstruction.`,
    });
  }

  // 2. Generate matrix using actual user payload to get true version and module dimensions
  const payload = buildQRPayload(qrConfig.type, qrConfig.fields) || 'https://jasvel3dmakers.co.in';
  let matrix: QRMatrixResult;
  try {
    matrix = generateQRMatrix(payload, qrConfig.errorCorrection);
  } catch {
    matrix = { size: 21, modules: [], payload: '', version: 1 };
  }

  const N = matrix.size;
  const version = matrix.version;
  const totalCells = N + qrConfig.quietZone * 2;
  const moduleSizeMm = qrConfig.sizeMm / totalCells;

  // 3. Minimum QR Version Check
  if (version < 3) {
    issues.push({
      severity: 'error',
      code: 'VERSION_TOO_LOW_FOR_LOGO',
      message: `QR code Version ${version} (${N}x${N}) is too compact for a center logo. Center apertures require at least Version 3 (29x29 modules).`,
    });
  }

  // 4. Calculate logo span in modules
  const rawLogoSpan = logoConfig.sizeMm / moduleSizeMm;
  const logoModulesSpan = Math.ceil(rawLogoSpan);
  const totalMatrixModules = N * N;
  const logoAreaModules = logoModulesSpan * logoModulesSpan;
  const areaRatio = (logoAreaModules / totalMatrixModules) * 100;
  const linearRatio = (logoModulesSpan / N) * 100;

  // 5. Conservative 10% area ceiling
  if (areaRatio > 10.0) {
    issues.push({
      severity: 'error',
      code: 'LOGO_EXCEEDS_AREA_LIMIT',
      message: `Logo covers ${areaRatio.toFixed(1)}% of matrix area, exceeding conservative 10.0% safety limit. Reduce logo size.`,
    });
  } else if (areaRatio > 7.5) {
    issues.push({
      severity: 'warning',
      code: 'LOGO_NEAR_AREA_LIMIT',
      message: `Logo covers ${areaRatio.toFixed(1)}% of matrix area (near 10% limit). Keep modules sharp and test under varying lighting.`,
    });
  }

  // 6. Center placement and Aperture bounds
  const centerCoord = Math.floor(N / 2);
  const halfSpan = Math.floor(logoModulesSpan / 2);
  const minRow = centerCoord - halfSpan;
  const maxRow = centerCoord + (logoModulesSpan - 1 - halfSpan);
  const minCol = centerCoord - halfSpan;
  const maxCol = centerCoord + (logoModulesSpan - 1 - halfSpan);
  const punchoutBox = { minRow, maxRow, minCol, maxCol };

  // 7. Actual Affected Codewords Per Reed-Solomon Block
  const { blockAnalysis, overlapsFunctionPattern, functionPatternDetails } =
    calculateBlockCodewordDamage(version, qrConfig.errorCorrection, punchoutBox);

  if (overlapsFunctionPattern) {
    issues.push({
      severity: 'error',
      code: 'FUNCTION_PATTERN_COLLISION',
      message: functionPatternDetails || 'Logo aperture intersects critical QR finder or alignment patterns.',
    });
  }

  for (const blk of blockAnalysis) {
    if (blk.damagedCodewords > blk.theoreticalBudget) {
      issues.push({
        severity: 'error',
        code: 'EXCEEDS_REED_SOLOMON_CAPACITY',
        message: `Block ${blk.blockIndex} has ${blk.damagedCodewords} damaged codewords, exceeding theoretical Reed-Solomon limit (${blk.theoreticalBudget}).`,
      });
    } else if (blk.damagedCodewords > blk.safeBudget) {
      issues.push({
        severity: 'error',
        code: 'EXCEEDS_SAFE_PRINT_BUDGET',
        message: `Block ${blk.blockIndex} has ${blk.damagedCodewords} damaged codewords, exceeding conservative 3D printing budget (${blk.safeBudget} of ${blk.theoreticalBudget}). A 35% margin must be preserved for layer lines and glare.`,
      });
    }
  }

  // Add explicit scanner disclaimer
  issues.push({
    severity: 'info',
    code: 'SCAN_RELIABILITY_DISCLAIMER',
    message: 'Passing error-correction limits preserves mathematical recovery budget with a 35% margin, but optical readability still depends on print contrast and scanner resolution.',
  });

  const hasErrors = issues.some((i) => i.severity === 'error');

  return {
    isValid: !hasErrors,
    safeToRender: !hasErrors && logoConfig.enabled,
    effectiveEcLevel: qrConfig.errorCorrection,
    areaRatioPercent: Number(areaRatio.toFixed(2)),
    linearRatioPercent: Number(linearRatio.toFixed(2)),
    logoModulesSpan,
    matrixSize: N,
    version,
    blockAnalysis,
    issues,
    punchoutBox,
  };
}

/**
 * Creates a modified QR module grid with a clean punchout clearing for the logo.
 */
export function applyCenterLogoPunchout(
  modules: boolean[][],
  punchoutBox: { minRow: number; maxRow: number; minCol: number; maxCol: number }
): boolean[][] {
  const N = modules.length;
  const result = modules.map((row) => row.slice());

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (
        r >= punchoutBox.minRow &&
        r <= punchoutBox.maxRow &&
        c >= punchoutBox.minCol &&
        c <= punchoutBox.maxCol
      ) {
        result[r][c] = false;
      }
    }
  }

  return result;
}
