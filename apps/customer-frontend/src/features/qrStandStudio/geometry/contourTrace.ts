export interface Point2D {
  x: number;
  y: number;
}

export interface VectorPolygon {
  outer: Point2D[];
  holes: Point2D[][];
}

/**
 * Pure boundary contour tracer on a binary grid (1 = solid, 0 = empty).
 * Uses marching-squares directed edge graph so closed loops never self-intersect.
 */
export function extractContoursFromGrid(
  grid: Uint8Array,
  width: number,
  height: number
): Point2D[][] {
  const edgeMap = new Map<string, Point2D[]>();

  const keyOf = (x: number, y: number) => `${x},${y}`;
  const addEdge = (x1: number, y1: number, x2: number, y2: number) => {
    const k = keyOf(x1, y1);
    let list = edgeMap.get(k);
    if (!list) {
      list = [];
      edgeMap.set(k, list);
    }
    list.push({ x: x2, y: y2 });
  };

  const isSolid = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return grid[y * width + x] === 1;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isSolid(x, y)) continue;
      if (!isSolid(x, y - 1)) addEdge(x, y, x + 1, y);
      if (!isSolid(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
      if (!isSolid(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
      if (!isSolid(x - 1, y)) addEdge(x, y + 1, x, y);
    }
  }

  const loops: Point2D[][] = [];

  while (edgeMap.size > 0) {
    const firstEntry = edgeMap.entries().next().value as [string, Point2D[]] | undefined;
    if (!firstEntry) break;
    const [startKey, targets] = firstEntry;
    const [sx, sy] = startKey.split(',').map(Number);
    const nextPt = targets.pop()!;
    if (targets.length === 0) edgeMap.delete(startKey);

    const loop: Point2D[] = [{ x: sx, y: sy }];
    let prev = { x: sx, y: sy };
    let curr = nextPt;
    let safety = width * height * 4 + 16;

    while ((curr.x !== sx || curr.y !== sy) && safety-- > 0) {
      loop.push(curr);
      const ck = keyOf(curr.x, curr.y);
      const candidates = edgeMap.get(ck);
      if (!candidates || candidates.length === 0) break;

      let chosenIdx = 0;
      if (candidates.length > 1) {
        const dxIn = curr.x - prev.x;
        const dyIn = curr.y - prev.y;
        let bestCross = -Infinity;
        for (let i = 0; i < candidates.length; i++) {
          const dxOut = candidates[i].x - curr.x;
          const dyOut = candidates[i].y - curr.y;
          const cross = dxIn * dyOut - dyIn * dxOut;
          if (cross > bestCross) {
            bestCross = cross;
            chosenIdx = i;
          }
        }
      }

      const chosen = candidates.splice(chosenIdx, 1)[0];
      if (candidates.length === 0) edgeMap.delete(ck);
      prev = curr;
      curr = chosen;
    }

    if (loop.length >= 3) {
      loops.push(loop);
    }
  }

  return loops;
}

/**
 * Signed area of a 2D polygon (shoelace formula).
 */
export function signedPolygonArea(pts: Point2D[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area * 0.5;
}

/**
 * Point in polygon test using ray casting.
 */
export function pointInPolygon(pt: Point2D, poly: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Ramer-Douglas-Peucker simplification for a closed polygon.
 */
export function simplifyClosedPolygon(pts: Point2D[], epsilon: number): Point2D[] {
  if (pts.length <= 4 || epsilon <= 0) return pts;

  const pruned: Point2D[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    const cross =
      (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
    if (Math.abs(cross) > 1e-6) {
      pruned.push(curr);
    }
  }

  if (pruned.length <= 4) return pruned;

  const half = Math.floor(pruned.length / 2);
  const seg1 = rdpOpen(pruned.slice(0, half + 1), epsilon);
  const seg2 = rdpOpen([...pruned.slice(half), pruned[0]], epsilon);
  const combined = [...seg1.slice(0, -1), ...seg2.slice(0, -1)];
  return combined.length >= 3 ? combined : pruned;
}

function rdpOpen(pts: Point2D[], epsilon: number): Point2D[] {
  if (pts.length <= 2) return pts;
  const start = pts[0];
  const end = pts[pts.length - 1];
  let maxDist = 0;
  let maxIdx = 0;

  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpendicularDistance(pts[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpOpen(pts.slice(0, maxIdx + 1), epsilon);
    const right = rdpOpen(pts.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [start, end];
}

function perpendicularDistance(pt: Point2D, lineA: Point2D, lineB: Point2D): number {
  const dx = lineB.x - lineA.x;
  const dy = lineB.y - lineA.y;
  const mag = Math.hypot(dx, dy);
  if (mag === 0) return Math.hypot(pt.x - lineA.x, pt.y - lineA.y);
  return Math.abs(dy * pt.x - dx * pt.y + lineB.x * lineA.y - lineB.y * lineA.x) / mag;
}

/**
 * Converts Y-down pixel loops into Y-up centered polygons with outer/hole nesting.
 */
export function buildVectorPolygons(
  loops: Point2D[][],
  width: number,
  height: number,
  scaleMmPerPx: number,
  simplifyEpsilonPx = 0.45
): VectorPolygon[] {
  // Convert to Y-up centered mm coordinates
  const converted = loops
    .map((loop) => {
      const simplified = simplifyClosedPolygon(loop, simplifyEpsilonPx);
      return simplified.map((p) => ({
        x: (p.x - width / 2) * scaleMmPerPx,
        y: (height / 2 - p.y) * scaleMmPerPx,
      }));
    })
    .filter((poly) => poly.length >= 3 && Math.abs(signedPolygonArea(poly)) > 1e-4);

  // Because pixel boundary edges trace CW around solid in Y-down, flipping Y produces:
  // outer contours with negative signed area, and holes with positive signed area.
  // Normalize each polygon to standard Three.js Y-up winding (CCW > 0 for outer, CW < 0 for holes).
  const outers: { poly: Point2D[]; area: number; holes: Point2D[][] }[] = [];
  const holes: { poly: Point2D[]; area: number }[] = [];

  for (const poly of converted) {
    const area = signedPolygonArea(poly);
    if (area < 0) {
      outers.push({ poly: [...poly].reverse(), area: Math.abs(area), holes: [] });
    } else {
      holes.push({ poly: [...poly].reverse(), area: Math.abs(area) });
    }
  }

  // Sort outers smallest-first so each hole attaches to its immediate enclosing outer
  outers.sort((a, b) => a.area - b.area);

  for (const hole of holes) {
    const probe = hole.poly[0];
    for (const outer of outers) {
      if (outer.area > hole.area && pointInPolygon(probe, outer.poly)) {
        outer.holes.push(hole.poly);
        break;
      }
    }
  }

  return outers.map((o) => ({ outer: o.poly, holes: o.holes }));
}
