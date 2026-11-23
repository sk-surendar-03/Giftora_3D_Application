/**
 * Pure TypeScript ISO/IEC 18004 QR Code Generator Engine.
 * 100% self-contained with ZERO external runtime dependencies.
 */

export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QRCodeMatrix {
  version: number;
  errorCorrectionLevel: QRErrorCorrectionLevel;
  maskPattern: number;
  size: number;
  modules: boolean[][]; // [row][col] true = dark, false = light
}

// ---------------------------------------------------------------------------
// Galois Field GF(2^8) with primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D)
// ---------------------------------------------------------------------------
const GF_EXP: number[] = new Array(512);
const GF_LOG: number[] = new Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

// ---------------------------------------------------------------------------
// Reed-Solomon Code generator polynomials
// ---------------------------------------------------------------------------
function rsGeneratorPolynomial(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = [1, GF_EXP[i]];
    const product = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      for (let k = 0; k < next.length; k++) {
        product[j + k] ^= gfMultiply(poly[j], next[k]);
      }
    }
    poly = product;
  }
  return poly;
}

function rsComputeRemainder(data: number[], generator: number[]): number[] {
  const degree = generator.length - 1;
  const remainder = data.slice();
  while (remainder.length < data.length + degree) {
    remainder.push(0);
  }

  for (let i = 0; i < data.length; i++) {
    const factor = remainder[i];
    if (factor !== 0) {
      for (let j = 0; j < generator.length; j++) {
        remainder[i + j] ^= gfMultiply(generator[j], factor);
      }
    }
  }

  return remainder.slice(data.length);
}

// ---------------------------------------------------------------------------
// QR Code Capacity & Block Division Tables (Versions 1..40, EC Levels L, M, Q, H)
// Format per level: [totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsPerBlockG1, numBlocksGroup2, dataCodewordsPerBlockG2]
// ---------------------------------------------------------------------------
export type ECBlockInfo = [number, number, number, number, number, number];

export const EC_TABLE: Record<number, Record<QRErrorCorrectionLevel, ECBlockInfo>> = {
  1: {
    L: [26, 7, 1, 19, 0, 0],
    M: [26, 10, 1, 16, 0, 0],
    Q: [26, 13, 1, 13, 0, 0],
    H: [26, 17, 1, 9, 0, 0],
  },
  2: {
    L: [44, 10, 1, 34, 0, 0],
    M: [44, 16, 1, 28, 0, 0],
    Q: [44, 22, 1, 22, 0, 0],
    H: [44, 28, 1, 16, 0, 0],
  },
  3: {
    L: [70, 15, 1, 55, 0, 0],
    M: [70, 26, 1, 44, 0, 0],
    Q: [70, 18, 2, 17, 0, 0],
    H: [70, 22, 2, 13, 0, 0],
  },
  4: {
    L: [100, 20, 1, 80, 0, 0],
    M: [100, 18, 2, 32, 0, 0],
    Q: [100, 26, 2, 24, 0, 0],
    H: [100, 16, 4, 9, 0, 0],
  },
  5: {
    L: [134, 26, 1, 108, 0, 0],
    M: [134, 24, 2, 43, 0, 0],
    Q: [134, 18, 2, 15, 2, 16],
    H: [134, 22, 2, 11, 2, 12],
  },
  6: {
    L: [172, 18, 2, 68, 0, 0],
    M: [172, 16, 4, 27, 0, 0],
    Q: [172, 24, 4, 19, 0, 0],
    H: [172, 28, 4, 15, 0, 0],
  },
  7: {
    L: [196, 20, 2, 78, 0, 0],
    M: [196, 18, 4, 31, 0, 0],
    Q: [196, 18, 2, 14, 4, 15],
    H: [196, 26, 4, 13, 1, 14],
  },
  8: {
    L: [242, 24, 2, 97, 0, 0],
    M: [242, 22, 2, 38, 2, 39],
    Q: [242, 22, 4, 18, 2, 19],
    H: [242, 26, 4, 14, 2, 15],
  },
  9: {
    L: [292, 30, 2, 116, 0, 0],
    M: [292, 22, 3, 36, 2, 37],
    Q: [292, 20, 4, 16, 4, 17],
    H: [292, 24, 4, 12, 4, 13],
  },
  10: {
    L: [346, 18, 2, 68, 2, 69],
    M: [346, 26, 4, 43, 1, 44],
    Q: [346, 24, 6, 19, 2, 20],
    H: [346, 28, 6, 15, 2, 16],
  },
  11: {
    L: [404, 20, 4, 81, 0, 0],
    M: [404, 30, 1, 50, 4, 51],
    Q: [404, 28, 4, 22, 4, 23],
    H: [404, 24, 3, 12, 8, 13],
  },
  12: {
    L: [466, 24, 2, 92, 2, 93],
    M: [466, 22, 6, 36, 2, 37],
    Q: [466, 26, 4, 20, 6, 21],
    H: [466, 28, 7, 14, 4, 15],
  },
  13: {
    L: [532, 26, 4, 107, 0, 0],
    M: [532, 22, 8, 37, 1, 38],
    Q: [532, 24, 8, 20, 4, 21],
    H: [532, 22, 12, 11, 4, 12],
  },
  14: {
    L: [581, 30, 3, 115, 1, 116],
    M: [581, 24, 4, 40, 5, 41],
    Q: [581, 20, 11, 16, 5, 17],
    H: [581, 24, 11, 12, 5, 13],
  },
};

