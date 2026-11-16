import * as THREE from 'three';
import type {
  BoundingDimensions,
  DesignConfig,
  MaterialZoneColors,
} from '../types/design';
import {
  computeVolumeCm3,
  csgSubtract,
  csgUnion,
  getGeometryTriangleCount,
  mergeRawGeometries,
} from './csg';
import {
  createBasePlateShape,
  createFlutedCupGeometry,
  createHollowCupGeometry,
  createPolygonShape,
  createRoundedRectShape,
  extrudeFootprintUp,
} from './primitives';
import { buildMotifGeometry, parseAndExtrudeSvgLogo } from './svgMotifEngine';
import { build3DTextGeometry } from './textEngine';

export type MaterialZone = keyof MaterialZoneColors;

export interface GeneratedPart {
  id: string;
  name: string;
  zone: MaterialZone;
  geometry: THREE.BufferGeometry;
  explodeVector: [number, number, number];
}

export interface PhoneMockupPose {
  enabled: boolean;
  position: [number, number, number];
  rotationX: number;
  width: number;
  height: number;
  thickness: number;
}

export interface PenMockupSlot {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

export interface GeneratedAssembly {
  parts: GeneratedPart[];
  mergedSolidGeometry: THREE.BufferGeometry;
  dimensions: BoundingDimensions;
  solidVolumeCm3: number;
  triangleCount: number;
  phonePose: PhoneMockupPose;
  penSlots: PenMockupSlot[];
  svgError: string | null;
}

export function disposeAssembly(assembly: GeneratedAssembly | null | undefined): void {
  if (!assembly) return;
  assembly.parts.forEach((p) => p.geometry.dispose());
  assembly.mergedSolidGeometry.dispose();
}

/**
 * Generates the complete parametric, manifold 3D assembly for any DesignConfig.
 */
export function buildStandAssembly(config: DesignConfig): GeneratedAssembly {
  const parts: GeneratedPart[] = [];
  let svgError: string | null = null;
  let phonePose: PhoneMockupPose = {
    enabled: false,
    position: [0, 20, 0],
    rotationX: -0.35,
    width: 74,
    height: 150,
    thickness: config.phone.phoneThickness,
  };
  let penSlots: PenMockupSlot[] = [];

  const { category } = config;

  if (category === 'phone-stand') {
    const built = buildPhoneModule(config, 0, 0, true);
    parts.push(...built.parts);
    phonePose = built.phonePose;
    if (config.phone.sidePenLoop) {
      penSlots.push({
        position: [built.sideLoopX, config.phone.baseThickness + 2, 0],
        rotation: [0, 0, 0.04],
        color: '#2563EB',
      });
    }
  } else if (category === 'pen-holder') {
    const built = buildPenModule(config, 0, 0, true);
    parts.push(...built.parts);
    penSlots = built.penSlots;
  } else {
    // Combined / Desk Organizer / Personalized Gift
    const built = buildCombinedAssembly(config);
    parts.push(...built.parts);
    phonePose = built.phonePose;
    penSlots = built.penSlots;
  }

  // Apply personalization (custom text, motif, SVG logo)
  const persResult = applyPersonalization(config, parts);
  svgError = persResult.svgError;

  // Ensure every part sits flat >= 0 on Y (protect against minor bevel shifts)
  // Build single merged solid for single-piece STL export & accurate volume
  const partGeoms = parts.map((p) => p.geometry);
  const mergedSolidGeometry =
    config.combined.mergeSingleSolid || parts.length === 1
      ? csgUnion(partGeoms)
      : mergeRawGeometries(partGeoms);

  // Align merged geometry so min.y === 0
  mergedSolidGeometry.computeBoundingBox();
  if (mergedSolidGeometry.boundingBox) {
    const minY = mergedSolidGeometry.boundingBox.min.y;
    if (Math.abs(minY) > 1e-3) {
      mergedSolidGeometry.translate(0, -minY, 0);
      parts.forEach((p) => p.geometry.translate(0, -minY, 0));
    }
  }

  mergedSolidGeometry.computeBoundingBox();
  const size = new THREE.Vector3(80, 80, 80);
  if (mergedSolidGeometry.boundingBox) {
    mergedSolidGeometry.boundingBox.getSize(size);
  }

  const solidVolumeCm3 = computeVolumeCm3(mergedSolidGeometry);
  const triangleCount = getGeometryTriangleCount(mergedSolidGeometry);

  return {
    parts,
    mergedSolidGeometry,
    dimensions: {
      width: Number(size.x.toFixed(1)),
      depth: Number(size.z.toFixed(1)),
      height: Number(size.y.toFixed(1)),
    },
    solidVolumeCm3,
    triangleCount,
    phonePose,
    penSlots,
    svgError,
  };
}

function buildPhoneModule(
  config: DesignConfig,
  offsetX: number,
  offsetZ: number,
  includeBasePlate: boolean
): {
  parts: GeneratedPart[];
  phonePose: PhoneMockupPose;
  sideLoopX: number;
} {
  const { phone } = config;
  const parts: GeneratedPart[] = [];

  const isLandscape = phone.orientation === 'landscape' || phone.type === 'horizontal-landscape';
  const baseW = Math.max(40, isLandscape ? Math.max(phone.baseWidth, 118) : phone.baseWidth);
  const baseD = Math.max(48, phone.baseDepth);
  const baseT = Math.max(2.5, phone.baseThickness);
  const backW = Math.min(baseW - 6, Math.max(30, isLandscape ? Math.max(phone.backWidth, 96) : phone.backWidth));
  const backH = Math.max(40, phone.backHeight);
  const lipW = Math.min(baseW - 6, Math.max(26, isLandscape ? Math.max(phone.lipWidth, 94) : phone.lipWidth));
  const lipH = Math.max(4, phone.lipHeight);
  const slotDepth = Math.max(8, phone.phoneThickness + phone.caseClearance);
  const angleDeg = Math.min(84, Math.max(38, phone.restingAngle));
  const angleRad = THREE.MathUtils.degToRad(angleDeg);
  const backThick = phone.type === 'vertical-dock' ? 9.5 : 7.5;

  const cradleZ = Math.min(baseD * 0.22, slotDepth * 0.8 + 8);
  const lipZ = cradleZ + slotDepth + 3.5;

  // 1. Base Plate
  let baseGeom: THREE.BufferGeometry;
  if (includeBasePlate) {
    const baseShape =
      phone.type === 'gaming-themed' || phone.type === 'geometric'
        ? createBasePlateShape(baseW, baseD, phone.cornerRadius, 'chamfered')
        : createRoundedRectShape(baseW, baseD, phone.cornerRadius);
    baseGeom = extrudeFootprintUp(baseShape, baseT, 0.5);

    // Nameplate front bevel shelf for nameplate type
    if (phone.type === 'nameplate') {
      const plaqueShape = createRoundedRectShape(baseW * 0.86, 16, 3);
      const plaque = extrudeFootprintUp(plaqueShape, 5, 0.4);
      plaque.rotateX(0.32);
      plaque.translate(0, baseT * 0.45, baseD / 2 - 8);
      const unioned = csgUnion([baseGeom, plaque]);
      baseGeom.dispose();
      plaque.dispose();
      baseGeom = unioned;
    }

    // Subtract cable routing hole & non-slip pad recesses
    const cutters: THREE.BufferGeometry[] = [];
    if (phone.cableRoutingHole) {
      const slotW = Math.min(lipW - 10, Math.max(8, phone.cableSlotWidth));
      const tunnel = new THREE.BoxGeometry(slotW, baseT + 8, baseD * 0.62);
      tunnel.translate(0, baseT * 0.55, cradleZ - baseD * 0.2);
      cutters.push(tunnel);
    }
    if (phone.nonSlipRecesses) {
      const padOffsets: Array<[number, number]> = [
        [-baseW * 0.34, -baseD * 0.32],
        [baseW * 0.34, -baseD * 0.32],
        [-baseW * 0.34, baseD * 0.32],
        [baseW * 0.34, baseD * 0.32],
      ];
      for (const [px, pz] of padOffsets) {
        const pad = new THREE.CylinderGeometry(6.5, 6.5, 2.2, 16);
        pad.translate(px, 0.6, pz);
        cutters.push(pad);
      }
    }
    if (cutters.length > 0) {
      const cutResult = csgSubtract(baseGeom, cutters);
      baseGeom.dispose();
      cutters.forEach((c) => c.dispose());
      baseGeom = cutResult;
    }

    baseGeom.translate(offsetX, 0, offsetZ);
    parts.push({
      id: 'phone-base',
      name: 'Phone Stand Base',
      zone: 'base',
      geometry: baseGeom,
      explodeVector: [0, -14, 0],
    });
  }

  // 2. Back Support Geometry
  let backGeom: THREE.BufferGeometry;

  if (phone.type === 'curved-sculptural') {
    // Sweeping side-profile Bezier curve extruded across backW
    const profile = new THREE.Shape();
    const backTopZ = cradleZ - Math.cos(angleRad) * backH;
    const backTopY = baseT + Math.sin(angleRad) * backH;
    profile.moveTo(-baseD * 0.38, baseT - 1);
    profile.lineTo(cradleZ + 3, baseT - 1);
    profile.quadraticCurveTo(cradleZ - 2, baseT + backH * 0.25, backTopZ, backTopY);
    profile.lineTo(backTopZ - 8, backTopY);
    profile.bezierCurveTo(
      backTopZ - 14,
      backTopY * 0.65,
      -baseD * 0.38,
      baseT + 18,
      -baseD * 0.38,
      baseT - 1
    );

    backGeom = new THREE.ExtrudeGeometry(profile, {
      depth: backW,
      bevelEnabled: true,
      bevelThickness: 1.2,
      bevelSize: 1.0,
      bevelSegments: 3,
      curveSegments: 20,
    });
    // Profile is in XY where X=Z-axis, Y=Y-axis. Rotate +90° around Y so local X maps to -Z, wait:
    // Better: rotateY(-Math.PI/2) maps local X -> +Z, local Z -> -X.
    backGeom.translate(0, 0, -backW / 2);
    backGeom.rotateY(-Math.PI / 2);
  } else if (phone.type === 'foldable-inspired') {
    // Real interlocking hinge knuckles & angled back leaf
    const leafShape = createRoundedRectShape(backW, backH, 5);
    const leaf = extrudeFootprintUp(leafShape, backThick, 0.5);
    // Stand upright along +Y then tilt by (90 - angleDeg)
    leaf.rotateX(Math.PI / 2);
    leaf.translate(0, backH / 2 + 6, 0);
    leaf.rotateX(-(Math.PI / 2 - angleRad));
    leaf.translate(0, baseT + 4, cradleZ);

    // Three hinge knuckles along X at y = baseT + 4, z = cradleZ
    const knuckles: THREE.BufferGeometry[] = [leaf];
    const knucklePositions = [-backW * 0.3, 0, backW * 0.3];
    for (const kx of knucklePositions) {
      const k = new THREE.CylinderGeometry(5.5, 5.5, backW * 0.16, 18);
      k.rotateZ(Math.PI / 2);
      k.translate(kx, baseT + 4, cradleZ);
      knuckles.push(k);
    }
    // Pin rod connecting knuckles
    const pin = new THREE.CylinderGeometry(2.4, 2.4, backW * 0.85, 16);
    pin.rotateZ(Math.PI / 2);
    pin.translate(0, baseT + 4, cradleZ);
    knuckles.push(pin);

    backGeom = csgUnion(knuckles);
    knuckles.forEach((k) => k.dispose());
  } else {
    // Standard angled backrest + supportive rear buttress
    const backShape =
      phone.type === 'gaming-themed' || phone.type === 'geometric'
        ? createBasePlateShape(backW, backH, 4, 'chamfered')
        : createRoundedRectShape(backW, backH, Math.min(phone.cornerRadius, 12));
    const plate = extrudeFootprintUp(backShape, backThick, 0.6);
    // Rotate upright in XY plane (standing on Y=0..backH) with front face at Z=0
    plate.rotateX(Math.PI / 2);
    plate.translate(0, backH / 2, -backThick);
    // Tilt backward by (90° - restingAngle) around pivot (0, 0, 0)
    const tiltAngle = Math.PI / 2 - angleRad;
    plate.rotateX(-tiltAngle);
    plate.translate(0, baseT - 1.2, cradleZ);

    // Structural rear buttress fin conforming behind backrest (never piercing front face)
    const maxRearReach = Math.max(18, cradleZ - (-baseD * 0.44));
    const finH = Math.min(backH * 0.56, 52);
    const sinTilt = Math.sin(tiltAngle);
    const finFrontTopX = finH * sinTilt + backThick * 0.45;
    const finDepth = Math.min(maxRearReach, Math.max(finFrontTopX + 10, Math.min(baseD * 0.42, backH * 0.48)));
    const finShape = new THREE.Shape();
    finShape.moveTo(backThick * 0.45, 0);
    finShape.lineTo(finDepth, 0);
    finShape.lineTo(Math.max(finFrontTopX + 4, finDepth * 0.55), finH);
    finShape.lineTo(finFrontTopX, finH);
    finShape.closePath();

    const finThickness = phone.type === 'horizontal-landscape' ? backW * 0.55 : 10;
    const fin = new THREE.ExtrudeGeometry(finShape, {
      depth: finThickness,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.4,
      bevelSegments: 1,
    });
    fin.translate(0, 0, -finThickness / 2);
    fin.rotateY(Math.PI / 2);
    fin.translate(0, baseT - 1.2, cradleZ);

    const combinedBack = csgUnion([plate, fin]);
    plate.dispose();
    fin.dispose();
    backGeom = combinedBack;
  }

  // Apply cable slot cutout or decorative pattern cutouts on back support
  const backCutters: THREE.BufferGeometry[] = [];
  const slotW = Math.min(backW - 16, Math.max(8, phone.cableSlotWidth));
  if (phone.type === 'cable-groove' || phone.cableRoutingHole) {
    const channel = new THREE.BoxGeometry(slotW, backH * 0.42, 32);
    channel.translate(0, baseT + backH * 0.2, cradleZ - 6);
    backCutters.push(channel);
  }
  if (phone.decorativePattern === 'hex-cutout' || phone.type === 'gaming-themed') {
    const hexYPositions = [baseT + backH * 0.55, baseT + backH * 0.76];
    for (const hy of hexYPositions) {
      const hex = new THREE.CylinderGeometry(8.5, 8.5, 42, 6);
      hex.rotateX(Math.PI / 2);
      hex.translate(0, hy, cradleZ - Math.cos(angleRad) * (hy - baseT));
      backCutters.push(hex);
    }
  }
  if (backCutters.length > 0) {
    const cutBack = csgSubtract(backGeom, backCutters);
    backGeom.dispose();
    backCutters.forEach((c) => c.dispose());
    backGeom = cutBack;
  }

  backGeom.translate(offsetX, 0, offsetZ);
  parts.push({
    id: 'phone-backrest',
    name: 'Phone Backrest Support',
    zone: 'back',
    geometry: backGeom,
    explodeVector: [0, 18, -14],
  });

  // 3. Front Retaining Lip with Center Cable Pass-Through Slot
  const lipTotal = createRoundedRectShape(lipW, 7, 2.5);
  let lipGeom = extrudeFootprintUp(lipTotal, lipH + 1.5, 0.4);
  lipGeom.translate(0, baseT - 1.2, lipZ);

  const lipCutter = new THREE.BoxGeometry(slotW, lipH + 8, 16);
  lipCutter.translate(0, baseT + lipH * 0.45, lipZ);
  const cutLip = csgSubtract(lipGeom, [lipCutter]);
  lipGeom.dispose();
  lipCutter.dispose();
  lipGeom = cutLip;

  // Cradle side bolsters
  if (phone.type === 'cradle' || phone.type === 'vertical-dock') {
    const bolsterShape = createRoundedRectShape(7, slotDepth + 10, 2);
    const leftB = extrudeFootprintUp(bolsterShape, lipH + 6, 0.4);
    leftB.translate(-lipW / 2 + 3.5, baseT - 1, cradleZ + slotDepth / 2);
    const rightB = leftB.clone();
    rightB.translate(lipW - 7, 0, 0);
    const withBolsters = csgUnion([lipGeom, leftB, rightB]);
    lipGeom.dispose();
    leftB.dispose();
    rightB.dispose();
    lipGeom = withBolsters;
  }

  lipGeom.translate(offsetX, 0, offsetZ);
  parts.push({
    id: 'phone-lip',
    name: 'Front Retaining Lip',
    zone: 'accent',
    geometry: lipGeom,
    explodeVector: [0, 8, 18],
  });

  // 4. Optional Side Pen Loop attached to phone stand
  const sideLoopX = offsetX + baseW / 2 + 7;
  if (phone.sidePenLoop) {
    const loopGeom = createHollowCupGeometry({
      outerRadius: 9.5,
      wallThickness: 2.8,
      bottomThickness: 4,
      height: 36,
      sides: 28,
    });
    loopGeom.translate(sideLoopX, 0, offsetZ);
    parts.push({
      id: 'phone-side-pen-loop',
      name: 'Side Pen Loop',
      zone: 'cup',
      geometry: loopGeom,
      explodeVector: [18, 0, 0],
    });
  }

  // Exact mockup pose resting flush in front of backrest surface with zero intersection
  const phoneH = isLandscape ? 74 : 148;
  const phoneW = isLandscape ? 148 : 74;
  const tiltFromVertical = Math.PI / 2 - angleRad;
  const sCenter = 2.5 + phoneH * 0.5;
  const nOffset = phone.phoneThickness * 0.5 + 0.9;
  const poseY =
    baseT - 1.2 + Math.cos(tiltFromVertical) * sCenter + Math.sin(tiltFromVertical) * nOffset;
  const poseZ =
    offsetZ +
    cradleZ -
    Math.sin(tiltFromVertical) * sCenter +
    Math.cos(tiltFromVertical) * nOffset;

  return {
    parts,
    sideLoopX,
    phonePose: {
      enabled: true,
      position: [offsetX, poseY, poseZ],
      rotationX: -tiltFromVertical,
      width: phoneW,
      height: phoneH,
      thickness: phone.phoneThickness,
    },
  };
}

function buildPenModule(
  config: DesignConfig,
  offsetX: number,
  offsetZ: number,
  includeTray: boolean
): {
  parts: GeneratedPart[];
  penSlots: PenMockupSlot[];
} {
  const { pen } = config;
  const parts: GeneratedPart[] = [];
  const penSlots: PenMockupSlot[] = [];

  const cupH = Math.max(30, pen.cupHeight);
  const outerR = Math.max(18, pen.exteriorDiameter / 2);
  const wallT = Math.max(1.8, Math.min(outerR - 6, pen.wallThickness));
  const bottomT = Math.max(2.5, Math.min(cupH * 0.4, pen.bottomThickness));

  let mainCupGeom: THREE.BufferGeometry;

  if (pen.type === 'multi-slot-rack') {
    // Solid block with 1..12 precision bores subtracted via CSG
    const cols = pen.holeArrangement === 'linear' ? pen.slotCount : Math.ceil(Math.sqrt(pen.slotCount));
    const rows = pen.holeArrangement === 'linear' ? 1 : Math.ceil(pen.slotCount / cols);
    const spacing = Math.max(pen.slotDiameter + 3.5, pen.slotSpacing);

    const blockW =
      pen.holeArrangement === 'circular'
        ? Math.max(pen.exteriorDiameter, 64)
        : Math.max(pen.exteriorDiameter, cols * spacing + 14);
    const blockD =
      pen.holeArrangement === 'circular'
        ? Math.max(pen.exteriorDiameter, 64)
        : Math.max(40, rows * spacing + 14);

    const blockShape =
      pen.holeArrangement === 'circular'
        ? (() => {
            const s = new THREE.Shape();
            s.absarc(0, 0, blockW / 2, 0, Math.PI * 2, false);
            return s;
          })()
        : createRoundedRectShape(blockW, blockD, 8);

    const block = extrudeFootprintUp(blockShape, cupH, 0.7, 24);
    const cutters: THREE.BufferGeometry[] = [];
    const holeR = Math.max(4, pen.slotDiameter / 2);
    const boreH = cupH - bottomT + 6;
    const sides = pen.holeShape === 'square' ? 4 : pen.holeShape === 'hexagonal' ? 6 : 20;

    for (let i = 0; i < pen.slotCount; i++) {
      let hx = 0;
      let hz = 0;
      if (pen.holeArrangement === 'circular') {
        if (i === 0 && pen.slotCount > 4) {
          hx = 0;
          hz = 0;
        } else {
          const ringCount = pen.slotCount > 4 ? pen.slotCount - 1 : pen.slotCount;
          const idx = pen.slotCount > 4 ? i - 1 : i;
          const a = (idx / ringCount) * Math.PI * 2;
          const ringR = Math.min(blockW * 0.3, holeR + spacing * 0.55);
          hx = Math.cos(a) * ringR;
          hz = Math.sin(a) * ringR;
        }
      } else {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const stagger = pen.holeArrangement === 'staggered' && r % 2 === 1 ? spacing * 0.35 : 0;
        hx = (c - (cols - 1) / 2) * spacing + stagger;
        hz = (r - (rows - 1) / 2) * spacing;
      }

      const bore = new THREE.CylinderGeometry(holeR, holeR, boreH, sides);
      if (pen.holeShape === 'square') bore.rotateY(Math.PI / 4);
      bore.translate(hx, bottomT + boreH / 2, hz);
      cutters.push(bore);

      penSlots.push({
        position: [offsetX + hx, bottomT + 4, offsetZ + hz],
        rotation: [0.02 * (i % 3 - 1), 0, 0.02 * ((i + 1) % 3 - 1)],
        color: i % 2 === 0 ? '#2563EB' : '#F59E0B',
      });
    }

    mainCupGeom = csgSubtract(block, cutters);
    block.dispose();
    cutters.forEach((c) => c.dispose());
  } else if (pen.type === 'wave-ribbed') {
    mainCupGeom = createFlutedCupGeometry({
      outerRadius: outerR,
      wallThickness: wallT,
      bottomThickness: bottomT,
      height: cupH,
      ribCount: Math.max(6, pen.ribCount),
      ribDepth: Math.min(3.5, Math.max(0.6, pen.ribDepth)),
      spiralTurns: 0,
    });
  } else if (pen.type === 'spiral-aesthetic') {
    mainCupGeom = createFlutedCupGeometry({
      outerRadius: outerR,
      wallThickness: wallT,
      bottomThickness: bottomT,
      height: cupH,
      ribCount: Math.max(6, pen.ribCount),
      ribDepth: Math.min(3.5, Math.max(0.6, pen.ribDepth)),
      spiralTurns: 0.45,
    });
  } else if (pen.type === 'honeycomb-holder') {
    const outerCup = createHollowCupGeometry({
      outerRadius: outerR,
      wallThickness: wallT,
      bottomThickness: bottomT,
      height: cupH,
      sides: 6,
    });
    const innerR = outerR - wallT;
    const cellOuter = innerR * 0.42;
    const dividerWall = 2.2;
    const cellGeoms: THREE.BufferGeometry[] = [outerCup];
    const cellCenters: Array<[number, number]> = [[0, 0]];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const dist = cellOuter * 1.65;
      if (dist + cellOuter * 0.7 < innerR + 2) {
        cellCenters.push([Math.cos(a) * dist, Math.sin(a) * dist]);
      }
    }
    for (const [cx, cz] of cellCenters) {
      const cell = createHollowCupGeometry({
        outerRadius: cellOuter,
        wallThickness: dividerWall,
        bottomThickness: bottomT,
        height: cupH - 4,
        sides: 6,
        bevel: 0.2,
      });
      cell.translate(cx, 0, cz);
      cellGeoms.push(cell);
      penSlots.push({
        position: [offsetX + cx, bottomT + 4, offsetZ + cz],
        rotation: [0.03, 0, -0.02],
        color: '#0EA5E9',
      });
    }
    mainCupGeom = csgUnion(cellGeoms);
    cellGeoms.forEach((g) => g.dispose());
  } else if (pen.type === 'angled-pen-holder') {
    const rawCup = createHollowCupGeometry({
      outerRadius: outerR,
      wallThickness: wallT,
      bottomThickness: bottomT,
      height: cupH,
      sides: 32,
    });
    rawCup.rotateX(-0.28);
    rawCup.translate(0, 10, 0);
    // Flat horizontal foot base + trim anything below y=0
    const footShape = new THREE.Shape();
    footShape.absarc(0, 0, outerR + 6, 0, Math.PI * 2, false);
    const foot = extrudeFootprintUp(footShape, 12, 0.6, 28);
    const belowFloor = new THREE.BoxGeometry(outerR * 4, 40, outerR * 4);
    belowFloor.translate(0, -20, 0);
    const trimmed = csgSubtract(rawCup, [belowFloor]);
    mainCupGeom = csgUnion([trimmed, foot]);
    rawCup.dispose();
    foot.dispose();
    belowFloor.dispose();
    trimmed.dispose();
  } else {
    const sides =
      pen.type === 'square-cup'
        ? 4
        : pen.type === 'hexagonal-cup'
          ? 6
          : pen.type === 'geometric-polygon'
            ? 8
            : 36;

    mainCupGeom = createHollowCupGeometry({
      outerRadius: outerR,
      wallThickness: wallT,
      bottomThickness: bottomT,
      height: cupH,
      sides,
    });

    if (pen.type === 'personalized-name-cup') {
      const plaque = extrudeFootprintUp(
        createRoundedRectShape(outerR * 1.35, 10, 2.5),
        22,
        0.4
      );
      plaque.translate(0, 8, outerR - 1);
      const merged = csgUnion([mainCupGeom, plaque]);
      mainCupGeom.dispose();
      plaque.dispose();
      mainCupGeom = merged;
    }
  }

