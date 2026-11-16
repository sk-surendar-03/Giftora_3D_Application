import * as THREE from 'three';
import type { FontStyleId, TextAlignment } from '../types/design';
import { mergeRawGeometries } from './csg';

type Point2 = [number, number];
type Stroke = Point2[];

/**
 * Clean geometric vector glyphs normalized in a [0..1] x [0..1] cell.
 * Works identically in browser and Node.js with zero external font network requests.
 */
const GLYPHS: Record<string, { width: number; strokes: Stroke[] }> = {
  A: { width: 0.72, strokes: [[[0.04, 0], [0.36, 1], [0.68, 0]], [[0.16, 0.34], [0.56, 0.34]]] },
  B: { width: 0.68, strokes: [[[0.08, 0], [0.08, 1], [0.46, 1], [0.6, 0.88], [0.6, 0.62], [0.46, 0.52], [0.08, 0.52]], [[0.46, 0.52], [0.64, 0.4], [0.64, 0.12], [0.48, 0], [0.08, 0]]] },
  C: { width: 0.68, strokes: [[[0.62, 0.84], [0.46, 1], [0.22, 1], [0.06, 0.82], [0.06, 0.18], [0.22, 0], [0.46, 0], [0.62, 0.16]]] },
  D: { width: 0.7, strokes: [[[0.08, 0], [0.08, 1], [0.42, 1], [0.64, 0.8], [0.64, 0.2], [0.42, 0], [0.08, 0]]] },
  E: { width: 0.62, strokes: [[[0.56, 1], [0.08, 1], [0.08, 0], [0.58, 0]], [[0.08, 0.52], [0.46, 0.52]]] },
  F: { width: 0.58, strokes: [[[0.54, 1], [0.08, 1], [0.08, 0]], [[0.08, 0.52], [0.44, 0.52]]] },
  G: { width: 0.72, strokes: [[[0.62, 0.84], [0.46, 1], [0.22, 1], [0.06, 0.82], [0.06, 0.18], [0.22, 0], [0.48, 0], [0.64, 0.18], [0.64, 0.48], [0.38, 0.48]]] },
  H: { width: 0.7, strokes: [[[0.08, 0], [0.08, 1]], [[0.62, 0], [0.62, 1]], [[0.08, 0.52], [0.62, 0.52]]] },
  I: { width: 0.34, strokes: [[[0.17, 0], [0.17, 1]], [[0.04, 1], [0.3, 1]], [[0.04, 0], [0.3, 0]]] },
  J: { width: 0.58, strokes: [[[0.5, 1], [0.5, 0.22], [0.36, 0], [0.18, 0], [0.06, 0.16]]] },
  K: { width: 0.68, strokes: [[[0.08, 0], [0.08, 1]], [[0.6, 1], [0.12, 0.48], [0.62, 0]]] },
  L: { width: 0.58, strokes: [[[0.08, 1], [0.08, 0], [0.54, 0]]] },
  M: { width: 0.8, strokes: [[[0.06, 0], [0.06, 1], [0.4, 0.38], [0.74, 1], [0.74, 0]]] },
  N: { width: 0.7, strokes: [[[0.08, 0], [0.08, 1], [0.62, 0], [0.62, 1]]] },
  O: { width: 0.72, strokes: [[[0.24, 1], [0.48, 1], [0.66, 0.82], [0.66, 0.18], [0.48, 0], [0.24, 0], [0.06, 0.18], [0.06, 0.82], [0.24, 1]]] },
  P: { width: 0.66, strokes: [[[0.08, 0], [0.08, 1], [0.46, 1], [0.6, 0.86], [0.6, 0.62], [0.46, 0.48], [0.08, 0.48]]] },
  Q: { width: 0.72, strokes: [[[0.24, 1], [0.48, 1], [0.66, 0.82], [0.66, 0.18], [0.48, 0], [0.24, 0], [0.06, 0.18], [0.06, 0.82], [0.24, 1]], [[0.42, 0.24], [0.68, -0.04]]] },
  R: { width: 0.68, strokes: [[[0.08, 0], [0.08, 1], [0.46, 1], [0.6, 0.86], [0.6, 0.62], [0.46, 0.48], [0.08, 0.48]], [[0.38, 0.48], [0.62, 0]]] },
  S: { width: 0.64, strokes: [[[0.56, 0.86], [0.44, 1], [0.2, 1], [0.08, 0.86], [0.08, 0.64], [0.22, 0.54], [0.46, 0.48], [0.58, 0.36], [0.58, 0.14], [0.44, 0], [0.2, 0], [0.06, 0.14]]] },
  T: { width: 0.64, strokes: [[[0.04, 1], [0.6, 1]], [[0.32, 1], [0.32, 0]]] },
  U: { width: 0.7, strokes: [[[0.08, 1], [0.08, 0.22], [0.24, 0], [0.46, 0], [0.62, 0.22], [0.62, 1]]] },
  V: { width: 0.7, strokes: [[[0.06, 1], [0.35, 0], [0.64, 1]]] },
  W: { width: 0.88, strokes: [[[0.04, 1], [0.24, 0], [0.44, 0.62], [0.64, 0], [0.84, 1]]] },
  X: { width: 0.68, strokes: [[[0.06, 1], [0.62, 0]], [[0.62, 1], [0.06, 0]]] },
  Y: { width: 0.66, strokes: [[[0.06, 1], [0.33, 0.5], [0.6, 1]], [[0.33, 0.5], [0.33, 0]]] },
  Z: { width: 0.64, strokes: [[[0.06, 1], [0.58, 1], [0.06, 0], [0.58, 0]]] },
  '0': { width: 0.66, strokes: [[[0.22, 1], [0.44, 1], [0.6, 0.82], [0.6, 0.18], [0.44, 0], [0.22, 0], [0.06, 0.18], [0.06, 0.82], [0.22, 1]], [[0.14, 0.2], [0.52, 0.8]]] },
  '1': { width: 0.44, strokes: [[[0.1, 0.8], [0.26, 1], [0.26, 0]], [[0.08, 0], [0.4, 0]]] },
  '2': { width: 0.64, strokes: [[[0.08, 0.82], [0.22, 1], [0.46, 1], [0.58, 0.84], [0.58, 0.64], [0.08, 0], [0.58, 0]]] },
  '3': { width: 0.64, strokes: [[[0.08, 0.86], [0.22, 1], [0.46, 1], [0.58, 0.84], [0.58, 0.64], [0.42, 0.52], [0.26, 0.52]], [[0.42, 0.52], [0.58, 0.4], [0.58, 0.16], [0.44, 0], [0.2, 0], [0.08, 0.14]]] },
  '4': { width: 0.66, strokes: [[[0.48, 0], [0.48, 1], [0.06, 0.34], [0.6, 0.34]]] },
  '5': { width: 0.64, strokes: [[[0.56, 1], [0.1, 1], [0.1, 0.56], [0.44, 0.56], [0.58, 0.42], [0.58, 0.14], [0.44, 0], [0.18, 0], [0.08, 0.12]]] },
  '6': { width: 0.64, strokes: [[[0.54, 0.88], [0.4, 1], [0.22, 1], [0.08, 0.8], [0.08, 0.18], [0.22, 0], [0.46, 0], [0.58, 0.18], [0.58, 0.42], [0.44, 0.54], [0.08, 0.54]]] },
  '7': { width: 0.62, strokes: [[[0.06, 1], [0.56, 1], [0.22, 0]]] },
  '8': { width: 0.66, strokes: [[[0.22, 0.52], [0.1, 0.64], [0.1, 0.86], [0.24, 1], [0.42, 1], [0.56, 0.86], [0.56, 0.64], [0.44, 0.52], [0.22, 0.52], [0.08, 0.4], [0.08, 0.14], [0.22, 0], [0.44, 0], [0.58, 0.14], [0.58, 0.4], [0.44, 0.52]]] },
  '9': { width: 0.64, strokes: [[[0.1, 0.12], [0.24, 0], [0.44, 0], [0.56, 0.2], [0.56, 0.82], [0.44, 1], [0.2, 1], [0.08, 0.82], [0.08, 0.58], [0.22, 0.46], [0.56, 0.46]]] },
  '-': { width: 0.46, strokes: [[[0.06, 0.48], [0.4, 0.48]]] },
  '.': { width: 0.24, strokes: [[[0.12, 0.04], [0.12, 0.1]]] },
  '!': { width: 0.26, strokes: [[[0.13, 1], [0.13, 0.3]], [[0.13, 0.04], [0.13, 0.1]]] },
  '&': { width: 0.74, strokes: [[[0.66, 0], [0.14, 0.68], [0.14, 0.88], [0.28, 1], [0.44, 1], [0.54, 0.86], [0.54, 0.7], [0.08, 0.26], [0.08, 0.1], [0.22, 0], [0.44, 0], [0.68, 0.34]]] },
  '+': { width: 0.56, strokes: [[[0.28, 0.2], [0.28, 0.8]], [[0.04, 0.5], [0.52, 0.5]]] },
  '/': { width: 0.48, strokes: [[[0.06, 0], [0.42, 1]]] },
  ':': { width: 0.26, strokes: [[[0.13, 0.64], [0.13, 0.7]], [[0.13, 0.12], [0.13, 0.18]]] },
  "'": { width: 0.24, strokes: [[[0.12, 0.72], [0.12, 1]]] },
  ' ': { width: 0.42, strokes: [] },
};