// Alignment pattern center coordinates per version
export const ALIGNMENT_PATTERN_POSITIONS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
  14: [6, 26, 46, 66],
};

// Format bitmasks
const FORMAT_MASK = 0x5412;
const FORMAT_BITS_MAP: Record<QRErrorCorrectionLevel, number> = {
  L: 0x01,
  M: 0x00,
  Q: 0x03,
  H: 0x02,
};

export function computeFormatBits(ecLevel: QRErrorCorrectionLevel, mask: number): number {
  const data = (FORMAT_BITS_MAP[ecLevel] << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) {
      rem ^= 0x537 << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ FORMAT_MASK;
}

// Version Information generator polynomial: x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1 = 0x1F25
const VERSION_INFO_POLY = 0x1f25;

export function computeVersionBits(v: number): number {
  let rem = v << 12;
  for (let i = 17; i >= 12; i--) {
    if ((rem >> i) & 1) {
      rem ^= VERSION_INFO_POLY << (i - 12);
    }
  }
  return (v << 12) | rem;
}

// ---------------------------------------------------------------------------
// Bit Buffer Helper
// ---------------------------------------------------------------------------
class BitBuffer {
  private buffer: number[] = [];
  public length = 0;

  put(num: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.putBit(((num >> i) & 1) === 1);
    }
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >> (this.length % 8);
    }
    this.length++;
  }

  getBuffer(): number[] {
    return this.buffer;
  }
}

// ---------------------------------------------------------------------------
// Data Encoding (Byte mode UTF-8)
// ---------------------------------------------------------------------------
function encodeData(dataStr: string, version: number, ecLevel: QRErrorCorrectionLevel): number[] {
  const bytes = new TextEncoder().encode(dataStr);
  const dataCount = bytes.length;

  const buffer = new BitBuffer();
  // Mode: 8-bit Byte mode = 0100
  buffer.put(0x4, 4);

  // Character count indicator: 8 bits for versions 1..9, 16 bits for versions 10..40
  const charCountBits = version < 10 ? 8 : 16;
  buffer.put(dataCount, charCountBits);

  // Write UTF-8 bytes
  for (let i = 0; i < dataCount; i++) {
    buffer.put(bytes[i], 8);
  }

  // Calculate total capacity
  const ecInfo = EC_TABLE[version][ecLevel];
  const totalDataCodewords =
    ecInfo[2] * ecInfo[3] + ecInfo[4] * ecInfo[5];
  const totalDataBits = totalDataCodewords * 8;

  // Terminator (up to 4 zero bits)
  const remainingBits = totalDataBits - buffer.length;
  if (remainingBits > 0) {
    buffer.put(0, Math.min(4, remainingBits));
  }

  // Pad to byte boundary
  while (buffer.length % 8 !== 0) {
    buffer.putBit(false);
  }

  // Pad bytes (0xEC, 0x11 alternating)
  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  const currentBytes = buffer.getBuffer();
  while (currentBytes.length < totalDataCodewords) {
    currentBytes.push(padBytes[padIndex % 2]);
    padIndex++;
  }

  return currentBytes;
}