  // Optional integrated wider base collar
  if (pen.integratedBase && pen.type !== 'multi-slot-rack' && pen.type !== 'angled-pen-holder') {
    const collarShape =
      pen.type === 'square-cup' || pen.type === 'hexagonal-cup'
        ? createPolygonShape(outerR + 4.5, pen.type === 'square-cup' ? 4 : 6, pen.type === 'square-cup' ? Math.PI / 4 : 0)
        : (() => {
            const s = new THREE.Shape();
            s.absarc(0, 0, outerR + 4.5, 0, Math.PI * 2, false);
            return s;
          })();
    const collar = extrudeFootprintUp(collarShape, 5.5, 0.6, 32);
    const withCollar = csgUnion([mainCupGeom, collar]);
    mainCupGeom.dispose();
    collar.dispose();
    mainCupGeom = withCollar;
  }

  mainCupGeom.translate(offsetX, 0, offsetZ);
  parts.push({
    id: 'pen-cup-primary',
    name: 'Primary Pen Holder',
    zone: 'cup',
    geometry: mainCupGeom,
    explodeVector: [0, 14, 0],
  });

  // Default pen mockup positions inside cup cavity if not already populated by rack/honeycomb
  if (penSlots.length === 0) {
    const r = Math.max(4, (outerR - wallT) * 0.42);
    penSlots.push(
      { position: [offsetX - r * 0.6, bottomT + 4, offsetZ - r * 0.3], rotation: [0.12, 0, 0.1], color: '#2563EB' },
      { position: [offsetX + r * 0.6, bottomT + 4, offsetZ + r * 0.2], rotation: [-0.1, 0, -0.14], color: '#F59E0B' },
      { position: [offsetX, bottomT + 4, offsetZ + r * 0.5], rotation: [0.08, 0, -0.06], color: '#10B981' }
    );
  }

