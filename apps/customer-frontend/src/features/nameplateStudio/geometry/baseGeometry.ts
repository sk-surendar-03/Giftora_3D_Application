import * as THREE from 'three';
import { NameplateDesign, NameplateShape } from '../core/types';
import { Point2D } from './contourTracer';

export interface ShapeOutlineResult {
  shape: THREE.Shape;
  outerPoints: Point2D[];
}

function buildRoundedRectPoints(w: number, h: number, r: number): Point2D[] {
  const hw = w / 2;
  const hh = h / 2;
  const rad = Math.max(0, Math.min(r, hw - 0.5, hh - 0.5));
  if (rad < 0.2) {
    return [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];
  }
  const pts: Point2D[] = [];
  const segs = 8;
  const corners = [
    { cx: hw - rad, cy: -hh + rad, a0: -Math.PI / 2, a1: 0 },
    { cx: hw - rad, cy: hh - rad, a0: 0, a1: Math.PI / 2 },
    { cx: -hw + rad, cy: hh - rad, a0: Math.PI / 2, a1: Math.PI },
    { cx: -hw + rad, cy: -hh + rad, a0: Math.PI, a1: (Math.PI * 3) / 2 },
  ];
  for (const c of corners) {
    for (let i = 0; i <= segs; i++) {
      const a = c.a0 + ((c.a1 - c.a0) * i) / segs;
      pts.push({ x: c.cx + Math.cos(a) * rad, y: c.cy + Math.sin(a) * rad });
    }
  }
  return pts;
}

