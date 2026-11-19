export interface Point2D {
  x: number;
  y: number;
}

export interface TracedPolygon {
  outer: Point2D[];
  holes: Point2D[][];
}

/**
 * Computes signed area using shoelace formula.
 * Positive = CCW, Negative = CW.
 */
export function signedArea(pts: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area * 0.5;
}

export function pointInPolygon(pt: Point2D, poly: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function perpendicularDistance(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Douglas-Peucker simplification for closed polygons.
 */
export function simplifyClosedPolygon(pts: Point2D[], epsilon: number): Point2D[] {
  if (pts.length <= 4 || epsilon <= 0) return pts;

  // Find point farthest from pts[0] to split closed loop into two open polylines
  let maxDist = -1;
  let splitIdx = Math.floor(pts.length / 2);
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[0].x, pts[i].y - pts[0].y);
    if (d > maxDist) {
      maxDist = d;
      splitIdx = i;
    }
  }

  const dpOpen = (slice: Point2D[]): Point2D[] => {
    if (slice.length <= 2) return slice;
    let dmax = 0;
    let index = 0;
    const end = slice.length - 1;
    for (let i = 1; i < end; i++) {
      const d = perpendicularDistance(slice[i], slice[0], slice[end]);
      if (d > dmax) {
        dmax = d;
        index = i;
      }
    }
    if (dmax > epsilon) {
      const left = dpOpen(slice.slice(0, index + 1));
      const right = dpOpen(slice.slice(index));
      return [...left.slice(0, -1), ...right];
    }
    return [slice[0], slice[end]];
  };

  const firstHalf = dpOpen(pts.slice(0, splitIdx + 1));
  const secondHalf = dpOpen([...pts.slice(splitIdx), pts[0]]);
  const combined = [...firstHalf.slice(0, -1), ...secondHalf.slice(0, -1)];
  return combined.length >= 3 ? combined : pts;
}

type Side = 0 | 1 | 2 | 3; // 0: Top, 1: Right, 2: Bottom, 3: Left

// Directed transitions [fromSide, toSide] for Marching Squares cases 0..15
// Screen coordinates (x right, y down): CCW in screen space -> becomes CCW (+area) when Y is flipped up, and holes become CW (-area).
const CASE_SEGMENTS: [Side, Side][][] = [
  [], // 0
  [[2, 3]], // 1: BL
  [[1, 2]], // 2: BR
  [[1, 3]], // 3: BL + BR
  [[0, 1]], // 4: TR
  [[0, 3], [2, 1]], // 5: TR + BL (saddle)
  [[0, 2]], // 6: TR + BR
  [[0, 3]], // 7: TR + BR + BL
  [[3, 0]], // 8: TL
  [[2, 0]], // 9: TL + BL
  [[1, 0], [3, 2]], // 10: TL + BR (saddle)
  [[1, 0]], // 11: TL + BR + BL
  [[3, 1]], // 12: TL + TR
  [[2, 1]], // 13: TL + TR + BL
  [[3, 2]], // 14: TL + TR + BR
  [], // 15
];

function edgeMidpoint(
  cx: number,
  cy: number,
  side: Side,
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  threshold: number,
): Point2D {
  const sample = (x: number, y: number) => alpha[y * width + x];
  const lerpT = (v0: number, v1: number) => {
    const denom = v1 - v0;
    if (Math.abs(denom) < 1e-3) return 0.5;
    return Math.max(0.08, Math.min(0.92, (threshold - v0) / denom));
  };

  switch (side) {
    case 0: {
      const t = lerpT(sample(cx, cy), sample(cx + 1, cy));
      return { x: cx + t, y: cy };
    }
    case 1: {
      const t = lerpT(sample(cx + 1, cy), sample(cx + 1, cy + 1));
      return { x: cx + 1, y: cy + t };
    }
    case 2: {
      const t = lerpT(sample(cx, cy + 1), sample(cx + 1, cy + 1));
      return { x: cx + t, y: cy + 1 };
    }
    case 3: {
      const t = lerpT(sample(cx, cy), sample(cx, cy + 1));
      return { x: cx, y: cy + t };
    }
  }
}