  // Optional multi-cup extension (cupCount 2 or 3, or open-top-organizer)
  const extraCups = pen.type === 'open-top-organizer' ? 2 : Math.min(3, Math.max(1, pen.cupCount));
  for (let c = 1; c < extraCups; c++) {
    const secR = Math.max(14, pen.secondaryCupDiameter / 2);
    const secH = Math.max(26, pen.secondaryCupHeight);
    const secCup = createHollowCupGeometry({
      outerRadius: secR,
      wallThickness: wallT,
      bottomThickness: bottomT,
      height: secH,
      sides: pen.type === 'hexagonal-cup' ? 6 : pen.type === 'square-cup' ? 4 : 32,
    });
    const shiftX = offsetX + (c === 1 ? outerR + secR - 2 : -(outerR + secR - 2));
    secCup.translate(shiftX, 0, offsetZ);
    parts.push({
      id: `pen-cup-secondary-${c}`,
      name: `Secondary Cup ${c}`,
      zone: 'back',
      geometry: secCup,
      explodeVector: [c === 1 ? 18 : -18, 10, 0],
    });
  }

  // Optional shallow front tray for clips/erasers
  if (includeTray && pen.shallowTray) {
    const trayGeom = buildShallowTrayGeometry(pen.exteriorDiameter + 8, 36, 16, wallT);
    trayGeom.translate(offsetX, 0, offsetZ + outerR + 16);
    parts.push({
      id: 'pen-shallow-tray',
      name: 'Clips & Eraser Tray',
      zone: 'base',
      geometry: trayGeom,
      explodeVector: [0, 0, 18],
    });
  }

