import * as THREE from 'three';
import type {
  PrintingMode,
  QRCodeConfig,
  StandDesign,
  StandDimensions,
  TemplateId,
} from '../types/studio';
import { clampDimensions } from '../core/printability';
import { buildQRPayload, generateQRMatrix } from '../core/qrGenerator';
import { applyCenterLogoPunchout, validateCenterLogo } from '../core/qrLogoValidator';
import {
  buildDecorationGeometry3D,
  buildLogoFrameGeometry3D,
  buildTextGeometry3D,
  mergeSafe,
  normalizeGeometry,
  roundedRectShape,
} from './textAndDecorations';

export interface StandPartGeometries {
  base: THREE.BufferGeometry | null;
  body: THREE.BufferGeometry | null;
  frame: THREE.BufferGeometry | null;
  qrModules: THREE.BufferGeometry | null;
  text: THREE.BufferGeometry | null;
  logo: THREE.BufferGeometry | null;
  decorations: THREE.BufferGeometry | null;
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
    size: THREE.Vector3;
    center: THREE.Vector3;
  };
  triangleCount: number;
}

interface FacePlacement {
  face: 'front' | 'back' | 'left' | 'right';
  matrix: THREE.Matrix4;
  frontZ: number;
}

function makeSilhouetteShape(
  templateId: TemplateId,
  width: number,
  height: number,
  cornerRadius: number
): THREE.Shape {
  const hw = width / 2;
  const hh = height / 2;

  if (templateId === 'circular_display') {
    const r = Math.min(hw, hh);
    const s = new THREE.Shape();
    s.absarc(0, 0, r, 0, Math.PI * 2, false);
    return s;
  }

  if (templateId === 'arch_shaped') {
    const r = hw;
    const bodyBottom = -hh;
    const archCenterY = hh - r;
    const s = new THREE.Shape();
    s.moveTo(-hw, bodyBottom);
    s.lineTo(hw, bodyBottom);
    if (archCenterY > bodyBottom) {
      s.lineTo(hw, archCenterY);
    }
    s.absarc(0, Math.max(bodyBottom, archCenterY), r, 0, Math.PI, false);
    s.lineTo(-hw, bodyBottom);
    s.closePath();
    return s;
  }

  if (templateId === 'mini_keychain') {
    return roundedRectShape(width, height - 6, cornerRadius);
  }

  return roundedRectShape(width, height, cornerRadius);
}

function makeOuterFrameShape(
  templateId: TemplateId,
  width: number,
  height: number,
  cornerRadius: number,
  borderThickness: number
): THREE.Shape | null {
  if (borderThickness <= 0.2) return null;
  const outer = makeSilhouetteShape(templateId, width, height, cornerRadius);

  const innerW = Math.max(10, width - borderThickness * 2);
  const innerH = Math.max(10, height - borderThickness * 2);
  const innerR = Math.max(0, cornerRadius - borderThickness);

  let holePath: THREE.Path;
  if (templateId === 'circular_display') {
    holePath = new THREE.Path();
    holePath.absarc(0, 0, Math.max(5, Math.min(width, height) / 2 - borderThickness), 0, Math.PI * 2, true);
  } else if (templateId === 'arch_shaped') {
    const ihw = innerW / 2;
    const ihh = innerH / 2;
    const r = ihw;
    const archY = ihh - r;
    holePath = new THREE.Path();
    holePath.moveTo(-ihw, -ihh);
    holePath.lineTo(-ihw, Math.max(-ihh, archY));
    holePath.absarc(0, Math.max(-ihh, archY), r, Math.PI, 0, true);
    holePath.lineTo(ihw, -ihh);
    holePath.closePath();
  } else {
    const s = roundedRectShape(innerW, templateId === 'mini_keychain' ? innerH - 6 : innerH, innerR);
    holePath = new THREE.Path(s.getPoints(24).reverse());
  }

  outer.holes.push(holePath);
  return outer;
}

