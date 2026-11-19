import { NameplateDesign, PrintProfile, ValidationIssue } from '../core/types';

export interface GeometryMeasurementSummary {
  textWidthMm: number;
  textHeightMm: number;
  islandCount: number;
  hasDegenerateGeometry?: boolean;
}

/**
 * Validates a NameplateDesign against 3D printing engineering rules
 * and the active printer profile.
 */
export function validateDesignForPrinting(
  design: NameplateDesign,
  profile: PrintProfile,
  measurements?: GeometryMeasurementSummary,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const minWall = Math.max(0.8, profile.nozzleDiameterMm * 2);

  // 1. Out-of-bounds model dimensions
  if (design.widthMm > profile.bedWidthMm || design.heightMm > profile.bedDepthMm) {
    issues.push({
      id: 'out-of-bounds',
      code: 'BED_OVERFLOW',
      severity: 'error',
      title: 'Exceeds Printer Build Volume',
      description: `Model (${design.widthMm} × ${design.heightMm} mm) exceeds ${profile.printerName} bed (${profile.bedWidthMm} × ${profile.bedDepthMm} mm).`,
      suggestion: `Reduce width/height below ${profile.bedWidthMm} × ${profile.bedDepthMm} mm or rotate 45° diagonally in slicer.`,
      autoFixLabel: 'Fit to Bed',
    });
  }

  // 2. Minimum feature thickness (base, border, lettering)
  if (design.baseThicknessMm < 2.0 && design.mountingStyle !== 'text-only-3d') {
    issues.push({
      id: 'thin-base',
      code: 'MIN_BASE_THICKNESS',
      severity: 'warning',
      title: 'Thin Base Plate (< 2.0 mm)',
      description: `Base thickness is ${design.baseThicknessMm.toFixed(1)} mm. Thin plates may warp on heated beds or flex when mounted.`,
      suggestion: 'Increase base thickness to at least 3.0–4.5 mm for rigid structural flatness.',
      autoFixLabel: 'Set 3.5 mm Base',
    });
  }

  if (design.borderEnabled && design.borderWidthMm < minWall) {
    issues.push({
      id: 'thin-border',
      code: 'MIN_BORDER_WIDTH',
      severity: 'warning',
      title: 'Border Below 2-Perimeter Minimum',
      description: `Border width (${design.borderWidthMm.toFixed(1)} mm) is narrower than 2× nozzle diameter (${minWall.toFixed(1)} mm).`,
      suggestion: `Widen border to at least ${Math.max(1.6, minWall * 1.5).toFixed(1)} mm so walls slice cleanly.`,
      autoFixLabel: 'Widen Border',
    });
  }

  // Small font check
  const smallestFont = design.lines.reduce(
    (min, line) => (line.text.trim() ? Math.min(min, line.fontSize) : min),
    Infinity,
  );
  if (smallestFont < 5.5) {
    issues.push({
      id: 'small-text',
      code: 'THIN_STROKES',
      severity: 'warning',
      title: 'Fine Letter Strokes May Under-Extrude',
      description: `Smallest text line is ${smallestFont.toFixed(1)} mm tall. Strokes under ~0.8 mm risk gaps with a ${profile.nozzleDiameterMm} mm nozzle.`,
      suggestion: 'Increase font size to ≥ 6.5 mm, enable Bold, or switch to a 0.2 mm nozzle / Arachne wall generator.',
    });
  }

  // 3. Engraving depth vs base thickness
  if (
    design.letteringMode === 'engraved' &&
    design.engravingDepthMm >= design.baseThicknessMm - 0.8
  ) {
    issues.push({
      id: 'deep-engraving',
      code: 'ENGRAVING_THROUGH_BASE',
      severity: 'error',
      title: 'Engraving Cuts Nearly Through Base',
      description: `Engraving depth (${design.engravingDepthMm.toFixed(1)} mm) leaves less than 0.8 mm behind the letters (base ${design.baseThicknessMm.toFixed(1)} mm).`,
      suggestion: 'Reduce engraving depth or thicken the base plate so at least 1.5 mm remains solid.',
      autoFixLabel: 'Fix Engraving Depth',
    });
  }

  // 4. Disconnected text islands (text-only-3d or cut-out mode)
  const nonEmptyLines = design.lines.filter((l) => l.text.trim().length > 0);
  if (nonEmptyLines.length === 0) {
    issues.push({
      id: 'empty-text',
      code: 'NO_TEXT',
      severity: 'error',
      title: 'No Text Content',
      description: 'All text lines are currently empty.',
      suggestion: 'Enter at least one name or custom line to generate printable lettering geometry.',
    });
  }

  if (design.mountingStyle === 'text-only-3d') {
    const totalChars = nonEmptyLines.map((l) => l.text.trim()).join('');
    if (totalChars.includes(' ') || nonEmptyLines.length > 1 || /[ij!?]/.test(totalChars)) {
      issues.push({
        id: 'disconnected-islands',
        code: 'DISCONNECTED_ISLANDS',
        severity: 'warning',
        title: 'Disconnected Letter Islands Detected',
        description:
          'Text-Only 3D mode with spaces, multiple lines, or dotted letters (i, j) produces separate floating pieces.',
        suggestion:
          'Add a base bar (Freestanding Desk or Layered Background) or print with a transfer alignment jig.',
      });
    }
  } else if (design.letteringMode === 'cut-out' && design.mountingStyle !== 'layered-background') {
    issues.push({
      id: 'cutout-centers',
      code: 'STENCIL_ISLANDS',
      severity: 'info',
      title: 'Cut-Out Letter Centers (O, A, B, R)',
      description:
        'Through-cut lettering drops loose inner cores unless backed by a secondary diffuser plate.',
      suggestion:
        'Switch Mounting Style to "Layered Background" to capture inner letter cores on a backing plate.',
    });
  }

  // 5. Overlapping objects / text overflow beyond safe clearance
  if (measurements) {
    const safeWidth = design.widthMm - design.textClearanceMm * 2 - (design.borderEnabled ? design.borderWidthMm * 2 : 0);
    const safeHeight = design.heightMm - design.textClearanceMm * 1.4 - (design.borderEnabled ? design.borderWidthMm * 2 : 0);

    if (
      design.shape !== 'text-outline' &&
      (measurements.textWidthMm > safeWidth || measurements.textHeightMm > safeHeight)
    ) {
      issues.push({
        id: 'text-overflow',
        code: 'TEXT_OVERLAP_BORDER',
        severity: 'warning',
        title: 'Text Extends Into Border / Edge Clearance',
        description: `Text footprint (${measurements.textWidthMm.toFixed(0)} × ${measurements.textHeightMm.toFixed(0)} mm) exceeds safe inner area (${Math.max(10, safeWidth).toFixed(0)} × ${Math.max(10, safeHeight).toFixed(0)} mm).`,
        suggestion: 'Widen the plate, lower font size, or reduce Text-to-Base Clearance.',
        autoFixLabel: 'Auto-Fit Plate Width',
      });
    }

    if (measurements.hasDegenerateGeometry) {
      issues.push({
        id: 'non-manifold',
        code: 'NON_MANIFOLD_CHECK',
        severity: 'error',
        title: 'Invalid or Zero-Area Mesh Detected',
        description: 'Generated mesh contains degenerate triangles or invalid extrusion depth.',
        suggestion: 'Ensure extrusion thickness > 0.2 mm and avoid overlapping self-intersecting glyphs.',
      });
    }
  }

  // 6. Excessive unsupported overhangs on desk stand
  if (design.mountingStyle === 'freestanding-desk') {
    if (design.deskStandAngleDeg > 35 && !design.deskStandSupportRibs) {
      issues.push({
        id: 'stand-overhang',
        code: 'UNSUPPORTED_OVERHANG',
        severity: 'warning',
        title: 'Steep Tilt Without Support Ribs',
        description: `Desk stand tilt is ${design.deskStandAngleDeg}° with support ribs disabled, causing a >35° overhang.`,
        suggestion: 'Enable Rear Support Ribs or print the stand lying on its side edge.',
        autoFixLabel: 'Enable Support Ribs',
      });
    }
  }

  // 7. Mounting hole edge margin check
  if (design.mountingHolesEnabled && design.mountingHoleInsetMm < design.mountingHoleDiameterMm * 1.25) {
    issues.push({
      id: 'hole-margin',
      code: 'HOLE_TOO_CLOSE_TO_EDGE',
      severity: 'warning',
      title: 'Mounting Hole Close to Outer Edge',
      description: `Hole inset (${design.mountingHoleInsetMm} mm) is tight for a ${design.mountingHoleDiameterMm} mm screw hole.`,
      suggestion: 'Keep hole inset at least 1.5× hole diameter from the perimeter to avoid cracking.',
    });
  }

  return issues;
}