function determineMinVersion(dataLengthBytes: number, ecLevel: QRErrorCorrectionLevel): number {
  for (let v = 1; v <= 14; v++) {
    const ecInfo = EC_TABLE[v]?.[ecLevel];
    if (!ecInfo) continue;
    const totalDataCodewords = ecInfo[2] * ecInfo[3] + ecInfo[4] * ecInfo[5];
    const headerBits = 4 + (v < 10 ? 8 : 16);
    const capacityBytes = Math.floor((totalDataCodewords * 8 - headerBits) / 8);
    if (dataLengthBytes <= capacityBytes) {
      return v;
    }
  }
  throw new Error(`Data too long for QR Code Error Correction Level ${ecLevel}`);
}

// ---------------------------------------------------------------------------
// Error Correction Codeword Interleaving
// ---------------------------------------------------------------------------
function interleaveBlocks(
  dataBytes: number[],
  version: number,
  ecLevel: QRErrorCorrectionLevel
): number[] {
  const ecInfo = EC_TABLE[version][ecLevel];
  const ecPerBlock = ecInfo[1];
  const numG1 = ecInfo[2];
  const dataG1 = ecInfo[3];
  const numG2 = ecInfo[4];
  const dataG2 = ecInfo[5];

  const totalBlocks = numG1 + numG2;
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  const genPoly = rsGeneratorPolynomial(ecPerBlock);

  let byteOffset = 0;
  for (let b = 0; b < totalBlocks; b++) {
    const blockDataLen = b < numG1 ? dataG1 : dataG2;
    const blockData = dataBytes.slice(byteOffset, byteOffset + blockDataLen);
    byteOffset += blockDataLen;

    const blockEC = rsComputeRemainder(blockData, genPoly);
    dataBlocks.push(blockData);
    ecBlocks.push(blockEC);
  }

  // Interleave data codewords
  const result: number[] = [];
  const maxDataLen = Math.max(dataG1, dataG2 || 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < dataBlocks[b].length) {
        result.push(dataBlocks[b][i]);
      }
    }
  }

  // Interleave error correction codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < ecBlocks[b].length) {
        result.push(ecBlocks[b][i]);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Penalty Scoring (ISO/IEC 18004 Section 6.8.2)
// ---------------------------------------------------------------------------
export interface QRPenaltyScores {
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  total: number;
}

/**
 * Calculates ISO/IEC 18004 QR penalty scores for mask evaluation.
 * N1: Runs of 5+ consecutive modules of same color (3 + (len - 5))
 * N2: 2x2 blocks of same color (3 points each)
 * N3: 1:1:3:1:1 finder-like patterns with 4 light modules before or after (40 points each)
 * N4: Dark module ratio deviation from 50% (10 points per 5% step)
 */
