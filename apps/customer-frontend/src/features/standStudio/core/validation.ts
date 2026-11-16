import type {
  BoundingDimensions,
  DesignConfig,
  ValidationIssue,
  ValidationReport,
} from '../types/design';
import { getBedDimensions } from './defaults';

/**
 * Computes analytical bounding dimensions and validates printability rules
 * independently of UI components so tests and export checks share one source of truth.
 */
export function validateDesignConfig(
  config: DesignConfig,
  measuredDimensions?: BoundingDimensions
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const { phone, pen, combined, personalization, print, category } = config;

  const bedLimit = getBedDimensions(
    print.bedPreset,
    print.customBedX,
    print.customBedY,
    print.customBedZ
  );

  // Estimate fallback dimensions if 3D bounding box isn't passed yet
  const dimensions: BoundingDimensions = measuredDimensions ?? estimateBoundingDimensions(config);

  // 1. Critical zero/negative dimension guards
  if (
    phone.baseWidth <= 0 ||
    phone.baseDepth <= 0 ||
    phone.baseThickness <= 0 ||
    phone.backHeight <= 0 ||
    pen.cupHeight <= 0 ||
    pen.exteriorDiameter <= 0 ||
    pen.wallThickness <= 0 ||
    pen.bottomThickness <= 0
  ) {
    issues.push({
      id: 'nonzero-dimensions',
      severity: 'error',
      title: 'Invalid zero or negative dimension',
      detail: 'All structural dimensions (widths, heights, thicknesses) must be greater than 0 mm.',
      suggestion: 'Increase any zeroed parameter back to at least 3 mm.',
    });
  }

  // 2. Minimum wall thickness check (configurable default: 2.4 mm)
  const minWall = Math.max(1.2, print.minWallThickness || 2.4);
  if (
    (category === 'pen-holder' ||
      category === 'combined' ||
      category === 'desk-organizer') &&
    pen.wallThickness < minWall
  ) {
    issues.push({
      id: 'thin-cup-wall',
      severity: pen.wallThickness < 1.6 ? 'error' : 'warning',
      title: 'Pen holder wall thinner than recommended minimum',
      detail: `Cup wall thickness is ${pen.wallThickness.toFixed(1)} mm (recommended >= ${minWall.toFixed(1)} mm).`,
      suggestion: `Increase wall thickness to at least ${minWall.toFixed(1)} mm for rigid 3+ perimeter printing.`,
    });
  }

  if (phone.baseThickness < 3.0) {
    issues.push({
      id: 'thin-base',
      severity: phone.baseThickness < 2.0 ? 'error' : 'warning',
      title: 'Base plate too thin for flat bed stability',
      detail: `Base thickness is ${phone.baseThickness.toFixed(1)} mm (default safe thickness is 4.0 mm).`,
      suggestion: 'Increase base thickness to at least 4.0 mm to prevent warping and improve weight balance.',
    });
  }

  // 3. Pen cavity diameter sanity check against exterior diameter
  if (category === 'pen-holder' || category === 'combined' || category === 'desk-organizer') {
    const innerDiameter = pen.exteriorDiameter - pen.wallThickness * 2;
    if (innerDiameter < 12 && pen.type !== 'multi-slot-rack') {
      issues.push({
        id: 'cavity-collapsed',
        severity: 'error',
        title: 'Pen cup interior cavity too narrow',
        detail: `Interior diameter is only ${innerDiameter.toFixed(1)} mm after subtracting walls.`,
        suggestion: 'Increase exterior diameter or reduce wall thickness so interior cavity is at least 14 mm.',
      });
    }

    if (pen.type === 'multi-slot-rack' && (pen.slotDiameter < 8 || pen.slotDiameter > 24)) {
      issues.push({
        id: 'slot-diameter-range',
        severity: 'warning',
        title: 'Unusual pen slot diameter',
        detail: `Slot diameter ${pen.slotDiameter.toFixed(1)} mm is outside the typical 9–17 mm pen range.`,
        suggestion: 'Use 9–11 mm for standard pens/pencils or 14–17 mm for thick markers.',
      });
    }
  }

  // 4. Phone clearance and lip safety
  if (category !== 'pen-holder') {
    if (phone.caseClearance < 0.8) {
      issues.push({
        id: 'tight-phone-clearance',
        severity: 'warning',
        title: 'Tight phone case clearance',
        detail: `Clearance is ${phone.caseClearance.toFixed(1)} mm; printed tolerances often shrink by 0.2–0.4 mm.`,
        suggestion: 'Set case clearance between 1.0 mm and 2.0 mm so the phone slides in smoothly.',
      });
    }

    if (phone.lipHeight < 6) {
      issues.push({
        id: 'low-front-lip',
        severity: 'warning',
        title: 'Shallow front retaining lip',
        detail: `Front lip is ${phone.lipHeight.toFixed(1)} mm tall; device could slip forward if nudged.`,
        suggestion: 'Set front lip height to 9–14 mm for secure phone retention.',
      });
    }

    // Overhang angle warning (angles < 48° from horizontal can droop on undersides)
    if (phone.restingAngle < 48) {
      issues.push({
        id: 'excessive-overhang',
        severity: 'warning',
        title: 'Aggressive backrest overhang angle',
        detail: `Backrest angle of ${phone.restingAngle}° creates a steep underside overhang (> 42° from vertical).`,
        suggestion: 'Keep resting angle >= 55° or enable supports in your slicer.',
      });
    }

    // Stability check: tall backrest on shallow base
    const minStableDepth = phone.backHeight * 0.55;
    if (phone.baseDepth < minStableDepth) {
      issues.push({
        id: 'unstable-footprint',
        severity: 'warning',
        title: 'Potential rearward tip-over risk',
        detail: `Base depth (${phone.baseDepth.toFixed(0)} mm) is narrow relative to back height (${phone.backHeight.toFixed(0)} mm).`,
        suggestion: `Increase base depth to at least ${Math.ceil(minStableDepth)} mm to keep center of mass inside footprint.`,
      });
    }

    // Cable slot width vs back/lip width
    if (phone.cableSlotWidth > phone.lipWidth - 12) {
      issues.push({
        id: 'wide-cable-slot',
        severity: 'error',
        title: 'Cable slot wider than front lip support',
        detail: `Cable slot (${phone.cableSlotWidth} mm) splits or weakens the ${phone.lipWidth} mm front lip.`,
        suggestion: 'Reduce cable slot width or widen the front lip/back support.',
      });
    }
  }

  // 5. Engraving depth safety check
  if (personalization.enabled && personalization.mode === 'engraved') {
    if (personalization.depth >= phone.baseThickness * 0.75) {
      issues.push({
        id: 'deep-engraving',
        severity: 'warning',
        title: 'Engraving depth approaches wall/base thickness',
        detail: `Engraving depth (${personalization.depth.toFixed(1)} mm) may cut too deeply into thin walls.`,
        suggestion: 'Keep engraving depth between 0.8 mm and 1.8 mm for clean FDM bridging.',
      });
    }
  }

  // 6. Build volume check
  const fitsBed =
    dimensions.width <= bedLimit.x &&
    dimensions.depth <= bedLimit.y &&
    dimensions.height <= bedLimit.z;

  if (!fitsBed) {
    issues.push({
      id: 'exceeds-build-plate',
      severity: 'error',
      title: 'Model exceeds selected build volume',
      detail: `Model bounds (${dimensions.width.toFixed(0)} × ${dimensions.depth.toFixed(0)} × ${dimensions.height.toFixed(0)} mm) exceed ${bedLimit.x} × ${bedLimit.y} × ${bedLimit.z} mm.`,
      suggestion: 'Scale down widths/spacing or choose a larger build plate preset (e.g. 256×256 mm).',
    });
  }

  // 7. Narrow contact warning for small bases
  if (dimensions.width < 32 || dimensions.depth < 32) {
    issues.push({
      id: 'narrow-contact',
      severity: 'warning',
      title: 'Small bed contact area',
      detail: 'Footprint under 32 mm may detach during printing.',
      suggestion: 'Widen the base or add a brim in your slicer.',
    });
  }

  const hasError = issues.some((issue) => issue.severity === 'error');

  return {
    validForExport: !hasError,
    issues,
    dimensions,
    bedLimit,
    fitsBed,
  };
}