  return { parts, penSlots };
}

function buildShallowTrayGeometry(
  width: number,
  depth: number,
  height: number,
  wallT: number
): THREE.BufferGeometry {
  const outerShape = createRoundedRectShape(width, depth, 6);
  const outer = extrudeFootprintUp(outerShape, height, 0.5);
  const innerShape = createRoundedRectShape(
    Math.max(10, width - wallT * 2),
    Math.max(10, depth - wallT * 2),
    Math.max(2, 6 - wallT * 0.5)
  );
  const innerCut = extrudeFootprintUp(innerShape, height + 6, 0.2);
  innerCut.translate(0, 3.8, 0);
  const tray = csgSubtract(outer, [innerCut]);
  outer.dispose();
  innerCut.dispose();
  return tray;
}

function buildCombinedAssembly(config: DesignConfig): {
  parts: GeneratedPart[];
  phonePose: PhoneMockupPose;
  penSlots: PenMockupSlot[];
} {
  const { phone, pen, combined } = config;
  const parts: GeneratedPart[] = [];
  let penSlots: PenMockupSlot[] = [];

  const phoneW = phone.orientation === 'landscape' ? Math.max(phone.baseWidth, 118) : phone.baseWidth;
  const phoneD = phone.baseDepth;
  const cupD = pen.exteriorDiameter;
  const spacing = Math.max(2, combined.moduleSpacing);
  const baseT = Math.max(3, phone.baseThickness);

  let phoneX = 0;
  let phoneZ = 0;
  let penPositions: Array<[number, number]> = [];
  let trayPos: [number, number] | null = null;

  switch (combined.type) {
    case 'pen-left-phone-right': {
      const totalSpan = cupD + spacing + phoneW;
      penPositions = [[-totalSpan / 2 + cupD / 2, 0]];
      phoneX = totalSpan / 2 - phoneW / 2;
      break;
    }
    case 'center-phone-dual-pens': {
      phoneX = 0;
      const sideOffset = phoneW / 2 + spacing + cupD / 2;
      penPositions = [[-sideOffset, 0], [sideOffset, 0]];
      break;
    }
    case 'phone-cradle-rear-pen': {
      phoneX = 0;
      phoneZ = cupD * 0.35 + spacing * 0.5;
      penPositions = [[0, -(phoneD * 0.35 + cupD * 0.25 + spacing)]];
      break;
    }
    case 'pen-holder-phone-rest': {
      penPositions = [[-(phoneW * 0.35), -10]];
      phoneX = cupD * 0.42 + spacing * 0.5;
      phoneZ = 8;
      break;
    }
    case 'compact-corner': {
      phoneX = -cupD * 0.38;
      phoneZ = 10;
      penPositions = [[phoneW * 0.45 + spacing * 0.5, -14]];
      trayPos = [phoneW * 0.45 + spacing * 0.5, cupD * 0.5 + 16];
      break;
    }
    case 'desk-organizer-tray':
    case 'executive-personalized':
    case 'phone-left-pen-right':
    default: {
      const totalSpan = phoneW + spacing + cupD;
      phoneX = -totalSpan / 2 + phoneW / 2;
      penPositions = [[totalSpan / 2 - cupD / 2, 0]];
      if (combined.includeTray) {
        const trayX = totalSpan / 2 + combined.trayWidth / 2 + spacing;
        phoneX -= (combined.trayWidth + spacing) * 0.35;
        penPositions = [[phoneX + phoneW / 2 + spacing + cupD / 2, 0]];
        trayPos = [trayX - (combined.trayWidth + spacing) * 0.35, 0];
      }
      break;
    }
  }

  // Compute unified base footprint spanning all modules
  const allXs = [
    phoneX - phoneW / 2,
    phoneX + phoneW / 2,
    ...penPositions.flatMap(([px]) => [px - cupD / 2, px + cupD / 2]),
    ...(trayPos ? [trayPos[0] - combined.trayWidth / 2, trayPos[0] + combined.trayWidth / 2] : []),
  ];
  const allZs = [
    phoneZ - phoneD / 2,
    phoneZ + phoneD / 2,
    ...penPositions.flatMap(([, pz]) => [pz - cupD / 2, pz + cupD / 2]),
    ...(trayPos ? [trayPos[1] - combined.trayDepth / 2, trayPos[1] + combined.trayDepth / 2] : []),
  ];

  const minX = Math.min(...allXs) - 4;
  const maxX = Math.max(...allXs) + 4;
  const minZ = Math.min(...allZs) - 4;
  const maxZ = Math.max(...allZs) + 4;
  const totalBaseW = maxX - minX;
  const totalBaseD = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Build base plate
  const baseShape = createBasePlateShape(
    totalBaseW,
    totalBaseD,
    phone.cornerRadius,
    combined.baseShape
  );
  let baseGeom = extrudeFootprintUp(baseShape, baseT, 0.55);
  baseGeom.translate(centerX, 0, centerZ);

  if (phone.nonSlipRecesses) {
    const cutters: THREE.BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pad = new THREE.CylinderGeometry(6.5, 6.5, 2.2, 16);
        pad.translate(centerX + sx * (totalBaseW * 0.4), 0.6, centerZ + sz * (totalBaseD * 0.36));
        cutters.push(pad);
      }
    }
    const cut = csgSubtract(baseGeom, cutters);
    baseGeom.dispose();
    cutters.forEach((c) => c.dispose());
    baseGeom = cut;
  }

  parts.push({
    id: 'combined-base',
    name: 'Unified Desk Base',
    zone: 'base',
    geometry: baseGeom,
    explodeVector: [0, -16, 0],
  });

  // Build Phone Module on top of base
  const phoneBuilt = buildPhoneModule(config, phoneX, phoneZ, false);
  parts.push(...phoneBuilt.parts);

  // Build Pen Holder(s)
  penPositions.forEach(([px, pz], idx) => {
    const penBuilt = buildPenModule(config, px, pz, false);
    penBuilt.parts.forEach((p, pIdx) => {
      // Raise slightly into baseT so CSG union overlaps cleanly
      p.geometry.translate(0, Math.max(0, baseT - 1.5), 0);
      parts.push({
        ...p,
        id: `${p.id}-${idx}-${pIdx}`,
        name: penPositions.length > 1 ? `Pen Holder ${idx + 1}` : p.name,
        explodeVector: [px > 0 ? 18 : -18, 12, pz < 0 ? -16 : 0],
      });
    });
    penSlots.push(
      ...penBuilt.penSlots.map((slot) => ({
        ...slot,
        position: [slot.position[0], slot.position[1] + Math.max(0, baseT - 1.5), slot.position[2]] as [number, number, number],
      }))
    );
  });

  // Build Optional Small-Item Tray
  if (combined.includeTray || trayPos) {
    const tx = trayPos ? trayPos[0] : maxX - combined.trayWidth / 2 - 4;
    const tz = trayPos ? trayPos[1] : 0;
    const trayGeom = buildShallowTrayGeometry(
      combined.trayWidth,
      combined.trayDepth,
      combined.trayWallHeight,
      2.8
    );
    trayGeom.translate(tx, Math.max(0, baseT - 1.2), tz);
    parts.push({
      id: 'combined-tray',
      name: 'Accessory Tray',
      zone: 'accent',
      geometry: trayGeom,
      explodeVector: [20, 8, 12],
    });
  }

  return {
    parts,
    phonePose: phoneBuilt.phonePose,
    penSlots,
  };
}

