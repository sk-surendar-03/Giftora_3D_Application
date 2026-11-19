import * as THREE from 'three';
import {
  getFontById,
  hasTamilCharacters,
  isFontReadyInBrowser,
  resolveFontCssDescriptor,
} from '../core/fonts';
import { NameplateDesign, TextCaseTransform, TextLine } from '../core/types';
import { Point2D, TracedPolygon, traceAlphaContours } from './contourTracer';
import { pointsToHolePath, pointsToThreeShape } from './baseGeometry';

export interface LineGeometryResult {
  lineId: string;
  color: string;
  shapes: THREE.Shape[];
  polygonsMm: TracedPolygon[];
  boundsMm: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
}

export interface TextAssemblyMeasurement {
  widthMm: number;
  heightMm: number;
  islandCount: number;
  lines: LineGeometryResult[];
}

const traceCache = new Map<string, LineGeometryResult>();

export function applyTextCaseTransform(text: string, transform?: TextCaseTransform): string {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, (ch) => ch.toUpperCase());
    default:
      return text;
  }
}

function splitGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function buildCacheKey(line: TextLine, transformedText: string, maxWidthMm: number): string {
  return [
    transformedText,
    line.fontId,
    line.fontSize.toFixed(2),
    line.letterSpacing.toFixed(2),
    line.align,
    line.bold ? '1' : '0',
    line.italic ? '1' : '0',
    line.yOffset.toFixed(2),
    maxWidthMm.toFixed(1),
  ].join('|');
}

/**
 * Generates real 2D vector polygons (outer contours + holes) in millimeters
 * for a single TextLine using Canvas2D HarfBuzz shaping (supporting English & Tamil)
 * and Marching Squares contour tracing.
 */
