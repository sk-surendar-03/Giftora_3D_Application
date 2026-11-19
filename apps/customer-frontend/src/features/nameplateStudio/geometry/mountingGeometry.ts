import * as THREE from 'three';
import { DecorationType, NameplateDesign } from '../core/types';

/**
 * Creates a freestanding angled desk stand cradle/foot in millimeter space.
 * The nameplate is tilted backward by `deskStandAngleDeg` around the X axis;
 * the stand supports the bottom edge and includes rear support ribs so the whole assembly
 * sits flush on Y = 0 (or Z = 0 in printer space).
 */
export function buildDeskStandGeometries(design: NameplateDesign): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];
  const w = Math.max(40, design.widthMm);
  const standWidth = Math.min(w * 0.86, w - 12);
  const baseThick = design.baseThicknessMm;
  const angleRad = THREE.MathUtils.degToRad(Math.max(5, Math.min(45, design.deskStandAngleDeg)));

  // Foot depth proportional to plate height and tilt angle
  const footDepth = Math.max(22, Math.min(55, design.heightMm * 0.45 + Math.sin(angleRad) * 28));
  const footThickness = Math.max(3.6, Math.min(6, baseThick));

  // Main horizontal base rail with front cradle stop lip (Extrude along X)
  const railShape = new THREE.Shape();
  railShape.moveTo(-footDepth * 0.35, 0);
  railShape.lineTo(footDepth * 0.65, 0);
  railShape.lineTo(footDepth * 0.65, footThickness);
  railShape.lineTo(-footDepth * 0.14, footThickness);
  railShape.lineTo(-footDepth * 0.14, footThickness + 2.2);
  railShape.lineTo(-footDepth * 0.35, footThickness + 2.2);
  railShape.closePath();

  const railGeo = new THREE.ExtrudeGeometry(railShape, {
    depth: standWidth,
    bevelEnabled: true,
    bevelThickness: 0.6,
    bevelSize: 0.5,
    bevelSegments: 2,
  });
  // Rotate so extrusion along Z becomes X centered at 0
  railGeo.rotateY(Math.PI / 2);
  railGeo.translate(-standWidth / 2, 0, 0);
  geometries.push(railGeo);

  // Rear angled support ribs (left & right + optional center)
  if (design.deskStandSupportRibs) {
    const ribHeight = Math.max(14, design.heightMm * 0.42);
    const ribBackZ = -Math.sin(angleRad) * ribHeight - baseThick - 1.5;
    const ribShape = new THREE.Shape();
    ribShape.moveTo(0, footThickness - 0.5);
    ribShape.lineTo(footDepth * 0.58, footThickness - 0.5);
    ribShape.lineTo(Math.max(2, -ribBackZ * 0.45), ribHeight);
    ribShape.lineTo(0, ribHeight);
    ribShape.closePath();

    const ribThickness = 4.5;
    const ribPositions =
      standWidth > 110
        ? [-standWidth * 0.34, 0, standWidth * 0.34]
        : [-standWidth * 0.3, standWidth * 0.3];

    for (const rx of ribPositions) {
      const ribGeo = new THREE.ExtrudeGeometry(ribShape, {
        depth: ribThickness,
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.4,
        bevelSegments: 1,
      });
      ribGeo.rotateY(Math.PI / 2);
      ribGeo.translate(rx - ribThickness / 2, 0, 0);
      geometries.push(ribGeo);
    }
  }

  return geometries;
}

function createStarShape(outerR: number, innerR: number, points = 5): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function createCrownShape(w: number, h: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw, -hh);
  s.lineTo(hw, -hh);
  s.lineTo(hw * 1.08, hh * 0.65);
  s.lineTo(hw * 0.48, hh * 0.05);
  s.lineTo(0, hh);
  s.lineTo(-hw * 0.48, hh * 0.05);
  s.lineTo(-hw * 1.08, hh * 0.65);
  s.closePath();
  return s;
}