function applyPersonalization(
  config: DesignConfig,
  parts: GeneratedPart[]
): { svgError: string | null } {
  const { personalization, category } = config;
  let svgError: string | null = null;
  if (!personalization.enabled) return { svgError: null };

  // Compute current assembly bounds to anchor text/motif/SVG directly onto the solid
  const tempMerged = mergeRawGeometries(parts.map((p) => p.geometry));
  tempMerged.computeBoundingBox();
  const bbox = tempMerged.boundingBox ?? new THREE.Box3(new THREE.Vector3(-40, 0, -40), new THREE.Vector3(40, 80, 40));
  tempMerged.dispose();

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bbox.getSize(size);
  bbox.getCenter(center);

  const features: Array<{
    id: string;
    name: string;
    geometry: THREE.BufferGeometry;
    mode: 'raised' | 'engraved';
  }> = [];

  const hasText = personalization.text.trim().length > 0;
  const hasMotif = personalization.motif !== 'none';
  const hasSvg = Boolean(personalization.svgLogoData);
  if (!hasText && !hasMotif && !hasSvg) {
    return { svgError: null };
  }

  // On thin bases (non-cup stands), build an integrated solid nameplate plinth for vertical placements
  // so raised or engraved text/motifs never float above the base plate.
  let frontSurfaceZ = bbox.max.z;
  let leftSurfaceX = bbox.min.x;
  let rightSurfaceX = bbox.max.x;
  let plinthPartIdx = -1;

  const estTextW = hasText
    ? personalization.text.trim().length * personalization.fontSize * 0.68 * personalization.letterSpacing
    : 0;
  const maxFeatureH = Math.max(
    hasText ? personalization.fontSize : 0,
    hasMotif ? personalization.motifSize : 0,
    hasSvg ? 18 * personalization.svgLogoScale : 0,
    8
  );
  const plaqueW = Math.min(size.x - 4, Math.max(44, estTextW + (hasMotif ? 26 : 16)));
  const plaqueH = Math.max(config.phone.baseThickness + 2, maxFeatureH + 5);

  if (category !== 'pen-holder' && personalization.placement !== 'base') {
    if (personalization.placement === 'front') {
      const plinth = extrudeFootprintUp(createRoundedRectShape(plaqueW, 6.5, 2), plaqueH, 0.35);
      plinth.translate(center.x, 0, bbox.max.z - 0.5);
      frontSurfaceZ = bbox.max.z + 2.75;
      plinthPartIdx = parts.length;
      parts.push({
        id: 'nameplate-plinth',
        name: 'Nameplate Plinth',
        zone: 'base',
        geometry: plinth,
        explodeVector: [0, -6, 16],
      });
    } else if (personalization.placement === 'left-side') {
      const sideW = Math.min(size.z - 6, Math.max(40, estTextW + 14));
      const plinth = extrudeFootprintUp(createRoundedRectShape(6.5, sideW, 2), plaqueH, 0.35);
      plinth.translate(bbox.min.x + 0.5, 0, center.z);
      leftSurfaceX = bbox.min.x - 2.75;
      plinthPartIdx = parts.length;
      parts.push({
        id: 'nameplate-plinth',
        name: 'Side Nameplate Plinth',
        zone: 'base',
        geometry: plinth,
        explodeVector: [-16, -6, 0],
      });
    } else if (personalization.placement === 'right-side') {
      const sideW = Math.min(size.z - 6, Math.max(40, estTextW + 14));
      const plinth = extrudeFootprintUp(createRoundedRectShape(6.5, sideW, 2), plaqueH, 0.35);
      plinth.translate(bbox.max.x - 0.5, 0, center.z);
      rightSurfaceX = bbox.max.x + 2.75;
      plinthPartIdx = parts.length;
      parts.push({
        id: 'nameplate-plinth',
        name: 'Side Nameplate Plinth',
        zone: 'base',
        geometry: plinth,
        explodeVector: [16, -6, 0],
      });
    }
  }

  const featureY =
    category === 'pen-holder'
      ? Math.min(size.y * 0.5, 42)
      : Math.max(maxFeatureH * 0.5 + 2.2, plaqueH * 0.52);

  // 1. Custom 3D Text
  if (hasText) {
    const isRoundCupOnly =
      category === 'pen-holder' &&
      (config.pen.type === 'round-cup' ||
        config.pen.type === 'wave-ribbed' ||
        config.pen.type === 'spiral-aesthetic');

    const textOut = build3DTextGeometry({
      text: personalization.text,
      fontStyle: personalization.fontStyle,
      fontSize: personalization.fontSize,
      letterSpacing: personalization.letterSpacing,
      alignment: personalization.alignment,
      depth: personalization.depth + 0.8,
      curved: personalization.curved || isRoundCupOnly,
      curveRadius: config.pen.exteriorDiameter / 2,
    });

    if (textOut.geometry) {
      const g = textOut.geometry;
      const depth = personalization.depth;
      const alignAnchorX =
        personalization.alignment === 'left'
          ? center.x - plaqueW * 0.42
          : personalization.alignment === 'right'
            ? center.x + plaqueW * 0.42
            : center.x;

      if (personalization.placement === 'front') {
        if (personalization.mode === 'raised') {
          g.translate(alignAnchorX, featureY, frontSurfaceZ - 0.6);
        } else {
          g.translate(alignAnchorX, featureY, frontSurfaceZ - depth - 0.2);
        }
      } else if (personalization.placement === 'left-side') {
        g.rotateY(-Math.PI / 2);
        const offset = personalization.mode === 'raised' ? leftSurfaceX + 0.6 : leftSurfaceX + depth + 0.2;
        g.translate(offset, featureY, center.z);
      } else if (personalization.placement === 'right-side') {
        g.rotateY(Math.PI / 2);
        const offset = personalization.mode === 'raised' ? rightSurfaceX - 0.6 : rightSurfaceX - depth - 0.2;
        g.translate(offset, featureY, center.z);
      } else {
        // 'base' top surface
        g.rotateX(-Math.PI / 2);
        const yPos =
          personalization.mode === 'raised'
            ? config.phone.baseThickness - 0.5
            : config.phone.baseThickness - depth;
        g.translate(alignAnchorX, yPos, bbox.max.z - 10);
      }

      features.push({
        id: 'custom-text',
        name: 'Custom Nameplate Text',
        geometry: g,
        mode: personalization.mode,
      });
    }
  }

  // 2. Decorative Motif
  if (hasMotif) {
    const motifGeom = buildMotifGeometry(
      personalization.motif,
      personalization.motifSize,
      personalization.depth + 0.8
    );
    if (motifGeom) {
      const motifX = hasText
        ? center.x - Math.min(plaqueW * 0.38, estTextW * 0.5 + personalization.motifSize * 0.7)
        : center.x;
      const motifY = category === 'pen-holder' ? Math.min(size.y * 0.68, 56) : featureY;
      const zShift =
        personalization.mode === 'raised'
          ? frontSurfaceZ - 0.6
          : frontSurfaceZ - personalization.depth - 0.2;
      motifGeom.translate(motifX, motifY, zShift);
      features.push({
        id: 'custom-motif',
        name: 'Decorative Motif',
        geometry: motifGeom,
        mode: personalization.mode,
      });
    }
  }

  // 3. Uploaded SVG Logo
  if (personalization.svgLogoData) {
    const svgRes = parseAndExtrudeSvgLogo(
      personalization.svgLogoData,
      18 * personalization.svgLogoScale,
      personalization.depth + 0.8
    );
    if (!svgRes.valid || !svgRes.geometry) {
      svgError = svgRes.error ?? 'Invalid SVG logo.';
    } else {
      const g = svgRes.geometry;
      const logoY = category === 'pen-holder' ? size.y * 0.6 : featureY;
      const zShift =
        personalization.svgLogoMode === 'raised'
          ? frontSurfaceZ - 0.6
          : frontSurfaceZ - personalization.depth - 0.2;
      g.translate(center.x + (hasText ? Math.min(plaqueW * 0.36, estTextW * 0.5 + 12) : 0), logoY, zShift);
      features.push({
        id: 'custom-svg-logo',
        name: 'Custom SVG Logo',
        geometry: g,
        mode: personalization.svgLogoMode,
      });
    }
  }

  // Apply engraved features via CSG subtraction on the plinth (if present) or primary base/cup target,
  // and add raised features as visible/printable parts.
  const engravedCutters = features.filter((f) => f.mode === 'engraved');
  const raisedFeatures = features.filter((f) => f.mode === 'raised');

  if (engravedCutters.length > 0 && parts.length > 0) {
    const fallbackIdx = parts.findIndex(
      (p) => p.id === 'combined-base' || p.id === 'phone-base' || p.id === 'pen-cup-primary'
    );
    const idx = plinthPartIdx >= 0 ? plinthPartIdx : fallbackIdx >= 0 ? fallbackIdx : 0;
    const cutterGeoms = engravedCutters.map((c) => c.geometry);
    const subtracted = csgSubtract(parts[idx].geometry, cutterGeoms);
    parts[idx].geometry.dispose();
    parts[idx].geometry = subtracted;
    cutterGeoms.forEach((g) => g.dispose());
  }

  for (const rf of raisedFeatures) {
    parts.push({
      id: rf.id,
      name: rf.name,
      zone: 'text',
      geometry: rf.geometry,
      explodeVector: [0, 4, 20],
    });
  }

  return { svgError };
}