export function applyAutoFix(design: NameplateDesign, profile: PrintProfile, code: string, measurements?: GeometryMeasurementSummary): NameplateDesign {
  switch (code) {
    case 'BED_OVERFLOW':
      return {
        ...design,
        widthMm: Math.min(design.widthMm, profile.bedWidthMm - 10),
        heightMm: Math.min(design.heightMm, profile.bedDepthMm - 10),
      };
    case 'MIN_BASE_THICKNESS':
      return { ...design, baseThicknessMm: 3.5 };
    case 'MIN_BORDER_WIDTH':
      return { ...design, borderWidthMm: Math.max(2.0, profile.nozzleDiameterMm * 4) };
    case 'ENGRAVING_THROUGH_BASE':
      return {
        ...design,
        engravingDepthMm: Math.max(0.8, Number((design.baseThicknessMm - 1.8).toFixed(1))),
      };
    case 'TEXT_OVERLAP_BORDER': {
      const targetW = measurements
        ? Math.ceil(measurements.textWidthMm + design.textClearanceMm * 2 + (design.borderEnabled ? design.borderWidthMm * 2 : 0) + 6)
        : design.widthMm + 25;
      return {
        ...design,
        widthMm: Math.min(profile.bedWidthMm, Math.max(design.widthMm, targetW)),
      };
    }
    case 'UNSUPPORTED_OVERHANG':
      return { ...design, deskStandSupportRibs: true };
    default:
      return design;
  }
}
