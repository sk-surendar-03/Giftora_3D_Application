import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {
  DecorationElement,
  DecorationKind,
  FontCategory,
  LogoConfig,
  TextElement,
} from '../types/studio';
import { buildVectorPolygons, extractContoursFromGrid } from './contourTrace';

const FONT_STACK_MAP: Record<FontCategory, { family: string; weight: string; italic?: boolean }> = {
  Modern: { family: "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif", weight: '600' },
  Bold: { family: "'Outfit', 'Arial Black', Impact, sans-serif", weight: '800' },
  Minimal: { family: "'Plus Jakarta Sans', Helvetica, Arial, sans-serif", weight: '500' },
  Elegant: { family: "Georgia, 'Times New Roman', serif", weight: '600' },
  Rounded: { family: "'Outfit', 'Trebuchet MS', Arial, sans-serif", weight: '700' },
  Handwriting: { family: "'Brush Script MT', 'Segoe Script', cursive", weight: '600', italic: true },
  Retro: { family: "'Courier New', 'Trebuchet MS', monospace", weight: '700' },
  Premium: { family: "'Palatino Linotype', Georgia, serif", weight: '700' },
  Playful: { family: "'Comic Sans MS', 'Trebuchet MS', sans-serif", weight: '700' },
};

export function roundedRectShape(
  width: number,
  height: number,
  radius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);

  if (r <= 0.05) {
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();
    return shape;
  }

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(hw, hh - r);
  shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-hw + r, hh);
  shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw, -hh + r);
  shape.absarc(-hw + r, -hh + r, r, Math.PI, (Math.PI * 3) / 2, false);
  shape.closePath();
  return shape;
}

export function normalizeGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const nonIndexed = geo.index ? geo.toNonIndexed() : geo.clone();
  if (!nonIndexed.attributes.normal) {
    nonIndexed.computeVertexNormals();
  }
  const clean = new THREE.BufferGeometry();
  clean.setAttribute('position', nonIndexed.attributes.position);
  clean.setAttribute('normal', nonIndexed.attributes.normal);
  if (nonIndexed !== geo) nonIndexed.dispose();
  return clean;
}

export function mergeSafe(geos: (THREE.BufferGeometry | null | undefined)[]): THREE.BufferGeometry | null {
  const valid = geos.filter(
    (g): g is THREE.BufferGeometry => Boolean(g && g.attributes.position && g.attributes.position.count > 0)
  );
  if (valid.length === 0) return null;
  const normalized = valid.map(normalizeGeometry);
  const merged = mergeGeometries(normalized, false);
  normalized.forEach((g) => g.dispose());
  return merged;
}