function addWallMountKeyholePaths(shape: THREE.Shape, width: number, height: number) {
  const offsetX = Math.min(width * 0.28, 28);
  const yCenter = height * 0.28;
  const positions = width > 75 ? [-offsetX, offsetX] : [0];

  for (const x of positions) {
    const hole = new THREE.Path();
    const rBottom = 3.2;
    const rTop = 1.8;
    hole.absarc(x, yCenter - 2.5, rBottom, Math.PI * 0.2, Math.PI * 0.8, true);
    hole.lineTo(x - rTop, yCenter + 4.5);
    hole.absarc(x, yCenter + 4.5, rTop, Math.PI, 0, true);
    hole.lineTo(x + rBottom * Math.cos(Math.PI * 0.2), yCenter - 2.5 + rBottom * Math.sin(Math.PI * 0.2));
    hole.closePath();
    shape.holes.push(hole);
  }
}

function buildKeychainLoopGeometry(
  width: number,
  height: number,
  plateThickness: number
): THREE.BufferGeometry {
  const outerR = 6.2;
  const innerR = 2.6;
  const loopY = (height - 6) / 2 + 1.5;

  const s = new THREE.Shape();
  s.absarc(0, loopY, outerR, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, loopY, innerR, 0, Math.PI * 2, true);
  s.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: plateThickness,
    bevelEnabled: true,
    bevelThickness: 0.35,
    bevelSize: 0.35,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geo.translate(0, 0, -plateThickness / 2);
  const norm = normalizeGeometry(geo);
  geo.dispose();
  return norm;
}