function createCapsuleShape(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  roundedCaps: boolean
): THREE.Shape {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);

  const shape = new THREE.Shape();
  if (len < 1e-4) {
    shape.absarc(x0, y0, radius, 0, Math.PI * 2, false);
    return shape;
  }

  const angle = Math.atan2(dy, dx);
  const nx = (-dy / len) * radius;
  const ny = (dx / len) * radius;

  if (roundedCaps) {
    shape.moveTo(x0 + nx, y0 + ny);
    shape.lineTo(x1 + nx, y1 + ny);
    shape.absarc(x1, y1, radius, angle + Math.PI / 2, angle - Math.PI / 2, true);
    shape.lineTo(x0 - nx, y0 - ny);
    shape.absarc(x0, y0, radius, angle - Math.PI / 2, angle + Math.PI / 2, true);
  } else {
    const ex = (dx / len) * radius * 0.45;
    const ey = (dy / len) * radius * 0.45;
    shape.moveTo(x0 - ex + nx, y0 - ey + ny);
    shape.lineTo(x1 + ex + nx, y1 + ey + ny);
    shape.lineTo(x1 + ex - nx, y1 + ey - ny);
    shape.lineTo(x0 - ex - nx, y0 - ey - ny);
    shape.closePath();
  }
  return shape;
}