function canonicalEdgeKey(cx: number, cy: number, side: Side, width: number): number {
  // Map shared grid edges to a unique integer ID:
  // Horizontal edge (cx, y) -> 2 * (y * width + cx)
  // Vertical edge (x, cy) -> 2 * (cy * width + x) + 1
  if (side === 0) return 2 * (cy * width + cx);
  if (side === 2) return 2 * ((cy + 1) * width + cx);
  if (side === 3) return 2 * (cy * width + cx) + 1;
  return 2 * (cy * width + (cx + 1)) + 1;
}

/**
 * Extracts closed 2D polygons (with outer contours and nested holes)
 * from an alpha mask (width x height, values 0..255).
 * Output coordinates are in pixel space with Y pointing UP (+Y up, centered at 0,0).
 */
export function traceAlphaContours(
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  options?: {
    threshold?: number;
    simplifyEpsilon?: number;
    minAreaPx?: number;
  },
): TracedPolygon[] {
  const threshold = options?.threshold ?? 128;
  const simplifyEpsilon = options?.simplifyEpsilon ?? 0.45;
  const minAreaPx = options?.minAreaPx ?? 4;

  // Build directed segment graph keyed by start canonicalEdgeKey
  interface Segment {
    startKey: number;
    endKey: number;
    pt: Point2D;
    used: boolean;
  }

  const segmentsByStart = new Map<number, Segment[]>();
  const allSegments: Segment[] = [];

  for (let cy = 0; cy < height - 1; cy++) {
    for (let cx = 0; cx < width - 1; cx++) {
      const tl = alpha[cy * width + cx] >= threshold ? 8 : 0;
      const tr = alpha[cy * width + (cx + 1)] >= threshold ? 4 : 0;
      const br = alpha[(cy + 1) * width + (cx + 1)] >= threshold ? 2 : 0;
      const bl = alpha[(cy + 1) * width + cx] >= threshold ? 1 : 0;
      const code = tl | tr | br | bl;
      if (code === 0 || code === 15) continue;

      const pairs = CASE_SEGMENTS[code];
      for (const [fromSide, toSide] of pairs) {
        const startKey = canonicalEdgeKey(cx, cy, fromSide, width);
        const endKey = canonicalEdgeKey(cx, cy, toSide, width);
        const pt = edgeMidpoint(cx, cy, fromSide, alpha, width, threshold);
        const seg: Segment = { startKey, endKey, pt, used: false };
        allSegments.push(seg);
        let list = segmentsByStart.get(startKey);
        if (!list) {
          list = [];
          segmentsByStart.set(startKey, list);
        }
        list.push(seg);
      }
    }
  }

  // Chain segments into closed loops
  const rawLoops: Point2D[][] = [];
  for (const seed of allSegments) {
    if (seed.used) continue;
    const loop: Point2D[] = [];
    let current: Segment | undefined = seed;
    let safety = 0;
    while (current && !current.used && safety < allSegments.length + 4) {
      current.used = true;
      loop.push({
        x: current.pt.x - width * 0.5,
        y: height * 0.5 - current.pt.y, // Flip Y so +Y is up
      });
      const candidates = segmentsByStart.get(current.endKey);
      current = candidates?.find((s) => !s.used);
      safety++;
    }
    if (loop.length >= 3) {
      const simplified = simplifyClosedPolygon(loop, simplifyEpsilon);
      if (simplified.length >= 3 && Math.abs(signedArea(simplified)) >= minAreaPx) {
        rawLoops.push(simplified);
      }
    }
  }

  // Separate outer contours (CCW in Y-up: area > 0) and holes (CW in Y-up: area < 0)
  const outers: { pts: Point2D[]; absArea: number; holes: Point2D[][] }[] = [];
  const holes: { pts: Point2D[]; absArea: number }[] = [];

  for (const loop of rawLoops) {
    const area = signedArea(loop);
    if (area > 0) {
      outers.push({ pts: loop, absArea: area, holes: [] });
    } else if (area < 0) {
      holes.push({ pts: loop, absArea: -area });
    }
  }

  // Sort outers smallest-first so each hole attaches to its tightest enclosing outer contour
  outers.sort((a, b) => a.absArea - b.absArea);

  for (const hole of holes) {
    const testPt = hole.pts[0];
    for (const outer of outers) {
      if (outer.absArea > hole.absArea && pointInPolygon(testPt, outer.pts)) {
        outer.holes.push(hole.pts);
        break;
      }
    }
  }

  return outers.map((o) => ({ outer: o.pts, holes: o.holes }));
}