export function getBaseOutlinePoints(
  shapeType: NameplateShape,
  widthMm: number,
  heightMm: number,
  cornerRadiusMm: number,
  textBounds?: { width: number; height: number },
): Point2D[] {
  const w = Math.max(20, widthMm);
  const h = Math.max(15, heightMm);
  const hw = w / 2;
  const hh = h / 2;

  switch (shapeType) {
    case 'rectangle':
      return buildRoundedRectPoints(w, h, 0);

    case 'rounded-rectangle':
      return buildRoundedRectPoints(w, h, cornerRadiusMm);

    case 'oval': {
      const pts: Point2D[] = [];
      const segs = 64;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * hw, y: Math.sin(a) * hh });
      }
      return pts;
    }

    case 'circle': {
      const r = Math.min(hw, hh);
      const pts: Point2D[] = [];
      const segs = 64;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      return pts;
    }

    case 'hexagon': {
      const chamfer = Math.min(hw * 0.22, hh * 0.65);
      return [
        { x: -hw + chamfer, y: -hh },
        { x: hw - chamfer, y: -hh },
        { x: hw, y: 0 },
        { x: hw - chamfer, y: hh },
        { x: -hw + chamfer, y: hh },
        { x: -hw, y: 0 },
      ];
    }

    case 'octagon': {
      const cx = Math.min(hw * 0.28, hh * 0.48);
      const cy = Math.min(hh * 0.42, cx * 0.85);
      return [
        { x: -hw + cx, y: -hh },
        { x: hw - cx, y: -hh },
        { x: hw, y: -hh + cy },
        { x: hw, y: hh - cy },
        { x: hw - cx, y: hh },
        { x: -hw + cx, y: hh },
        { x: -hw, y: hh - cy },
        { x: -hw, y: -hh + cy },
      ];
    }

    case 'diamond': {
      return [
        { x: 0, y: -hh },
        { x: hw, y: 0 },
        { x: 0, y: hh },
        { x: -hw, y: 0 },
      ];
    }

    case 'shield': {
      return [
        { x: 0, y: -hh },
        { x: hw * 0.65, y: -hh * 0.68 },
        { x: hw, y: -hh * 0.05 },
        { x: hw * 0.94, y: hh * 0.78 },
        { x: 0, y: hh },
        { x: -hw * 0.94, y: hh * 0.78 },
        { x: -hw, y: -hh * 0.05 },
        { x: -hw * 0.65, y: -hh * 0.68 },
      ];
    }

    case 'crest': {
      return [
        { x: 0, y: -hh },
        { x: hw * 0.58, y: -hh * 0.75 },
        { x: hw * 0.92, y: -hh * 0.2 },
        { x: hw * 0.82, y: hh * 0.45 },
        { x: hw, y: hh * 0.78 },
        { x: hw * 0.48, y: hh * 0.82 },
        { x: 0, y: hh },
        { x: -hw * 0.48, y: hh * 0.82 },
        { x: -hw, y: hh * 0.78 },
        { x: -hw * 0.82, y: hh * 0.45 },
        { x: -hw * 0.92, y: -hh * 0.2 },
        { x: -hw * 0.58, y: -hh * 0.75 },
      ];
    }

    case 'cloud': {
      const pts: Point2D[] = [];
      const segs = 72;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const lobe = 1 + 0.1 * Math.cos(6 * a) + 0.05 * Math.sin(3 * a);
        pts.push({
          x: Math.cos(a) * hw * 0.92 * lobe,
          y: Math.sin(a) * hh * 0.88 * lobe,
        });
      }
      return pts;
    }

    case 'heart': {
      const pts: Point2D[] = [];
      const segs = 72;
      for (let i = 0; i < segs; i++) {
        // Parametric heart curve (CCW)
        const t = Math.PI - (i / segs) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy =
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t);
        pts.push({
          x: (hx / 16) * hw,
          y: ((hy + 2.5) / 15.5) * hh,
        });
      }
      return pts;
    }

    case 'arch': {
      const pts: Point2D[] = [];
      const archBaseY = hh * 0.15;
      pts.push({ x: -hw, y: -hh });
      pts.push({ x: hw, y: -hh });
      pts.push({ x: hw, y: archBaseY });
      const segs = 32;
      const archRy = hh - archBaseY;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI;
        pts.push({
          x: Math.cos(a) * hw,
          y: archBaseY + Math.sin(a) * archRy,
        });
      }
      pts.push({ x: -hw, y: archBaseY });
      return pts;
    }

    case 'scalloped': {
      const pts: Point2D[] = [];
      const segs = 96;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const rMod = 0.92 + 0.08 * Math.abs(Math.sin(7 * a));
        pts.push({
          x: Math.cos(a) * hw * rMod,
          y: Math.sin(a) * hh * rMod,
        });
      }
      return pts;
    }

    case 'ribbon-banner': {
      return [
        { x: -hw, y: -hh * 0.72 },
        { x: -hw * 0.7, y: -hh * 0.72 },
        { x: -hw * 0.62, y: -hh },
        { x: hw * 0.62, y: -hh },
        { x: hw * 0.7, y: -hh * 0.72 },
        { x: hw, y: -hh * 0.72 },
        { x: hw * 0.88, y: 0 },
        { x: hw, y: hh * 0.72 },
        { x: hw * 0.7, y: hh * 0.72 },
        { x: hw * 0.62, y: hh },
        { x: -hw * 0.62, y: hh },
        { x: -hw * 0.7, y: hh * 0.72 },
        { x: -hw, y: hh * 0.72 },
        { x: -hw * 0.88, y: 0 },
      ];
    }

    case 'ticket-notch': {
      const n = Math.min(hw * 0.14, hh * 0.3, 10);
      const pts: Point2D[] = [];
      const segs = 6;
      pts.push({ x: -hw + n, y: -hh });
      pts.push({ x: hw - n, y: -hh });
      // Bottom-right concave notch
      for (let i = 0; i <= segs; i++) {
        const a = Math.PI - (i / segs) * (Math.PI / 2);
        pts.push({ x: hw + Math.cos(a) * n, y: -hh + Math.sin(a) * n });
      }
      pts.push({ x: hw, y: hh - n });
      // Top-right concave notch
      for (let i = 0; i <= segs; i++) {
        const a = (Math.PI * 3) / 2 - (i / segs) * (Math.PI / 2);
        pts.push({ x: hw + Math.cos(a) * n, y: hh + Math.sin(a) * n });
      }
      pts.push({ x: -hw + n, y: hh });
      // Top-left concave notch
      for (let i = 0; i <= segs; i++) {
        const a = -(i / segs) * (Math.PI / 2);
        pts.push({ x: -hw + Math.cos(a) * n, y: hh + Math.sin(a) * n });
      }
      pts.push({ x: -hw, y: -hh + n });
      // Bottom-left concave notch
      for (let i = 1; i < segs; i++) {
        const a = Math.PI / 2 - (i / segs) * (Math.PI / 2);
        pts.push({ x: -hw + Math.cos(a) * n, y: -hh + Math.sin(a) * n });
      }
      return pts;
    }

    case 'chamfer-plate': {
      const cx = Math.min(hw * 0.14, 14);
      const cy = Math.min(hh * 0.28, 12);
      return [
        { x: -hw + cx, y: -hh },
        { x: hw - cx, y: -hh },
        { x: hw, y: -hh + cy },
        { x: hw, y: hh - cy },
        { x: hw - cx, y: hh },
        { x: -hw + cx, y: hh },
        { x: -hw, y: hh - cy },
        { x: -hw, y: -hh + cy },
      ];
    }

    case 'house-roof': {
      const wallTop = hh * 0.22;
      const overhang = hw * 0.08;
      return [
        { x: -hw * 0.88, y: -hh },
        { x: hw * 0.88, y: -hh },
        { x: hw * 0.88, y: wallTop },
        { x: hw * 0.88 + overhang, y: wallTop },
        { x: hw * 0.42, y: hh * 0.62 },
        { x: hw * 0.42, y: hh * 0.92 },
        { x: hw * 0.24, y: hh * 0.92 },
        { x: hw * 0.24, y: hh * 0.78 },
        { x: 0, y: hh },
        { x: -hw * 0.88 - overhang, y: wallTop },
        { x: -hw * 0.88, y: wallTop },
      ];
    }

    case 'butterfly': {
      const pts: Point2D[] = [];
      const segs = 80;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const wingX = Math.cos(a) * (0.78 + 0.22 * Math.sin(a * 2 + Math.PI / 2));
        const wingY =
          Math.sin(a) * (0.74 + 0.22 * Math.cos(2 * a)) + 0.08 * Math.cos(a * 4);
        pts.push({
          x: wingX * hw,
          y: wingY * hh * 0.95,
        });
      }
      return pts;
    }

    case 'star-burst': {
      const pts: Point2D[] = [];
      const spikes = 14;
      for (let i = 0; i < spikes * 2; i++) {
        const a = (i / (spikes * 2)) * Math.PI * 2;
        const factor = i % 2 === 0 ? 1.0 : 0.82;
        pts.push({
          x: Math.cos(a) * hw * factor,
          y: Math.sin(a) * hh * factor,
        });
      }
      return pts;
    }

    case 'text-outline': {
      const tw = Math.min(w, Math.max(40, (textBounds?.width ?? w * 0.72) + 18));
      const th = Math.min(h, Math.max(22, (textBounds?.height ?? h * 0.65) + 14));
      return buildRoundedRectPoints(tw, th, Math.min(th * 0.42, 12));
    }
  }
}