export function buildTextGeometry3D(textEl: TextElement): THREE.BufferGeometry | null {
  const content = textEl.content.trim();
  if (!content || !textEl.visible) return null;

  if (typeof document === 'undefined') {
    // In headless Node test environments without HTML5 Canvas, return an extruded placeholder block
    const approxCharWidth = textEl.fontSizeMm * 0.6;
    const totalW = content.length * approxCharWidth;
    const box = new THREE.BoxGeometry(totalW, textEl.fontSizeMm, textEl.depthMm);
    box.translate(textEl.xMm, textEl.yMm, textEl.depthMm / 2);
    return box;
  }

  const fontSpec = FONT_STACK_MAP[textEl.category] || FONT_STACK_MAP.Modern;
  const pxPerMm = 6;
  const fontPx = Math.max(22, Math.min(72, Math.round(textEl.fontSizeMm * pxPerMm)));
  const fontStr = `${fontSpec.italic ? 'italic ' : ''}${fontSpec.weight} ${fontPx}px ${fontSpec.family}`;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.font = fontStr;
  const letterSpacingPx = textEl.letterSpacing * pxPerMm;
  const chars = Array.from(content);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalTextWidth =
    widths.reduce((acc, w) => acc + w, 0) + Math.max(0, chars.length - 1) * letterSpacingPx;

  const pad = 8;
  const w = Math.max(32, Math.min(1024, Math.ceil(totalTextWidth + pad * 2)));
  const h = Math.max(24, Math.ceil(fontPx * 1.45 + pad * 2));

  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#000000';
  ctx.font = fontStr;
  ctx.textBaseline = 'middle';

  let cursorX = pad;
  const centerY = h / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursorX, centerY);
    cursorX += widths[i] + letterSpacingPx;
  }

  const img = ctx.getImageData(0, 0, w, h).data;
  const grid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    grid[i] = img[i * 4 + 3] >= 115 ? 1 : 0;
  }

  const loops = extractContoursFromGrid(grid, w, h);
  if (loops.length === 0) return null;

  const scaleMmPerPx = textEl.fontSizeMm / (fontPx * 0.72);
  const polygons = buildVectorPolygons(loops, w, h, scaleMmPerPx, 0.42);
  if (polygons.length === 0) return null;

  const shapes: THREE.Shape[] = polygons.map((poly) => {
    const shape = new THREE.Shape(poly.outer.map((p) => new THREE.Vector2(p.x, p.y)));
    poly.holes.forEach((holePts) => {
      const path = new THREE.Path(holePts.map((p) => new THREE.Vector2(p.x, p.y)));
      shape.holes.push(path);
    });
    return shape;
  });

  const extrudeDepth = Math.max(0.4, textEl.depthMm);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: extrudeDepth,
    bevelEnabled: textEl.mode === 'raised',
    bevelThickness: Math.min(0.18, extrudeDepth * 0.2),
    bevelSize: Math.min(0.12, extrudeDepth * 0.15),
    bevelSegments: 1,
    curveSegments: 4,
  });

  const normalized = normalizeGeometry(geo);
  geo.dispose();

  normalized.translate(textEl.xMm, textEl.yMm, 0);
  return normalized;
}

export function buildLogoFrameGeometry3D(
  logo: LogoConfig,
  frontZ = 0
): THREE.BufferGeometry | null {
  if (!logo.enabled || logo.frameStyle === 'none') return null;

  const size = logo.sizeMm;
  const borderW = 1.4;
  const depth = Math.max(0.6, logo.depthMm + 0.2);
  const z = frontZ + depth / 2;

  let geo: THREE.BufferGeometry;

  if (logo.frameStyle === 'circle') {
    const rOuter = size / 2 + borderW;
    const rInner = size / 2;
    const s = new THREE.Shape();
    s.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
    const h = new THREE.Path();
    h.absarc(0, 0, rInner, 0, Math.PI * 2, true);
    s.holes.push(h);

    geo = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.12,
      bevelSegments: 1,
      curveSegments: 24,
    });
  } else {
    const s = roundedRectShape(size + borderW * 2, size + borderW * 2, 4);
    const h = new THREE.Path(roundedRectShape(size, size, 3).getPoints(16).reverse());
    s.holes.push(h);

    geo = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.12,
      bevelSegments: 1,
    });
  }

  geo.translate(logo.xMm, logo.yMm, z - depth / 2);
  return geo;
}

export function buildDecorationGeometry3D(
  deco: DecorationElement,
  frontZ = 0
): THREE.BufferGeometry | null {
  if (!deco.visible) return null;
  const s = deco.sizeMm;
  const d = Math.max(0.6, deco.depthMm);

  let shape: THREE.Shape;
  if (deco.kind === 'heart') {
    shape = new THREE.Shape();
    const x = 0;
    const y = 0;
    const scale = s / 30;
    shape.moveTo(x, y - 6 * scale);
    shape.bezierCurveTo(x + 12 * scale, y + 6 * scale, x + 16 * scale, y + 18 * scale, x, y + 26 * scale);
    shape.bezierCurveTo(x - 16 * scale, y + 18 * scale, x - 12 * scale, y + 6 * scale, x, y - 6 * scale);
  } else if (deco.kind === 'star') {
    shape = new THREE.Shape();
    const rOuter = s / 2;
    const rInner = s / 4;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();
  } else {
    shape = roundedRectShape(s, s * 0.4, 2);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.1,
    bevelSegments: 1,
  });

  if (deco.rotationDeg !== 0) {
    geo.rotateZ((deco.rotationDeg * Math.PI) / 180);
  }
  geo.translate(deco.xMm, deco.yMm, frontZ);
  return geo;
}