export function calculatePenalty(modules: boolean[][]): QRPenaltyScores {
  const N = modules.length;
  let n1 = 0;
  let n2 = 0;
  let n3 = 0;
  let n4 = 0;

  // N1: 5 or more consecutive modules of the same color in row/col
  for (let r = 0; r < N; r++) {
    let count = 1;
    for (let c = 1; c < N; c++) {
      if (modules[r][c] === modules[r][c - 1]) {
        count++;
      } else {
        if (count >= 5) n1 += 3 + (count - 5);
        count = 1;
      }
    }
    if (count >= 5) n1 += 3 + (count - 5);
  }

  for (let c = 0; c < N; c++) {
    let count = 1;
    for (let r = 1; r < N; r++) {
      if (modules[r][c] === modules[r - 1][c]) {
        count++;
      } else {
        if (count >= 5) n1 += 3 + (count - 5);
        count = 1;
      }
    }
    if (count >= 5) n1 += 3 + (count - 5);
  }

  // N2: 2x2 blocks of same color
  for (let r = 0; r < N - 1; r++) {
    for (let c = 0; c < N - 1; c++) {
      const val = modules[r][c];
      if (
        modules[r + 1][c] === val &&
        modules[r][c + 1] === val &&
        modules[r + 1][c + 1] === val
      ) {
        n2 += 3;
      }
    }
  }

  // N3: finder-like pattern (1 0 1 1 1 0 1) preceded or followed by 4 light modules
  for (let r = 0; r < N; r++) {
    const row = modules[r];
    for (let c = 0; c <= N - 11; c++) {
      // Pattern A: 0 0 0 0 1 0 1 1 1 0 1
      if (
        !row[c] && !row[c + 1] && !row[c + 2] && !row[c + 3] &&
        row[c + 4] && !row[c + 5] && row[c + 6] && row[c + 7] && row[c + 8] &&
        !row[c + 9] && row[c + 10]
      ) {
        n3 += 40;
      }
      // Pattern B: 1 0 1 1 1 0 1 0 0 0 0
      if (
        row[c] && !row[c + 1] && row[c + 2] && row[c + 3] && row[c + 4] &&
        !row[c + 5] && row[c + 6] && !row[c + 7] && !row[c + 8] && !row[c + 9] &&
        !row[c + 10]
      ) {
        n3 += 40;
      }
    }
  }

  for (let c = 0; c < N; c++) {
    for (let r = 0; r <= N - 11; r++) {
      // Pattern A: 0 0 0 0 1 0 1 1 1 0 1
      if (
        !modules[r][c] && !modules[r + 1][c] && !modules[r + 2][c] && !modules[r + 3][c] &&
        modules[r + 4][c] && !modules[r + 5][c] && modules[r + 6][c] && modules[r + 7][c] && modules[r + 8][c] &&
        !modules[r + 9][c] && modules[r + 10][c]
      ) {
        n3 += 40;
      }
      // Pattern B: 1 0 1 1 1 0 1 0 0 0 0
      if (
        modules[r][c] && !modules[r + 1][c] && modules[r + 2][c] && modules[r + 3][c] && modules[r + 4][c] &&
        !modules[r + 5][c] && modules[r + 6][c] && !modules[r + 7][c] && !modules[r + 8][c] && !modules[r + 9][c] &&
        !modules[r + 10][c]
      ) {
        n3 += 40;
      }
    }
  }

  // N4: proportion of dark modules
  let darkCount = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (modules[r][c]) darkCount++;
    }
  }
  const percentDark = (darkCount / (N * N)) * 100;
  const prev5 = Math.floor(percentDark / 5) * 5;
  const next5 = prev5 + 5;
  const d1 = Math.abs(prev5 - 50) / 5;
  const d2 = Math.abs(next5 - 50) / 5;
  n4 = Math.min(d1, d2) * 10;

  return { n1, n2, n3, n4, total: n1 + n2 + n3 + n4 };
}