export function pointsToThreeShape(points: Point2D[]): THREE.Shape {
  const shape = new THREE.Shape();
  if (points.length === 0) return shape;
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y);
  }
  shape.closePath();
  return shape;
}

export function pointsToHolePath(points: Point2D[]): THREE.Path {
  const path = new THREE.Path();
  if (points.length === 0) return path;
  // Holes should wind clockwise (opposite to outer CCW)
  path.moveTo(points[0].x, points[0].y);
  for (let i = points.length - 1; i >= 1; i--) {
    path.lineTo(points[i].x, points[i].y);
  }
  path.closePath();
  return path;
}

export function getMountingHolePositions(design: NameplateDesign): Point2D[] {
  const hw = design.widthMm / 2;
  const hh = design.heightMm / 2;
  const inset = Math.max(design.mountingHoleDiameterMm, design.mountingHoleInsetMm);

  if (
    design.shape === 'circle' ||
    design.shape === 'oval' ||
    design.shape === 'heart' ||
    design.shape === 'diamond' ||
    design.shape === 'butterfly' ||
    design.shape === 'scalloped' ||
    design.shape === 'star-burst'
  ) {
    const xPos = design.shape === 'diamond' ? hw * 0.56 : hw * 0.68;
    return [
      { x: -xPos, y: 0 },
      { x: xPos, y: 0 },
    ];
  }
  if (
    design.shape === 'hexagon' ||
    design.shape === 'arch' ||
    design.shape === 'shield' ||
    design.shape === 'crest' ||
    design.shape === 'ribbon-banner' ||
    design.shape === 'house-roof'
  ) {
    const xPos = hw - inset * 1.45;
    return [
      { x: -xPos, y: design.shape === 'house-roof' ? -hh * 0.18 : 0 },
      { x: xPos, y: design.shape === 'house-roof' ? -hh * 0.18 : 0 },
    ];
  }
  // Corners or side-center for desk/rectangular plates
  if (design.heightMm <= 70) {
    return [
      { x: -hw + inset, y: 0 },
      { x: hw - inset, y: 0 },
    ];
  }
  return [
    { x: -hw + inset, y: hh - inset },
    { x: hw - inset, y: hh - inset },
    { x: -hw + inset, y: -hh + inset },
    { x: hw - inset, y: -hh + inset },
  ];
}