function buildPedestalBaseGeometry(
  templateId: TemplateId,
  dims: StandDimensions
): THREE.BufferGeometry | null {
  if (templateId === 'mini_keychain' || templateId === 'restaurant_tent') {
    return null;
  }

  const parts: THREE.BufferGeometry[] = [];
  const bw = dims.baseWidthMm;
  const bd = dims.baseDepthMm;
  const bt = dims.baseThicknessMm;

  if (templateId === 'triple_display') {
    const hexRadius = Math.max(bw, bd) * 0.56;
    const hex = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      const x = Math.cos(a) * hexRadius;
      const y = Math.sin(a) * hexRadius;
      if (i === 0) hex.moveTo(x, y);
      else hex.lineTo(x, y);
    }
    hex.closePath();
    const baseGeo = new THREE.ExtrudeGeometry(hex, {
      depth: bt,
      bevelEnabled: dims.roundedEdges,
      bevelThickness: 0.8,
      bevelSize: 0.8,
      bevelSegments: 2,
    });
    baseGeo.rotateX(-Math.PI / 2);
    parts.push(baseGeo);
    return mergeSafe(parts);
  }

  if (templateId === 'circular_display') {
    const cradle = roundedRectShape(bw, bd, Math.min(14, bd * 0.35));
    const baseGeo = new THREE.ExtrudeGeometry(cradle, {
      depth: bt,
      bevelEnabled: true,
      bevelThickness: 0.8,
      bevelSize: 0.8,
      bevelSegments: 2,
      curveSegments: 16,
    });
    baseGeo.rotateX(-Math.PI / 2);
    parts.push(baseGeo);
    return mergeSafe(parts);
  }

  const baseRadius = dims.roundedEdges ? Math.min(12, bd * 0.3) : 2;
  const baseShape = roundedRectShape(bw, bd, baseRadius);
  const mainBase = new THREE.ExtrudeGeometry(baseShape, {
    depth: bt,
    bevelEnabled: dims.roundedEdges,
    bevelThickness: Math.min(0.9, bt * 0.15),
    bevelSize: Math.min(0.9, bt * 0.15),
    bevelSegments: 2,
    curveSegments: 12,
  });
  mainBase.rotateX(-Math.PI / 2);
  parts.push(mainBase);

  if (templateId === 'business_plaque' || templateId === 'arch_shaped') {
    const tierShape = roundedRectShape(bw * 0.88, bd * 0.72, Math.max(2, baseRadius - 2));
    const tierGeo = new THREE.ExtrudeGeometry(tierShape, {
      depth: bt * 0.45,
      bevelEnabled: dims.roundedEdges,
      bevelThickness: 0.4,
      bevelSize: 0.4,
      bevelSegments: 1,
    });
    tierGeo.rotateX(-Math.PI / 2);
    tierGeo.translate(0, bt, 0);
    parts.push(tierGeo);
  }

  if (
    dims.inclinationDeg >= 8 &&
    (templateId === 'angled_desk' ||
      templateId === 'business_plaque' ||
      templateId === 'social_media' ||
      templateId === 'classic_upright')
  ) {
    const ribHeight = Math.min(dims.heightMm * 0.36, 38);
    const rad = (dims.inclinationDeg * Math.PI) / 180;
    const ribRun = Math.min(bd * 0.44, Math.max(16, ribHeight * Math.sin(rad) + 18));
    const ribShape = new THREE.Shape();
    ribShape.moveTo(0, 0);
    ribShape.lineTo(-ribRun, 0);
    ribShape.lineTo(-Math.sin(rad) * ribHeight, Math.cos(rad) * ribHeight);
    ribShape.closePath();

    const ribThickness = 3.6;
    const offsetX = Math.min(dims.widthMm * 0.28, bw * 0.32);

    for (const sx of [-offsetX, offsetX]) {
      const rib = new THREE.ExtrudeGeometry(ribShape, {
        depth: ribThickness,
        bevelEnabled: false,
      });
      rib.rotateY(Math.PI / 2);
      rib.translate(sx - ribThickness / 2, bt - 0.5, -dims.plateThicknessMm * 0.3);
      parts.push(rib);
    }
  }

  if (templateId === 'social_media') {
    const pillarShape = roundedRectShape(7, dims.heightMm * 0.62, 3);
    const pillar = new THREE.ExtrudeGeometry(pillarShape, {
      depth: dims.plateThicknessMm + 2.5,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.5,
      bevelSegments: 1,
    });
    const rad = (dims.inclinationDeg * Math.PI) / 180;
    pillar.rotateX(-rad);
    pillar.translate(
      -dims.widthMm / 2 - 1.5,
      bt + (dims.heightMm * 0.31) * Math.cos(rad),
      (dims.heightMm * 0.31) * Math.sin(rad) - dims.plateThicknessMm * 0.5
    );
    parts.push(pillar);
  }

  const merged = mergeSafe(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

function computeFacePlacements(
  templateId: TemplateId,
  dims: StandDimensions
): FacePlacement[] {
  const rad = (dims.inclinationDeg * Math.PI) / 180;
  const centerY =
    templateId === 'mini_keychain'
      ? dims.heightMm / 2
      : dims.baseThicknessMm + (dims.heightMm / 2) * Math.cos(rad) - 1;

  if (templateId === 'mini_keychain') {
    const m = new THREE.Matrix4().makeTranslation(0, dims.heightMm / 2, dims.plateThicknessMm / 2);
    return [{ face: 'front', matrix: m, frontZ: dims.plateThicknessMm / 2 }];
  }

  if (templateId === 'double_sided') {
    const front = new THREE.Matrix4().makeTranslation(0, dims.baseThicknessMm + dims.heightMm / 2 - 1, 0);
    const back = new THREE.Matrix4()
      .makeRotationY(Math.PI)
      .setPosition(0, dims.baseThicknessMm + dims.heightMm / 2 - 1, 0);
    return [
      { face: 'front', matrix: front, frontZ: dims.plateThicknessMm / 2 },
      { face: 'back', matrix: back, frontZ: dims.plateThicknessMm / 2 },
    ];
  }

  if (templateId === 'triple_display') {
    const apothem = dims.widthMm / 2 / Math.tan(Math.PI / 3);
    const angles: { face: 'front' | 'left' | 'right'; ry: number }[] = [
      { face: 'front', ry: 0 },
      { face: 'left', ry: (2 * Math.PI) / 3 },
      { face: 'right', ry: (-2 * Math.PI) / 3 },
    ];
    return angles.map(({ face, ry }) => {
      const m = new THREE.Matrix4();
      const rot = new THREE.Matrix4().makeRotationY(ry);
      const trans = new THREE.Matrix4().makeTranslation(0, dims.baseThicknessMm + dims.heightMm / 2 - 1, apothem);
      m.multiplyMatrices(rot, trans);
      return { face, matrix: m, frontZ: dims.plateThicknessMm / 2 };
    });
  }

  if (templateId === 'restaurant_tent') {
    const tiltRad = Math.max(0.22, rad || 0.3);
    const halfSpanZ = (dims.heightMm / 2) * Math.sin(tiltRad);
    const tentCenterY = (dims.heightMm / 2) * Math.cos(tiltRad);

    const front = new THREE.Matrix4()
      .makeTranslation(0, tentCenterY, halfSpanZ * 0.5)
      .multiply(new THREE.Matrix4().makeRotationX(-tiltRad));
    const back = new THREE.Matrix4()
      .makeTranslation(0, tentCenterY, -halfSpanZ * 0.5)
      .multiply(new THREE.Matrix4().makeRotationY(Math.PI))
      .multiply(new THREE.Matrix4().makeRotationX(-tiltRad));

    return [
      { face: 'front', matrix: front, frontZ: dims.plateThicknessMm / 2 },
      { face: 'back', matrix: back, frontZ: dims.plateThicknessMm / 2 },
    ];
  }

  const m = new THREE.Matrix4()
    .makeTranslation(0, centerY, dims.heightMm * 0.14 * Math.sin(rad))
    .multiply(new THREE.Matrix4().makeRotationX(-rad));

  const placements: FacePlacement[] = [
    { face: 'front', matrix: m, frontZ: dims.plateThicknessMm / 2 },
  ];

  if (dims.frontAndRearLayout) {
    const backM = m.clone().multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    placements.push({ face: 'back', matrix: backM, frontZ: dims.plateThicknessMm / 2 });
  }

  return placements;
}

function buildQRPartGeometries(
  qr: QRCodeConfig,
  printingMode: PrintingMode,
  dims: StandDimensions,
  frontZ: number,
  faceMatrix: THREE.Matrix4,
  logoPunchoutBox?: { minRow: number; maxRow: number; minCol: number; maxCol: number }
): {
  recessPocketApron?: THREE.BufferGeometry;
  qrModules?: THREE.BufferGeometry;
} {
  if (!qr.visible) return {};

  const payload = buildQRPayload(qr.type, qr.fields);
  let matrixResult;
  try {
    matrixResult = generateQRMatrix(payload, qr.errorCorrection);
  } catch {
    matrixResult = generateQRMatrix('https://jasvel3dmakers.co.in', 'M');
  }

  let modules = matrixResult.modules;
  if (logoPunchoutBox) {
    modules = applyCenterLogoPunchout(modules, logoPunchoutBox);
  }

  const N = matrixResult.size;
  const totalCells = N + qr.quietZone * 2;
  const modSize = qr.sizeMm / totalCells;
  const relief = dims.qrReliefDepthMm;
  const halfQR = qr.sizeMm / 2;
  const qx = qr.positionX;
  const qy = qr.positionY;

  if (printingMode === 'raised') {
    const boxes: THREE.BufferGeometry[] = [];
    const overlap = 0.15;
    const h = relief + overlap;
    const zCenter = frontZ - overlap + h / 2;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!modules[r][c]) continue;
        let runEnd = c;
        while (runEnd + 1 < N && modules[r][runEnd + 1]) {
          runEnd++;
        }
        const runLen = runEnd - c + 1;
        const w = runLen * modSize;
        const x = qx - halfQR + (qr.quietZone + c + runLen / 2) * modSize;
        const y = qy + halfQR - (qr.quietZone + r + 0.5) * modSize;

        const box = new THREE.BoxGeometry(w, modSize, h);
        box.translate(x, y, zCenter);
        boxes.push(box);
        c = runEnd;
      }
    }

    const merged = mergeSafe(boxes);
    boxes.forEach((b) => b.dispose());
    if (merged) merged.applyMatrix4(faceMatrix);
    return { qrModules: merged || undefined };
  }

  const lightCellBoxes: THREE.BufferGeometry[] = [];
  const zPocketStart = frontZ - relief;
  const zPocketCenter = zPocketStart + relief / 2;

  const quietWidth = qr.quietZone * modSize;
  if (quietWidth > 0.05) {
    const innerSpan = N * modSize;
    const topStrip = new THREE.BoxGeometry(qr.sizeMm, quietWidth, relief);
    topStrip.translate(qx, qy + halfQR - quietWidth / 2, zPocketCenter);
    const botStrip = new THREE.BoxGeometry(qr.sizeMm, quietWidth, relief);
    botStrip.translate(qx, qy - halfQR + quietWidth / 2, zPocketCenter);
    const leftStrip = new THREE.BoxGeometry(quietWidth, innerSpan, relief);
    leftStrip.translate(qx - halfQR + quietWidth / 2, qy, zPocketCenter);
    const rightStrip = new THREE.BoxGeometry(quietWidth, innerSpan, relief);
    rightStrip.translate(qx + halfQR - quietWidth / 2, qy, zPocketCenter);
    lightCellBoxes.push(topStrip, botStrip, leftStrip, rightStrip);
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (modules[r][c]) continue;
      let runEnd = c;
      while (runEnd + 1 < N && !modules[r][runEnd + 1]) {
        runEnd++;
      }
      const runLen = runEnd - c + 1;
      const w = runLen * modSize;
      const x = qx - halfQR + (qr.quietZone + c + runLen / 2) * modSize;
      const y = qy + halfQR - (qr.quietZone + r + 0.5) * modSize;

      const box = new THREE.BoxGeometry(w, modSize, relief);
      box.translate(x, y, zPocketCenter);
      lightCellBoxes.push(box);
      c = runEnd;
    }
  }

  const lightPocketWalls = mergeSafe(lightCellBoxes);
  lightCellBoxes.forEach((b) => b.dispose());
  if (lightPocketWalls) lightPocketWalls.applyMatrix4(faceMatrix);

  if (printingMode === 'recessed') {
    const darkFloors: THREE.BufferGeometry[] = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!modules[r][c]) continue;
        let runEnd = c;
        while (runEnd + 1 < N && modules[r][runEnd + 1]) runEnd++;
        const runLen = runEnd - c + 1;
        const w = runLen * modSize;
        const x = qx - halfQR + (qr.quietZone + c + runLen / 2) * modSize;
        const y = qy + halfQR - (qr.quietZone + r + 0.5) * modSize;
        const floor = new THREE.BoxGeometry(w, modSize, 0.12);
        floor.translate(x, y, zPocketStart + 0.06);
        darkFloors.push(floor);
        c = runEnd;
      }
    }
    const previewFloor = mergeSafe(darkFloors);
    darkFloors.forEach((b) => b.dispose());
    if (previewFloor) previewFloor.applyMatrix4(faceMatrix);
    return {
      recessPocketApron: lightPocketWalls || undefined,
      qrModules: previewFloor || undefined,
    };
  }

  // Dual-Color Inlay mode
  const clearance = dims.inlayClearanceMm;
  const inlayBoxes: THREE.BufferGeometry[] = [];
  const inlayDepth = Math.max(0.5, relief - 0.05);
  const inlayZ = zPocketStart + inlayDepth / 2 + 0.05;

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!modules[r][c]) continue;
      const w = Math.max(0.2, modSize - clearance);
      const h = Math.max(0.2, modSize - clearance);
      const x = qx - halfQR + (qr.quietZone + c + 0.5) * modSize;
      const y = qy + halfQR - (qr.quietZone + r + 0.5) * modSize;

      const cell = new THREE.BoxGeometry(w, h, inlayDepth);
      cell.translate(x, y, inlayZ);
      inlayBoxes.push(cell);
    }
  }

  const inlayGeo = mergeSafe(inlayBoxes);
  inlayBoxes.forEach((b) => b.dispose());
  if (inlayGeo) inlayGeo.applyMatrix4(faceMatrix);

  return {
    recessPocketApron: lightPocketWalls || undefined,
    qrModules: inlayGeo || undefined,
  };
}