function createBracketShape(size: number, flipX: boolean): THREE.Shape {
  const dir = flipX ? -1 : 1;
  const s = new THREE.Shape();
  s.moveTo(0, -size);
  s.lineTo(dir * size * 0.75, -size);
  s.lineTo(dir * size * 0.75, -size * 0.72);
  s.lineTo(dir * size * 0.28, -size * 0.72);
  s.lineTo(dir * size * 0.28, size * 0.72);
  s.lineTo(dir * size * 0.75, size * 0.72);
  s.lineTo(dir * size * 0.75, size);
  s.lineTo(0, size);
  s.closePath();
  return s;
}

/**
 * Generates decorative 3D accent geometries placed on the front face of the nameplate.
 */
export function buildDecorationGeometries(
  decoration: DecorationType,
  design: NameplateDesign,
): THREE.BufferGeometry[] {
  if (decoration === 'none' || design.mountingStyle === 'text-only-3d') return [];

  const hw = design.widthMm / 2;
  const hh = design.heightMm / 2;
  const depth = Math.max(1.2, design.textExtrusionMm * 0.85);
  const extrudeOpts: THREE.ExtrudeGeometryOptions = {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.25,
    bevelSegments: 1,
  };

  const geos: THREE.BufferGeometry[] = [];
  const edgeX = hw - Math.min(18, hw * 0.16);

  switch (decoration) {
    case 'stars': {
      const r = Math.min(6.5, hh * 0.22);
      for (const sx of [-edgeX, edgeX]) {
        const g = new THREE.ExtrudeGeometry(createStarShape(r, r * 0.44), extrudeOpts);
        g.translate(sx, 0, 0);
        geos.push(g);
      }
      break;
    }

    case 'crown': {
      const cw = Math.min(22, hw * 0.24);
      const ch = Math.min(11, hh * 0.24);
      const g = new THREE.ExtrudeGeometry(createCrownShape(cw, ch), extrudeOpts);
      g.translate(0, hh - ch * 1.15, 0);
      geos.push(g);
      break;
    }

    case 'floral-corner': {
      const r = Math.min(5.2, hh * 0.16);
      const corners = [
        { x: -hw + 12, y: hh - 11 },
        { x: hw - 12, y: hh - 11 },
        { x: -hw + 12, y: -hh + 11 },
        { x: hw - 12, y: -hh + 11 },
      ];
      for (const c of corners) {
        const petal = createStarShape(r, r * 0.58, 6);
        const g = new THREE.ExtrudeGeometry(petal, extrudeOpts);
        g.translate(c.x, c.y, 0);
        geos.push(g);
      }
      break;
    }

    case 'gaming-brackets': {
      const bh = Math.min(hh * 0.65, 18);
      for (const [bx, flip] of [
        [-hw + 8, false],
        [hw - 8, true],
      ] as [number, boolean][]) {
        const g = new THREE.ExtrudeGeometry(createBracketShape(bh, flip), extrudeOpts);
        g.translate(bx, 0, 0);
        geos.push(g);
      }
      break;
    }

    case 'temple-arch': {
      const r = Math.min(5.5, hh * 0.16);
      const g = new THREE.ExtrudeGeometry(createStarShape(r, r * 0.5, 8), extrudeOpts);
      g.translate(0, hh - r * 2.1, 0);
      geos.push(g);
      break;
    }

    case 'heart-emblem': {
      const hs = new THREE.Shape();
      const scale = Math.min(0.32, hh / 95);
      for (let i = 0; i < 32; i++) {
        const t = Math.PI - (i / 32) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3) * scale;
        const hy =
          (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) *
          scale;
        if (i === 0) hs.moveTo(hx, hy);
        else hs.lineTo(hx, hy);
      }
      hs.closePath();
      for (const sx of [-edgeX, edgeX]) {
        const g = new THREE.ExtrudeGeometry(hs, extrudeOpts);
        g.translate(sx, 0, 0);
        geos.push(g);
      }
      break;
    }

    case 'paw-print': {
      const pad = new THREE.Shape();
      pad.absellipse(0, -1.8, 3.2, 2.5, 0, Math.PI * 2, false, 0);
      const gMain = new THREE.ExtrudeGeometry(pad, extrudeOpts);
      gMain.translate(-edgeX, 0, 0);
      geos.push(gMain);
      const toes = [
        { x: -3.2, y: 2.2 },
        { x: -1.1, y: 3.4 },
        { x: 1.1, y: 3.4 },
        { x: 3.2, y: 2.2 },
      ];
      for (const t of toes) {
        const toe = new THREE.Shape();
        toe.absarc(t.x, t.y, 1.15, 0, Math.PI * 2, false);
        const gt = new THREE.ExtrudeGeometry(toe, extrudeOpts);
        gt.translate(-edgeX, 0, 0);
        geos.push(gt);
      }
      break;
    }

    case 'moon-stars': {
      const r = Math.min(6.5, hh * 0.24);
      const crescent = new THREE.Shape();
      crescent.absarc(0, 0, r, -Math.PI * 0.65, Math.PI * 0.65, false);
      crescent.absarc(r * 0.42, 0, r * 0.78, Math.PI * 0.55, -Math.PI * 0.55, true);
      crescent.closePath();
      const gMoon = new THREE.ExtrudeGeometry(crescent, extrudeOpts);
      gMoon.translate(-edgeX, 0, 0);
      geos.push(gMoon);

      const gStar = new THREE.ExtrudeGeometry(createStarShape(r * 0.72, r * 0.32), extrudeOpts);
      gStar.translate(edgeX, 0, 0);
      geos.push(gStar);
      break;
    }

    case 'laurel-wreath': {
      const leafSize = Math.min(3.6, hh * 0.14);
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const leaf = new THREE.Shape();
          leaf.absellipse(0, 0, leafSize * 0.48, leafSize, 0, Math.PI * 2, false, 0);
          const g = new THREE.ExtrudeGeometry(leaf, extrudeOpts);
          g.rotateZ(side * (0.45 - i * 0.16));
          g.translate(side * (edgeX - i * 1.4), -hh * 0.28 + i * leafSize * 1.35, 0);
          geos.push(g);
        }
      }
      break;
    }

    case 'lightning-bolts': {
      const s = Math.min(8.5, hh * 0.34);
      const bolt = new THREE.Shape();
      bolt.moveTo(s * 0.2, s);
      bolt.lineTo(-s * 0.45, s * 0.05);
      bolt.lineTo(-s * 0.05, s * 0.05);
      bolt.lineTo(-s * 0.25, -s);
      bolt.lineTo(s * 0.48, -s * 0.05);
      bolt.lineTo(s * 0.08, -s * 0.05);
      bolt.closePath();
      for (const sx of [-edgeX, edgeX]) {
        const g = new THREE.ExtrudeGeometry(bolt, extrudeOpts);
        g.translate(sx, 0, 0);
        geos.push(g);
      }
      break;
    }

    case 'butterfly-accent': {
      const s = Math.min(5.8, hh * 0.22);
      const bfly = new THREE.Shape();
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const x = Math.cos(a) * s * (0.75 + 0.25 * Math.sin(a * 2 + Math.PI / 2));
        const y = Math.sin(a) * s * (0.7 + 0.25 * Math.cos(2 * a));
        if (i === 0) bfly.moveTo(x, y);
        else bfly.lineTo(x, y);
      }
      bfly.closePath();
      for (const sx of [-edgeX, edgeX]) {
        const g = new THREE.ExtrudeGeometry(bfly, extrudeOpts);
        g.translate(sx, 0, 0);
        geos.push(g);
      }
      break;
    }

    case 'lotus-mandala': {
      const s = Math.min(6.2, hh * 0.24);
      for (let p = -2; p <= 2; p++) {
        const petal = new THREE.Shape();
        petal.absellipse(0, s * 0.55, s * 0.26, s * 0.65, 0, Math.PI * 2, false, 0);
        const gp = new THREE.ExtrudeGeometry(petal, extrudeOpts);
        gp.rotateZ(p * 0.34);
        gp.translate(0, hh - s * 1.45, 0);
        geos.push(gp);
      }
      break;
    }

    case 'diamond-gems': {
      const r = Math.min(5.2, hh * 0.18);
      const gem = new THREE.Shape();
      gem.moveTo(0, -r * 1.25);
      gem.lineTo(r * 0.85, 0);
      gem.lineTo(0, r * 1.25);
      gem.lineTo(-r * 0.85, 0);
      gem.closePath();
      const corners = [
        { x: -hw + 11, y: hh - 10 },
        { x: hw - 11, y: hh - 10 },
        { x: -hw + 11, y: -hh + 10 },
        { x: hw - 11, y: -hh + 10 },
      ];
      for (const c of corners) {
        const g = new THREE.ExtrudeGeometry(gem, extrudeOpts);
        g.translate(c.x, c.y, 0);
        geos.push(g);
      }
      break;
    }

    case 'music-notes': {
      const r = Math.min(2.8, hh * 0.12);
      for (const sx of [-edgeX, edgeX]) {
        const head = new THREE.Shape();
        head.absellipse(-r * 0.5, -r * 1.4, r, r * 0.72, 0, Math.PI * 2, false, 0.35);
        const gh = new THREE.ExtrudeGeometry(head, extrudeOpts);
        gh.translate(sx, 0, 0);
        geos.push(gh);

        const stem = new THREE.Shape();
        stem.moveTo(r * 0.2, -r * 1.4);
        stem.lineTo(r * 0.75, -r * 1.4);
        stem.lineTo(r * 0.75, r * 2.2);
        stem.lineTo(r * 2.0, r * 1.4);
        stem.lineTo(r * 2.0, r * 0.6);
        stem.lineTo(r * 0.75, r * 1.35);
        stem.lineTo(r * 0.2, r * 1.35);
        stem.closePath();
        const gs = new THREE.ExtrudeGeometry(stem, extrudeOpts);
        gs.translate(sx, 0, 0);
        geos.push(gs);
      }
      break;
    }

    case 'wings-emblem': {
      const s = Math.min(8, hh * 0.28);
      for (const side of [-1, 1]) {
        const wing = new THREE.Shape();
        wing.moveTo(0, -s * 0.4);
        wing.lineTo(side * s * 1.15, s * 0.65);
        wing.lineTo(side * s * 0.85, s * 0.05);
        wing.lineTo(side * s * 1.0, -s * 0.15);
        wing.lineTo(side * s * 0.65, -s * 0.35);
        wing.lineTo(side * s * 0.78, -s * 0.55);
        wing.lineTo(0, -s * 0.65);
        wing.closePath();
        const g = new THREE.ExtrudeGeometry(wing, extrudeOpts);
        g.translate(side * (edgeX - 4), 0, 0);
        geos.push(g);
      }
      break;
    }

    case 'sword-crest': {
      const s = Math.min(9, hh * 0.34);
      const blade = new THREE.Shape();
      blade.moveTo(-s * 0.14, -s * 0.55);
      blade.lineTo(s * 0.14, -s * 0.55);
      blade.lineTo(s * 0.14, s * 0.65);
      blade.lineTo(0, s);
      blade.lineTo(-s * 0.14, s * 0.65);
      blade.closePath();
      for (const sx of [-edgeX, edgeX]) {
        const g1 = new THREE.ExtrudeGeometry(blade, extrudeOpts);
        g1.rotateZ(0.45);
        g1.translate(sx, 0, 0);
        geos.push(g1);

        const g2 = new THREE.ExtrudeGeometry(blade, extrudeOpts);
        g2.rotateZ(-0.45);
        g2.translate(sx, 0, 0);
        geos.push(g2);
      }
      break;
    }

    case 'corner-rivets': {
      const r = Math.min(3.2, hh * 0.12);
      const hex = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) hex.moveTo(x, y);
        else hex.lineTo(x, y);
      }
      hex.closePath();
      const corners = [
        { x: -hw + 9, y: hh - 9 },
        { x: hw - 9, y: hh - 9 },
        { x: -hw + 9, y: -hh + 9 },
        { x: hw - 9, y: -hh + 9 },
      ];
      for (const c of corners) {
        const g = new THREE.ExtrudeGeometry(hex, extrudeOpts);
        g.translate(c.x, c.y, 0);
        geos.push(g);
      }
      break;
    }
  }

  return geos;
}