export interface TextGeometryOptions {
  text: string;
  fontStyle: FontStyleId;
  fontSize: number;
  letterSpacing: number;
  alignment: TextAlignment;
  depth: number;
  curved?: boolean;
  curveRadius?: number;
}

/**
 * Generates watertight 3D extruded geometry for custom text lying in XY plane
 * extruded along +Z from z = 0 to z = depth.
 */
export function build3DTextGeometry(options: TextGeometryOptions): {
  geometry: THREE.BufferGeometry | null;
  width: number;
  height: number;
} {
  const cleanText = options.text.trim().slice(0, 24);
  if (!cleanText) {
    return { geometry: null, width: 0, height: 0 };
  }

  const size = Math.max(4, Math.min(24, options.fontSize));
  const depth = Math.max(0.4, Math.min(6, options.depth));
  const { fontStyle } = options;

  const strokeFactor =
    fontStyle === 'bold'
      ? 0.21
      : fontStyle === 'rounded' || fontStyle === 'playful'
        ? 0.17
        : fontStyle === 'cursive' || fontStyle === 'handwritten'
          ? 0.125
          : 0.14;

  const radius = size * strokeFactor * 0.5;
  const roundedCaps =
    fontStyle === 'rounded' ||
    fontStyle === 'playful' ||
    fontStyle === 'cursive' ||
    fontStyle === 'handwritten';
  const italicShear =
    fontStyle === 'cursive' ? 0.25 : fontStyle === 'handwritten' ? 0.13 : 0;
  const trackingMult = fontStyle === 'futuristic' ? 1.18 : 1.0;
  const gap = size * 0.18 * options.letterSpacing * trackingMult;

  const chars = Array.from(cleanText.toUpperCase());
  const charWidths = chars.map((ch) => (GLYPHS[ch] ?? GLYPHS[' ']).width * size);
  const totalWidth =
    charWidths.reduce((sum, w) => sum + w, 0) + Math.max(0, chars.length - 1) * gap;

  const geometries: THREE.BufferGeometry[] = [];
  let cursorX =
    options.alignment === 'center'
      ? -totalWidth / 2
      : options.alignment === 'right'
        ? -totalWidth
        : 0;

  chars.forEach((ch, idx) => {
    const glyph = GLYPHS[ch] ?? GLYPHS[' '];
    const w = charWidths[idx];
    const bounceY = fontStyle === 'playful' ? (idx % 2 === 0 ? 0.06 : -0.04) * size : 0;

    const charShapes: THREE.Shape[] = [];

    for (const stroke of glyph.strokes) {
      for (let i = 0; i < stroke.length - 1; i++) {
        const [sx0, sy0] = stroke[i];
        const [sx1, sy1] = stroke[i + 1];
        const x0 = cursorX + sx0 * size + sy0 * size * italicShear;
        const y0 = sy0 * size - size * 0.5 + bounceY;
        const x1 = cursorX + sx1 * size + sy1 * size * italicShear;
        const y1 = sy1 * size - size * 0.5 + bounceY;
        charShapes.push(createCapsuleShape(x0, y0, x1, y1, radius, roundedCaps));
      }

      // Serif terminal caps for 'serif' style
      if (fontStyle === 'serif' && stroke.length >= 2) {
        const endpoints = [stroke[0], stroke[stroke.length - 1]];
        for (const [ex, ey] of endpoints) {
          if (ey === 0 || ey === 1) {
            const cx = cursorX + ex * size;
            const cy = ey * size - size * 0.5;
            charShapes.push(
              createCapsuleShape(cx - radius * 1.6, cy, cx + radius * 1.6, cy, radius * 0.65, false)
            );
          }
        }
      }
    }

    if (charShapes.length > 0) {
      const extrude = new THREE.ExtrudeGeometry(charShapes, {
        depth,
        bevelEnabled: true,
        bevelThickness: Math.min(0.22, depth * 0.15),
        bevelSize: Math.min(0.18, radius * 0.25),
        bevelSegments: 1,
        curveSegments: roundedCaps ? 6 : 2,
      });

      if (options.curved && options.curveRadius && options.curveRadius > 10) {
        // Wrap around Y-axis cylinder at curveRadius
        const R = options.curveRadius;
        const charCenterX = cursorX + w / 2;
        const theta = charCenterX / R;
        extrude.translate(-charCenterX, 0, 0);
        extrude.rotateY(theta);
        extrude.translate(Math.sin(theta) * R, 0, Math.cos(theta) * R - R);
      }

      geometries.push(extrude);
    }

    cursorX += w + gap;
  });

  if (geometries.length === 0) {
    return { geometry: null, width: 0, height: size };
  }

  const merged = mergeRawGeometries(geometries);
  geometries.forEach((g) => g.dispose());
  merged.computeBoundingBox();

  return {
    geometry: merged,
    width: totalWidth,
    height: size,
  };
}