export function generateStandGeometry(design: StandDesign): StandPartGeometries {
  const dims = clampDimensions(design.dimensions, design.templateId);
  const tplId = design.templateId;

  const baseParts: THREE.BufferGeometry[] = [];
  const bodyParts: THREE.BufferGeometry[] = [];
  const frameParts: THREE.BufferGeometry[] = [];
  const qrParts: THREE.BufferGeometry[] = [];
  const textParts: THREE.BufferGeometry[] = [];
  const logoParts: THREE.BufferGeometry[] = [];
  const decorationParts: THREE.BufferGeometry[] = [];

  // Validate center logo if present
  let logoPunchout: { minRow: number; maxRow: number; minCol: number; maxCol: number } | undefined;
  if (design.logo.enabled && design.qrCodes[0]) {
    const logoReport = validateCenterLogo(design.qrCodes[0], design.logo);
    if (logoReport.safeToRender && logoReport.punchoutBox) {
      logoPunchout = logoReport.punchoutBox;
    }
  }

  // 1. Base pedestal
  if (design.visibility.base) {
    const baseGeo = buildPedestalBaseGeometry(tplId, dims);
    if (baseGeo) baseParts.push(baseGeo);
  }

  // 2. Face placements
  const placements = computeFacePlacements(tplId, dims);

  for (const placement of placements) {
    const faceQr =
      design.qrCodes.find((q) => q.face === placement.face) ||
      (placement.face === 'back' && tplId === 'restaurant_tent' ? design.qrCodes[0] : undefined);

    const hasRecessOnFace =
      Boolean(faceQr && faceQr.visible) &&
      (design.printingMode === 'recessed' || design.printingMode === 'inlay');

    // Plate body silhouette
    if (design.visibility.body) {
      const plateShape = makeSilhouetteShape(
        tplId,
        dims.widthMm,
        tplId === 'mini_keychain' ? dims.heightMm : dims.heightMm,
        dims.cornerRadiusMm
      );

      if (dims.wallMountHoles && placement.face === 'front' && tplId !== 'mini_keychain') {
        addWallMountKeyholePaths(plateShape, dims.widthMm, dims.heightMm);
      }

      const mainDepth = hasRecessOnFace
        ? Math.max(1.0, dims.plateThicknessMm - dims.qrReliefDepthMm)
        : dims.plateThicknessMm;

      const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
        depth: mainDepth,
        bevelEnabled: dims.roundedEdges,
        bevelThickness: dims.roundedEdges ? 0.45 : 0,
        bevelSize: dims.roundedEdges ? 0.45 : 0,
        bevelSegments: 2,
        curveSegments: 24,
      });
      plateGeo.translate(0, 0, -dims.plateThicknessMm / 2);
      plateGeo.applyMatrix4(placement.matrix);
      bodyParts.push(plateGeo);

      if (hasRecessOnFace && faceQr) {
        const apronShape = makeSilhouetteShape(
          tplId,
          dims.widthMm,
          dims.heightMm,
          dims.cornerRadiusMm
        );
        const hole = new THREE.Path();
        const hs = faceQr.sizeMm / 2;
        const qx = faceQr.positionX;
        const qy = faceQr.positionY;
        hole.moveTo(qx - hs, qy - hs);
        hole.lineTo(qx - hs, qy + hs);
        hole.lineTo(qx + hs, qy + hs);
        hole.lineTo(qx + hs, qy - hs);
        hole.closePath();
        apronShape.holes.push(hole);

        const apronGeo = new THREE.ExtrudeGeometry(apronShape, {
          depth: dims.qrReliefDepthMm,
          bevelEnabled: false,
          curveSegments: 24,
        });
        apronGeo.translate(0, 0, placement.frontZ - dims.qrReliefDepthMm);
        apronGeo.applyMatrix4(placement.matrix);
        bodyParts.push(apronGeo);
      }

      if (tplId === 'mini_keychain' && placement.face === 'front') {
        const loop = buildKeychainLoopGeometry(dims.widthMm, dims.heightMm, dims.plateThicknessMm);
        loop.applyMatrix4(placement.matrix);
        bodyParts.push(loop);
      }
    }

    // Frame border
    if (design.visibility.frame && dims.borderThicknessMm > 0.2 && dims.frameDepthMm > 0.1) {
      const frameShape = makeOuterFrameShape(
        tplId,
        dims.widthMm,
        dims.heightMm,
        dims.cornerRadiusMm,
        dims.borderThicknessMm
      );
      if (frameShape) {
        const fGeo = new THREE.ExtrudeGeometry(frameShape, {
          depth: dims.frameDepthMm,
          bevelEnabled: dims.roundedEdges,
          bevelThickness: dims.roundedEdges ? 0.3 : 0,
          bevelSize: dims.roundedEdges ? 0.3 : 0,
          bevelSegments: 1,
          curveSegments: 24,
        });
        fGeo.translate(0, 0, placement.frontZ - 0.15);
        fGeo.applyMatrix4(placement.matrix);
        frameParts.push(fGeo);
      }
    }

    // QR Code geometry
    if (design.visibility.qr && faceQr && faceQr.visible) {
      const { recessPocketApron, qrModules } = buildQRPartGeometries(
        faceQr,
        design.printingMode,
        dims,
        placement.frontZ,
        placement.matrix,
        placement.face === 'front' ? logoPunchout : undefined
      );
      if (recessPocketApron) bodyParts.push(recessPocketApron);
      if (qrModules) qrParts.push(qrModules);
    }

    // Text geometry
    if (design.visibility.text) {
      for (const txt of design.texts) {
        if (!txt.visible || !txt.content.trim()) continue;
        const belongsToFace =
          txt.face === placement.face ||
          (placement.face === 'back' && tplId === 'restaurant_tent' && txt.face === 'front');
        if (!belongsToFace) continue;

        const tGeo = buildTextGeometry3D(txt);
        if (!tGeo) continue;

        if (txt.rotationDeg !== 0) {
          tGeo.rotateZ((txt.rotationDeg * Math.PI) / 180);
        }

        tGeo.computeBoundingBox();
        const tbb = tGeo.boundingBox!;
        const tw = Math.max(0.01, tbb.max.x - tbb.min.x);
        const maxTextWidth = Math.max(20, dims.widthMm - dims.borderThicknessMm * 2 - 8);
        if (tw > maxTextWidth) {
          const fitScale = maxTextWidth / tw;
          tGeo.scale(fitScale, fitScale, 1);
          tGeo.computeBoundingBox();
        }
        const fittedTw = tGeo.boundingBox!.max.x - tGeo.boundingBox!.min.x;
        let alignOffset = 0;
        if (txt.align === 'left') alignOffset = fittedTw / 2 - dims.widthMm * 0.38;
        else if (txt.align === 'right') alignOffset = -fittedTw / 2 + dims.widthMm * 0.38;

        const zPos =
          txt.mode === 'engraved'
            ? placement.frontZ - Math.min(txt.depthMm, dims.plateThicknessMm * 0.45) + 0.05
            : placement.frontZ - 0.1;

        tGeo.translate(txt.xMm + alignOffset, txt.yMm, zPos);
        tGeo.applyMatrix4(placement.matrix);
        textParts.push(tGeo);
      }
    }

    // Logo & decorations
    if (placement.face === 'front' || (placement.face === 'back' && tplId === 'restaurant_tent')) {
      if (design.visibility.logo && design.logo.enabled) {
        const logoY =
          design.logo.placement === 'above'
            ? (faceQr ? faceQr.positionY + faceQr.sizeMm / 2 + design.logo.sizeMm * 0.65 : 34)
            : design.logo.placement === 'below'
              ? (faceQr ? faceQr.positionY - faceQr.sizeMm / 2 - design.logo.sizeMm * 0.65 : -34)
              : design.logo.yMm;

        const lFrame = buildLogoFrameGeometry3D(design.logo, placement.frontZ);
        if (lFrame) {
          lFrame.translate(design.logo.xMm, logoY, 0);
          lFrame.applyMatrix4(placement.matrix);
          frameParts.push(lFrame);
        }

        // Center logo badge backing
        const badge = new THREE.CylinderGeometry(
          design.logo.sizeMm / 2,
          design.logo.sizeMm / 2,
          design.logo.depthMm,
          24
        );
        badge.rotateX(Math.PI / 2);
        badge.translate(design.logo.xMm, logoY, placement.frontZ + design.logo.depthMm / 2);
        badge.applyMatrix4(placement.matrix);
        logoParts.push(badge);
      }

      if (design.visibility.decorations) {
        for (const dec of design.decorations) {
          if (!dec.visible) continue;
          const dGeo = buildDecorationGeometry3D(dec, placement.frontZ);
          if (!dGeo) continue;
          if (dec.rotationDeg !== 0) {
            dGeo.rotateZ((dec.rotationDeg * Math.PI) / 180);
          }
          dGeo.translate(dec.xMm, dec.yMm, 0);
          dGeo.applyMatrix4(placement.matrix);
          decorationParts.push(dGeo);
        }
      }
    }
  }

  // Tent cross-brace & triple display center core
  if (tplId === 'restaurant_tent' && design.visibility.body) {
    const tiltRad = Math.max(0.22, (dims.inclinationDeg * Math.PI) / 180 || 0.3);
    const spanZ = dims.heightMm * Math.sin(tiltRad);
    const barLeft = new THREE.BoxGeometry(5, 4, spanZ * 0.9);
    barLeft.translate(-dims.widthMm * 0.38, 2.5, 0);
    const barRight = new THREE.BoxGeometry(5, 4, spanZ * 0.9);
    barRight.translate(dims.widthMm * 0.38, 2.5, 0);
    bodyParts.push(barLeft, barRight);
  }

  if (tplId === 'triple_display' && design.visibility.body) {
    const apothem = dims.widthMm / 2 / Math.tan(Math.PI / 3);
    const core = new THREE.CylinderGeometry(apothem * 0.95, apothem * 0.95, dims.heightMm - 2, 3);
    core.translate(0, dims.baseThicknessMm + dims.heightMm / 2 - 1, 0);
    bodyParts.push(core);
  }

  const base = mergeSafe(baseParts);
  const body = mergeSafe(bodyParts);
  const frame = mergeSafe(frameParts);
  const qrModules = mergeSafe(qrParts);
  const text = mergeSafe(textParts);
  const logo = mergeSafe(logoParts);
  const decorations = mergeSafe(decorationParts);

  [baseParts, bodyParts, frameParts, qrParts, textParts, logoParts, decorationParts].forEach((arr) =>
    arr.forEach((g) => g.dispose())
  );

  const box = new THREE.Box3();
  [base, body, frame, qrModules, text, logo, decorations].forEach((g) => {
    if (g) {
      g.computeBoundingBox();
      if (g.boundingBox) box.union(g.boundingBox);
    }
  });

  if (box.isEmpty()) {
    box.set(new THREE.Vector3(-40, 0, -20), new THREE.Vector3(40, 100, 20));
  }

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  let triangleCount = 0;
  [base, body, frame, qrModules, text, logo, decorations].forEach((g) => {
    if (g?.attributes.position) {
      triangleCount += Math.floor(g.attributes.position.count / 3);
    }
  });

  return {
    base,
    body,
    frame,
    qrModules,
    text,
    logo,
    decorations,
    bounds: {
      min: box.min.clone(),
      max: box.max.clone(),
      size,
      center,
    },
    triangleCount,
  };
}