export function estimateBoundingDimensions(config: DesignConfig): BoundingDimensions {
  const { category, phone, pen, combined } = config;
  const effectivePhoneWidth =
    phone.orientation === 'landscape' ? Math.max(phone.baseWidth, 118) : phone.baseWidth;

  if (category === 'phone-stand') {
    return {
      width: effectivePhoneWidth,
      depth: phone.baseDepth,
      height: phone.baseThickness + phone.backHeight,
    };
  }

  if (category === 'pen-holder') {
    const width =
      pen.cupCount > 1
        ? pen.exteriorDiameter + (pen.cupCount - 1) * (pen.secondaryCupDiameter + 4)
        : pen.exteriorDiameter;
    const depth = pen.shallowTray ? pen.exteriorDiameter + 38 : pen.exteriorDiameter;
    return {
      width,
      depth,
      height: pen.cupHeight + (pen.integratedBase ? 4 : 0),
    };
  }

  if (category === 'combined' || category === 'desk-organizer' || category === 'personalized-gift') {
    const dualPen = combined.type === 'center-phone-dual-pens' ? 2 : 1;
    const trayExtra = combined.includeTray ? combined.trayWidth + combined.moduleSpacing : 0;
    const width =
      effectivePhoneWidth +
      dualPen * pen.exteriorDiameter +
      combined.moduleSpacing * dualPen +
      trayExtra +
      12;
    const depth = Math.max(phone.baseDepth, pen.exteriorDiameter + 14);
    const height = Math.max(phone.baseThickness + phone.backHeight, pen.cupHeight + phone.baseThickness);
    return { width, depth, height };
  }

  return { width: 100, depth: 100, height: 100 };
}