export function buildTextLineContours(
  line: TextLine,
  plateWidthMm: number,
  clearanceMm: number,
): LineGeometryResult {
  const emptyResult: LineGeometryResult = {
    lineId: line.id,
    color: line.color,
    shapes: [],
    polygonsMm: [],
    boundsMm: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
  };

  const trimmed = applyTextCaseTransform(line.text.trim(), line.textTransform);
  if (!trimmed || typeof document === 'undefined') {
    return emptyResult;
  }

  const fontReady = isFontReadyInBrowser(line.fontId, line.bold, line.italic);
  const cacheKey = buildCacheKey(line, trimmed, plateWidthMm);
  if (fontReady) {
    const cached = traceCache.get(cacheKey);
    if (cached) {
      return { ...cached, lineId: line.id, color: line.color };
    }
  }

  const fontSpec = getFontById(line.fontId);
  const usesTamil = hasTamilCharacters(trimmed);
  const resolvedFamily =
    usesTamil && !fontSpec.supportsTamil
      ? `"Noto Sans Tamil", "${fontSpec.family}", sans-serif`
      : `"${fontSpec.family}", "Noto Sans Tamil", ${fontSpec.fallback}`;

  const { weight, style } = resolveFontCssDescriptor(fontSpec, line.bold, line.italic);

  // Rasterize at high resolution (pixels per mm) for crisp curves
  const pxPerMm = Math.max(7, Math.min(12, Math.round(110 / Math.max(8, line.fontSize))));
  const fontPx = Math.max(24, line.fontSize * pxPerMm * 1.28);

  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) return emptyResult;

  const fontStr = `${style} ${weight} ${fontPx}px ${resolvedFamily}`;
  mctx.font = fontStr;

  const extraTrackingPx = line.letterSpacing * pxPerMm;
  const graphemes = splitGraphemes(trimmed);
  const useManualSpacing = Math.abs(line.letterSpacing) > 0.05 && !usesTamil;

  let textPxWidth = 0;
  if (useManualSpacing) {
    for (let i = 0; i < graphemes.length; i++) {
      textPxWidth += mctx.measureText(graphemes[i]).width;
      if (i < graphemes.length - 1) textPxWidth += extraTrackingPx;
    }
  } else {
    textPxWidth = mctx.measureText(trimmed).width;
  }

  const padPx = Math.ceil(fontPx * 0.55);
  const canvasW = Math.min(2048, Math.max(64, Math.ceil(textPxWidth + padPx * 2)));
  const canvasH = Math.min(512, Math.max(64, Math.ceil(fontPx * 2.0 + padPx)));

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return emptyResult;

  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#ffffff';
  ctx.font = fontStr;
  ctx.textBaseline = 'middle';

  const centerY = canvasH / 2;
  if (useManualSpacing) {
    let cursorX = (canvasW - textPxWidth) / 2;
    ctx.textAlign = 'left';
    for (let i = 0; i < graphemes.length; i++) {
      const g = graphemes[i];
      ctx.fillText(g, cursorX, centerY);
      cursorX += mctx.measureText(g).width + extraTrackingPx;
    }
  } else {
    ctx.textAlign = 'center';
    ctx.fillText(trimmed, canvasW / 2, centerY);
  }

  const imgData = ctx.getImageData(0, 0, canvasW, canvasH).data;
  const alpha = new Uint8Array(canvasW * canvasH);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = imgData[i * 4 + 3];
  }

  const rawPolys = traceAlphaContours(alpha, canvasW, canvasH, {
    threshold: 118,
    simplifyEpsilon: 0.42,
    minAreaPx: 5,
  });

  if (rawPolys.length === 0) return emptyResult;

  // Convert pixel coordinates to millimeter coordinates centered around line's X alignment & Y offset
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const polygonsMmRaw: TracedPolygon[] = rawPolys.map((poly) => {
    const mapPt = (p: Point2D): Point2D => {
      const mx = p.x / pxPerMm;
      const my = p.y / pxPerMm;
      if (mx < minX) minX = mx;
      if (mx > maxX) maxX = mx;
      if (my < minY) minY = my;
      if (my > maxY) maxY = my;
      return { x: mx, y: my };
    };
    return {
      outer: poly.outer.map(mapPt),
      holes: poly.holes.map((h) => h.map(mapPt)),
    };
  });

  const rawW = maxX - minX;
  const rawH = maxY - minY;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const usableHalfW = Math.max(10, plateWidthMm / 2 - clearanceMm);
  let shiftX = -midX;
  if (line.align === 'left') {
    shiftX = -usableHalfW - minX;
  } else if (line.align === 'right') {
    shiftX = usableHalfW - maxX;
  }
  const shiftY = line.yOffset - midY;

  const polygonsMm: TracedPolygon[] = polygonsMmRaw.map((poly) => ({
    outer: poly.outer.map((p) => ({ x: p.x + shiftX, y: p.y + shiftY })),
    holes: poly.holes.map((h) => h.map((p) => ({ x: p.x + shiftX, y: p.y + shiftY }))),
  }));

  const shapes: THREE.Shape[] = polygonsMm.map((poly) => {
    const s = pointsToThreeShape(poly.outer);
    for (const hole of poly.holes) {
      s.holes.push(pointsToHolePath(hole));
    }
    return s;
  });

  const finalBounds = {
    minX: minX + shiftX,
    maxX: maxX + shiftX,
    minY: minY + shiftY,
    maxY: maxY + shiftY,
    width: rawW,
    height: rawH,
  };

  const result: LineGeometryResult = {
    lineId: line.id,
    color: line.color,
    shapes,
    polygonsMm,
    boundsMm: finalBounds,
  };

  // Only cache once the real requested webfont has actually loaded in the browser
  if (fontReady) {
    if (traceCache.size > 100) {
      const firstKey = traceCache.keys().next().value;
      if (firstKey) traceCache.delete(firstKey);
    }
    traceCache.set(cacheKey, result);
  }
  return result;
}

export function buildAllTextLines(design: NameplateDesign): TextAssemblyMeasurement {
  const results = design.lines.map((line) =>
    buildTextLineContours(line, design.widthMm, design.textClearanceMm),
  );

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let islandCount = 0;

  for (const r of results) {
    islandCount += r.polygonsMm.length;
    if (r.polygonsMm.length > 0) {
      minX = Math.min(minX, r.boundsMm.minX);
      maxX = Math.max(maxX, r.boundsMm.maxX);
      minY = Math.min(minY, r.boundsMm.minY);
      maxY = Math.max(maxY, r.boundsMm.maxY);
    }
  }

  return {
    widthMm: minX <= maxX ? maxX - minX : 0,
    heightMm: minY <= maxY ? maxY - minY : 0,
    islandCount,
    lines: results,
  };
}