// ---------------------------------------------------------------------------
// Matrix Layout & Masking
// ---------------------------------------------------------------------------
export function createQRMatrix(
  text: string,
  ecLevel: QRErrorCorrectionLevel = 'M',
  preferredVersion?: number
): QRCodeMatrix {
  const utf8Bytes = new TextEncoder().encode(text);
  const minVer = determineMinVersion(utf8Bytes.length, ecLevel);
  const version = preferredVersion ? Math.max(preferredVersion, minVer) : minVer;

  const dataCodewords = encodeData(text, version, ecLevel);
  const finalCodewords = interleaveBlocks(dataCodewords, version, ecLevel);

  const N = 17 + version * 4;
  const isFunction = Array.from({ length: N }, () => new Array<boolean>(N).fill(false));
  const baseModules = Array.from({ length: N }, () => new Array<boolean>(N).fill(false));

  // Place Finder Patterns (7x7) + Separators
  const placeFinder = (rStart: number, cStart: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = rStart + r;
        const col = cStart + c;
        if (row < 0 || row >= N || col < 0 || col >= N) continue;
        isFunction[row][col] = true;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          baseModules[row][col] = isBorder || isCenter;
        } else {
          baseModules[row][col] = false; // separator
        }
      }
    }
  };

  placeFinder(0, 0); // Top-left
  placeFinder(0, N - 7); // Top-right
  placeFinder(N - 7, 0); // Bottom-left

  // Timing patterns (Row 6, Col 6)
  for (let i = 8; i < N - 8; i++) {
    if (!isFunction[6][i]) {
      isFunction[6][i] = true;
      baseModules[6][i] = i % 2 === 0;
    }
    if (!isFunction[i][6]) {
      isFunction[i][6] = true;
      baseModules[i][6] = i % 2 === 0;
    }
  }

  // Dark module (always at row 4*V + 9, col 8)
  const darkRow = 4 * version + 9;
  isFunction[darkRow][8] = true;
  baseModules[darkRow][8] = true;

  // Alignment patterns for version >= 2
  const alignCoords = ALIGNMENT_PATTERN_POSITIONS[version] || [];
  for (const r of alignCoords) {
    for (const c of alignCoords) {
      // Skip if overlaps with finder patterns
      if (
        (r === 6 && c === 6) ||
        (r === 6 && c === alignCoords[alignCoords.length - 1]) ||
        (r === alignCoords[alignCoords.length - 1] && c === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ar = r + dr;
          const ac = c + dc;
          isFunction[ar][ac] = true;
          const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          baseModules[ar][ac] = isBorder || isCenter;
        }
      }
    }
  }

  // Reserve format info area
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

  // Reserve Version Information area for Version >= 7 (two 3x6 blocks)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        // Block 1: above bottom-left finder (rows N-11 to N-9, cols 0 to 5)
        isFunction[N - 11 + j][i] = true;
        // Block 2: left of top-right finder (rows 0 to 5, cols N-11 to N-9)
        isFunction[i][N - 11 + j] = true;
      }
    }
  }

  // Place data bits in zig-zag order
  const dataBits: boolean[] = [];
  for (const byte of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      dataBits.push(((byte >> i) & 1) === 1);
    }
  }

  // Function to evaluate mask condition
  const maskConditions: ((r: number, c: number) => boolean)[] = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];

  // Pick optimal mask pattern based on penalty rules
  let bestScore = Infinity;
  let bestMask = 0;
  let bestModules: boolean[][] = [];

  for (let mask = 0; mask < 8; mask++) {
    const modules = baseModules.map((row) => row.slice());
    let bitIndex = 0;
    let upward = true;

    for (let col = N - 1; col > 0; col -= 2) {
      if (col === 6) col--; // Skip vertical timing column
      const rows = upward
        ? Array.from({ length: N }, (_, i) => N - 1 - i)
        : Array.from({ length: N }, (_, i) => i);

      for (const row of rows) {
        for (const c of [col, col - 1]) {
          if (!isFunction[row][c]) {
            const bit = bitIndex < dataBits.length ? dataBits[bitIndex++] : false;
            const maskBit = maskConditions[mask](row, c);
            modules[row][c] = bit !== maskBit;
          }
        }
      }
      upward = !upward;
    }

    // Write Format Bits into matrix
    const formatBits = computeFormatBits(ecLevel, mask);
    // Format bits around top-left finder
    for (let i = 0; i <= 5; i++) {
      modules[8][i] = ((formatBits >> (14 - i)) & 1) === 1;
    }
    modules[8][7] = ((formatBits >> 8) & 1) === 1;
    modules[8][8] = ((formatBits >> 7) & 1) === 1;
    modules[7][8] = ((formatBits >> 6) & 1) === 1;
    for (let i = 9; i <= 14; i++) {
      modules[14 - i][8] = ((formatBits >> (14 - i)) & 1) === 1;
    }

    // Format bits around top-right & bottom-left finders
    for (let i = 0; i <= 7; i++) {
      modules[8][N - 1 - i] = ((formatBits >> i) & 1) === 1;
    }
    for (let i = 0; i <= 6; i++) {
      modules[N - 7 + i][8] = ((formatBits >> (8 + i)) & 1) === 1;
    }

    // Write Version Information Bits for Version >= 7
    if (version >= 7) {
      const vBits = computeVersionBits(version);
      for (let i = 0; i < 18; i++) {
        const bit = ((vBits >> i) & 1) === 1;
        // Block 1: above bottom-left finder (rows N-11 to N-9, cols 0 to 5)
        const r1 = N - 11 + (i % 3);
        const c1 = Math.floor(i / 3);
        modules[r1][c1] = bit;

        // Block 2: left of top-right finder (rows 0 to 5, cols N-11 to N-9)
        const r2 = Math.floor(i / 3);
        const c2 = N - 11 + (i % 3);
        modules[r2][c2] = bit;
      }
    }

    // Evaluate penalty score (N1, N2, N3, N4)
    const penalty = calculatePenalty(modules).total;

    if (penalty < bestScore) {
      bestScore = penalty;
      bestMask = mask;
      bestModules = modules;
    }
  }

  return {
    version,
    errorCorrectionLevel: ecLevel,
    maskPattern: bestMask,
    size: N,
    modules: bestModules,
  };
}