export function addMountingFeaturesToShape(shape: THREE.Shape, design: NameplateDesign): void {
  if (design.mountingHolesEnabled) {
    const r = Math.max(1.0, design.mountingHoleDiameterMm / 2);
    const positions = getMountingHolePositions(design);
    for (const pos of positions) {
      const hole = new THREE.Path();
      hole.absarc(pos.x, pos.y, r, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }

  if (design.keyholeSlotEnabled) {
    const xOffset = Math.min(design.widthMm * 0.34, design.widthMm / 2 - 14);
    const yCenter = Math.max(-design.heightMm * 0.15, design.heightMm * 0.2);
    const positions = xOffset > 15 ? [-xOffset, xOffset] : [0];
    for (const kx of positions) {
      const kh = new THREE.Path();
      const bigR = 4.2;
      const smallR = 2.1;
      const slotH = 7.0;
      kh.absarc(kx, yCenter - slotH * 0.4, bigR, Math.PI * 0.72, Math.PI * 2.28, true);
      kh.lineTo(kx + smallR, yCenter + slotH * 0.5);
      kh.absarc(kx, yCenter + slotH * 0.5, smallR, 0, Math.PI, true);
      kh.closePath();
      shape.holes.push(kh);
    }
  }
}

export function createBasePlateShape(
  design: NameplateDesign,
  textBounds?: { width: number; height: number },
): ShapeOutlineResult {
  const outerPoints = getBaseOutlinePoints(
    design.shape,
    design.widthMm,
    design.heightMm,
    design.cornerRadiusMm,
    textBounds,
  );
  const shape = pointsToThreeShape(outerPoints);
  addMountingFeaturesToShape(shape, design);
  return { shape, outerPoints };
}

export function createBorderFrameShape(
  design: NameplateDesign,
  textBounds?: { width: number; height: number },
): THREE.Shape | null {
  if (!design.borderEnabled || design.mountingStyle === 'text-only-3d') return null;
  const inset = Math.max(1.0, design.borderWidthMm);
  const margin = 1.6;
  const outerPts = getBaseOutlinePoints(
    design.shape,
    design.widthMm - margin * 2,
    design.heightMm - margin * 2,
    Math.max(0, design.cornerRadiusMm - margin),
    textBounds,
  );
  const innerW = design.widthMm - (margin + inset) * 2;
  const innerH = design.heightMm - (margin + inset) * 2;
  if (innerW < 12 || innerH < 8) return null;

  const innerPts = getBaseOutlinePoints(
    design.shape,
    innerW,
    innerH,
    Math.max(0, design.cornerRadiusMm - margin - inset),
    textBounds
      ? { width: Math.max(12, textBounds.width - inset * 2), height: Math.max(8, textBounds.height - inset * 2) }
      : undefined,
  );

  const shape = pointsToThreeShape(outerPts);
  shape.holes.push(pointsToHolePath(innerPts));
  return shape;
}
