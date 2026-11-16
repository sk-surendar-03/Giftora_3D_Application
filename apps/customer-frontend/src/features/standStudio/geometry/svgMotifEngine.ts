import * as THREE from 'three';
import type { DecorativeMotif } from '../types/design';
import { mergeRawGeometries } from './csg';

export function buildMotifGeometry(
  motif: DecorativeMotif,
  size: number,
  depth: number
): THREE.BufferGeometry | null {
  if (motif === 'none') return null;

  const r = Math.max(3, size * 0.5);
  const shape = new THREE.Shape();

  switch (motif) {
    case 'star': {
      const spikes = 5;
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? r : r * 0.44;
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * rad;
        const y = -Math.sin(a) * rad;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      break;
    }
    case 'heart': {
      const s = r * 0.085;
      shape.moveTo(0, -6 * s);
      shape.bezierCurveTo(6 * s, -12 * s, 14 * s, -4 * s, 0, 10 * s);
      shape.bezierCurveTo(-14 * s, -4 * s, -6 * s, -12 * s, 0, -6 * s);
      break;
    }
    case 'flower': {
      const petals = 6;
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const rad = r * (0.58 + 0.42 * Math.cos(petals * t));
        const x = Math.cos(t) * rad;
        const y = Math.sin(t) * rad;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      break;
    }
    case 'leaf': {
      shape.moveTo(0, -r);
      shape.quadraticCurveTo(r * 0.9, -r * 0.1, 0, r);
      shape.quadraticCurveTo(-r * 0.9, -r * 0.1, 0, -r);
      break;
    }
    case 'gear': {
      const teeth = 8;
      const innerR = r * 0.72;
      for (let i = 0; i < teeth * 4; i++) {
        const sector = i % 4;
        const rad = sector === 1 || sector === 2 ? r : innerR;
        const a = (i / (teeth * 4)) * Math.PI * 2;
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      const hole = new THREE.Path();
      hole.absarc(0, 0, r * 0.3, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      break;
    }
    case 'hexagon': {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      break;
    }
    case 'diamond': {
      shape.moveTo(0, r);
      shape.lineTo(r * 0.72, 0);
      shape.lineTo(0, -r);
      shape.lineTo(-r * 0.72, 0);
      shape.closePath();
      break;
    }
  }

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.5, depth),
    bevelEnabled: true,
    bevelThickness: Math.min(0.25, depth * 0.2),
    bevelSize: 0.2,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geom.computeBoundingBox();
  if (geom.boundingBox) {
    const cx = (geom.boundingBox.min.x + geom.boundingBox.max.x) / 2;
    const cy = (geom.boundingBox.min.y + geom.boundingBox.max.y) / 2;
    geom.translate(-cx, -cy, 0);
  }
  geom.computeVertexNormals();
  return geom;
}

export interface SvgValidationResult {
  valid: boolean;
  error?: string;
  pathCount: number;
  geometry: THREE.BufferGeometry | null;
}

/**
 * Pure-TS SVG path extractor and validator so uploaded SVG logos work reliably
 * in both browser and headless Node tests without fragile DOM dependencies.
 */
export function parseAndExtrudeSvgLogo(
  svgString: string,
  targetSizeMm = 18,
  depthMm = 1.6
): SvgValidationResult {
  if (!svgString || typeof svgString !== 'string') {
    return { valid: false, error: 'Empty SVG content.', pathCount: 0, geometry: null };
  }
  if (!svgString.includes('<svg')) {
    return { valid: false, error: 'File does not contain a valid <svg> root element.', pathCount: 0, geometry: null };
  }

  // Extract d="..." attributes from <path> elements
  const pathMatches = [...svgString.matchAll(/<path[^>]*\sd=["']([^"']+)["'][^>]*>/gi)];
  // Also support basic <rect> and <circle> elements
  const rectMatches = [...svgString.matchAll(/<rect[^>]*>/gi)];
  const circleMatches = [...svgString.matchAll(/<circle[^>]*>/gi)];

  const shapes: THREE.Shape[] = [];

  for (const match of pathMatches) {
    const d = match[1];
    const parsed = parseSvgPathDataToShapes(d);
    shapes.push(...parsed);
  }

  for (const match of rectMatches) {
    const tag = match[0];
    const x = readNumAttr(tag, 'x') ?? 0;
    const y = readNumAttr(tag, 'y') ?? 0;
    const w = readNumAttr(tag, 'width') ?? 0;
    const h = readNumAttr(tag, 'height') ?? 0;
    if (w > 0 && h > 0) {
      const s = new THREE.Shape();
      s.moveTo(x, -y);
      s.lineTo(x + w, -y);
      s.lineTo(x + w, -(y + h));
      s.lineTo(x, -(y + h));
      s.closePath();
      shapes.push(s);
    }
  }

  for (const match of circleMatches) {
    const tag = match[0];
    const cx = readNumAttr(tag, 'cx') ?? 0;
    const cy = readNumAttr(tag, 'cy') ?? 0;
    const r = readNumAttr(tag, 'r') ?? 0;
    if (r > 0) {
      const s = new THREE.Shape();
      s.absarc(cx, -cy, r, 0, Math.PI * 2, false);
      shapes.push(s);
    }
  }

  if (shapes.length === 0) {
    return {
      valid: false,
      error: 'No convertible vector <path>, <rect>, or <circle> geometry found in SVG.',
      pathCount: 0,
      geometry: null,
    };
  }

  try {
    const extrudeGeoms = shapes.slice(0, 24).map(
      (s) =>
        new THREE.ExtrudeGeometry(s, {
          depth: Math.max(0.5, depthMm),
          bevelEnabled: false,
          curveSegments: 8,
        })
    );
    const merged = mergeRawGeometries(extrudeGeoms);
    extrudeGeoms.forEach((g) => g.dispose());
    merged.computeBoundingBox();

    if (!merged.boundingBox) {
      merged.dispose();
      return { valid: false, error: 'Failed to compute SVG bounds.', pathCount: shapes.length, geometry: null };
    }

    const sizeVec = new THREE.Vector3();
    merged.boundingBox.getSize(sizeVec);
    const maxSpan = Math.max(sizeVec.x, sizeVec.y);
    if (maxSpan < 1e-4) {
      merged.dispose();
      return { valid: false, error: 'SVG paths have zero 2D area.', pathCount: shapes.length, geometry: null };
    }

    const scale = targetSizeMm / maxSpan;
    const center = new THREE.Vector3();
    merged.boundingBox.getCenter(center);
    merged.translate(-center.x, -center.y, -merged.boundingBox.min.z);
    merged.scale(scale, scale, 1);
    merged.computeVertexNormals();
    merged.computeBoundingBox();

    return {
      valid: true,
      pathCount: shapes.length,
      geometry: merged,
    };
  } catch {
    return {
      valid: false,
      error: 'Could not triangulate SVG paths into printable geometry.',
      pathCount: shapes.length,
      geometry: null,
    };
  }
}

function readNumAttr(tag: string, attr: string): number | null {
  const m = tag.match(new RegExp(`${attr}=["']([-+]?\\d*\\.?\\d+)["']`, 'i'));
  return m ? parseFloat(m[1]) : null;
}

/**
 * Parses common SVG path commands (M/m, L/l, H/h, V/v, Q/q, C/c, Z/z) into THREE.Shape[].
 */
function parseSvgPathDataToShapes(d: string): THREE.Shape[] {
  const shapePath = new THREE.ShapePath();
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return [];

  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  const nextNum = () => parseFloat(tokens[i++] || '0');
  const isCmd = (t: string) => /^[a-zA-Z]$/.test(t);

  while (i < tokens.length) {
    if (isCmd(tokens[i])) {
      cmd = tokens[i++];
      if (cmd === 'Z' || cmd === 'z') {
        shapePath.currentPath?.closePath();
        cx = sx;
        cy = sy;
        continue;
      }
    }

    switch (cmd) {
      case 'M': {
        cx = nextNum();
        cy = nextNum();
        sx = cx;
        sy = cy;
        shapePath.moveTo(cx, -cy);
        cmd = 'L';
        break;
      }
      case 'm': {
        cx += nextNum();
        cy += nextNum();
        sx = cx;
        sy = cy;
        shapePath.moveTo(cx, -cy);
        cmd = 'l';
        break;
      }
      case 'L': {
        cx = nextNum();
        cy = nextNum();
        shapePath.lineTo(cx, -cy);
        break;
      }
      case 'l': {
        cx += nextNum();
        cy += nextNum();
        shapePath.lineTo(cx, -cy);
        break;
      }
      case 'H': {
        cx = nextNum();
        shapePath.lineTo(cx, -cy);
        break;
      }
      case 'h': {
        cx += nextNum();
        shapePath.lineTo(cx, -cy);
        break;
      }
      case 'V': {
        cy = nextNum();
        shapePath.lineTo(cx, -cy);
        break;
      }
      case 'v': {
        cy += nextNum();
        shapePath.lineTo(cx, -cy);
        break;
      }
      case 'Q': {
        const qx = nextNum();
        const qy = nextNum();
        cx = nextNum();
        cy = nextNum();
        shapePath.quadraticCurveTo(qx, -qy, cx, -cy);
        break;
      }
      case 'q': {
        const qx = cx + nextNum();
        const qy = cy + nextNum();
        cx += nextNum();
        cy += nextNum();
        shapePath.quadraticCurveTo(qx, -qy, cx, -cy);
        break;
      }
      case 'C': {
        const x1 = nextNum();
        const y1 = nextNum();
        const x2 = nextNum();
        const y2 = nextNum();
        cx = nextNum();
        cy = nextNum();
        shapePath.bezierCurveTo(x1, -y1, x2, -y2, cx, -cy);
        break;
      }
      case 'c': {
        const x1 = cx + nextNum();
        const y1 = cy + nextNum();
        const x2 = cx + nextNum();
        const y2 = cy + nextNum();
        cx += nextNum();
        cy += nextNum();
        shapePath.bezierCurveTo(x1, -y1, x2, -y2, cx, -cy);
        break;
      }
      default: {
        // Consume unknown token safely to avoid infinite loop
        i++;
        break;
      }
    }
  }

  return shapePath.toShapes();
}
