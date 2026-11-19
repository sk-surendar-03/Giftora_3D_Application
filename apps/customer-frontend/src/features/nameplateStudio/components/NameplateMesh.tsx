import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ensureFontLoaded } from '../core/fonts';
import { NameplateDesign } from '../core/types';
import {
  createBasePlateShape,
  createBorderFrameShape,
  pointsToThreeShape,
} from '../geometry/baseGeometry';
import { GeometryMeasurementSummary } from '../geometry/validation';
import { buildMaterialProps } from '../geometry/materials';
import { buildDecorationGeometries, buildDeskStandGeometries } from '../geometry/mountingGeometry';
import { buildAllTextLines } from '../geometry/textGeometry';

interface NameplateMeshProps {
  design: NameplateDesign;
  exportGroupRef?: React.RefObject<THREE.Group | null>;
  onMeasurements?: (summary: GeometryMeasurementSummary) => void;
  explodedPreview?: boolean;
  fontReadyTick?: number;
}

export const NameplateMesh: React.FC<NameplateMeshProps> = ({
  design,
  exportGroupRef,
  onMeasurements,
  explodedPreview = false,
  fontReadyTick = 0,
}) => {
  // Ensure selected fonts are loaded and re-trigger geometry when ready
  const [loadedTick, setLoadedTick] = React.useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      design.lines.map((l) => ensureFontLoaded(l.fontId, l.bold, l.italic)),
    ).then(() => {
      if (!cancelled) setLoadedTick((t) => t + 1);
    });
    const onLoadingDone = () => {
      if (!cancelled) setLoadedTick((t) => t + 1);
    };
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.addEventListener('loadingdone', onLoadingDone);
    }
    return () => {
      cancelled = true;
      if (typeof document !== 'undefined' && 'fonts' in document) {
        document.fonts.removeEventListener('loadingdone', onLoadingDone);
      }
    };
  }, [design.lines]);

  // 1. Trace text contours in millimeter space
  const textMeasurement = useMemo(() => {
    void loadedTick;
    void fontReadyTick;
    return buildAllTextLines(design);
  }, [design, loadedTick, fontReadyTick]);

  useEffect(() => {
    onMeasurements?.({
      textWidthMm: textMeasurement.widthMm,
      textHeightMm: textMeasurement.heightMm,
      islandCount: textMeasurement.islandCount,
    });
  }, [textMeasurement, onMeasurements]);

  // 2. Build Base Plate, Secondary Layer, Border, Text, Decorations & Stand Geometries
  const built = useMemo(() => {
    const textBounds = {
      width: textMeasurement.widthMm,
      height: textMeasurement.heightMm,
    };

    const baseGeometries: THREE.BufferGeometry[] = [];
    const secondaryGeometries: THREE.BufferGeometry[] = [];
    const recessedInlayGeometries: { geo: THREE.BufferGeometry; color: string }[] = [];
    const textMeshes: { geo: THREE.BufferGeometry; color: string; zOffset: number }[] = [];
    const borderGeometries: THREE.BufferGeometry[] = [];
    const decorationGeometries: THREE.BufferGeometry[] = [];
    const ledGeometries: THREE.BufferGeometry[] = [];

    const baseZ = Math.max(1.2, design.baseThicknessMm);
    const bevelBase = Math.min(0.45, baseZ * 0.12);

    if (design.mountingStyle !== 'text-only-3d') {
      const { shape: baseShape } = createBasePlateShape(design, textBounds);

      if (design.letteringMode === 'engraved') {
        const engraveD = Math.min(baseZ - 0.8, Math.max(0.4, design.engravingDepthMm));
        const lowerZ = Math.max(0.8, baseZ - engraveD);

        // Lower solid slab
        const lowerGeo = new THREE.ExtrudeGeometry(baseShape, {
          depth: lowerZ,
          bevelEnabled: true,
          bevelThickness: bevelBase * 0.6,
          bevelSize: bevelBase * 0.6,
          bevelSegments: 2,
          curveSegments: 24,
        });
        baseGeometries.push(lowerGeo);

        // Upper perforated plate with letter outer shapes punched as holes
        const topShape = createBasePlateShape(design, textBounds).shape;
        const counterIslands: THREE.Shape[] = [];
        for (const lineRes of textMeasurement.lines) {
          for (const poly of lineRes.polygonsMm) {
            // Punch outer letter contour as hole in top faceplate
            const holePath = new THREE.Path();
            if (poly.outer.length > 0) {
              holePath.moveTo(poly.outer[0].x, poly.outer[0].y);
              for (let i = poly.outer.length - 1; i >= 1; i--) {
                holePath.lineTo(poly.outer[i].x, poly.outer[i].y);
              }
              holePath.closePath();
              topShape.holes.push(holePath);
            }
            // Restore inner counter islands (inside O, A, B, etc.) as solid islands
            for (const innerHole of poly.holes) {
              if (innerHole.length >= 3) {
                const islandPts = [...innerHole].reverse();
                counterIslands.push(pointsToThreeShape(islandPts));
              }
            }
          }
        }

        const topFaceGeo = new THREE.ExtrudeGeometry(topShape, {
          depth: engraveD,
          bevelEnabled: true,
          bevelThickness: 0.2,
          bevelSize: 0.15,
          bevelSegments: 1,
          curveSegments: 18,
        });
        topFaceGeo.translate(0, 0, lowerZ);
        baseGeometries.push(topFaceGeo);

        if (counterIslands.length > 0) {
          const islandGeo = new THREE.ExtrudeGeometry(counterIslands, {
            depth: engraveD,
            bevelEnabled: false,
            curveSegments: 16,
          });
          islandGeo.translate(0, 0, lowerZ);
          baseGeometries.push(islandGeo);
        }

        // Subtle colored pocket floor highlight for engraved contrast
        for (const lineRes of textMeasurement.lines) {
          if (lineRes.shapes.length > 0) {
            const inlayGeo = new THREE.ExtrudeGeometry(lineRes.shapes, {
              depth: 0.22,
              bevelEnabled: false,
              curveSegments: 14,
            });
            inlayGeo.translate(0, 0, lowerZ - 0.05);
            recessedInlayGeometries.push({ geo: inlayGeo, color: lineRes.color });
          }
        }
      } else if (design.letteringMode === 'cut-out') {
        const cutShape = createBasePlateShape(design, textBounds).shape;
        for (const lineRes of textMeasurement.lines) {
          for (const poly of lineRes.polygonsMm) {
            if (poly.outer.length >= 3) {
              const holePath = new THREE.Path();
              holePath.moveTo(poly.outer[0].x, poly.outer[0].y);
              for (let i = poly.outer.length - 1; i >= 1; i--) {
                holePath.lineTo(poly.outer[i].x, poly.outer[i].y);
              }
              holePath.closePath();
              cutShape.holes.push(holePath);
            }
          }
        }
        const cutGeo = new THREE.ExtrudeGeometry(cutShape, {
          depth: baseZ,
          bevelEnabled: true,
          bevelThickness: bevelBase,
          bevelSize: bevelBase,
          bevelSegments: 2,
          curveSegments: 20,
        });
        baseGeometries.push(cutGeo);

        // If layered-background or LED glow enabled, add backing diffuser plate behind cut-out
        if (design.mountingStyle === 'layered-background' || design.ledGlowEnabled) {
          const backShape = createBasePlateShape(design, textBounds).shape;
          const backGeo = new THREE.ExtrudeGeometry(backShape, {
            depth: Math.max(1.8, baseZ * 0.5),
            bevelEnabled: false,
            curveSegments: 20,
          });
          backGeo.translate(0, 0, -Math.max(2.0, baseZ * 0.55));
          if (design.ledGlowEnabled) ledGeometries.push(backGeo);
          else secondaryGeometries.push(backGeo);
        }
      } else {
        // Standard Raised lettering base plate
        const plateGeo = new THREE.ExtrudeGeometry(baseShape, {
          depth: baseZ,
          bevelEnabled: true,
          bevelThickness: bevelBase,
          bevelSize: bevelBase,
          bevelSegments: 2,
          curveSegments: 24,
        });
        baseGeometries.push(plateGeo);

        if (design.mountingStyle === 'layered-background') {
          const backShape = createBasePlateShape(
            {
              ...design,
              widthMm: design.widthMm + 8,
              heightMm: design.heightMm + 8,
              cornerRadiusMm: design.cornerRadiusMm + 2,
            },
            textBounds,
          ).shape;
          const backGeo = new THREE.ExtrudeGeometry(backShape, {
            depth: Math.max(2.0, baseZ * 0.6),
            bevelEnabled: true,
            bevelThickness: 0.3,
            bevelSize: 0.3,
            bevelSegments: 1,
            curveSegments: 24,
          });
          backGeo.translate(0, 0, -Math.max(2.1, baseZ * 0.62));
          secondaryGeometries.push(backGeo);
        }
      }

      // LED edge rim channel if enabled
      if (design.ledGlowEnabled && design.letteringMode !== 'cut-out') {
        const rimShape = createBasePlateShape(
          {
            ...design,
            widthMm: design.widthMm + 3.5,
            heightMm: design.heightMm + 3.5,
            cornerRadiusMm: design.cornerRadiusMm + 1,
            mountingHolesEnabled: false,
            keyholeSlotEnabled: false,
          },
          textBounds,
        ).shape;
        const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
          depth: Math.max(1.8, baseZ * 0.55),
          bevelEnabled: false,
          curveSegments: 24,
        });
        rimGeo.translate(0, 0, -1.6);
        ledGeometries.push(rimGeo);
      }

      // Raised Border Frame
      const borderShape = createBorderFrameShape(design, textBounds);
      if (borderShape) {
        const bGeo = new THREE.ExtrudeGeometry(borderShape, {
          depth: Math.max(0.6, design.borderHeightMm),
          bevelEnabled: true,
          bevelThickness: 0.22,
          bevelSize: 0.18,
          bevelSegments: 1,
          curveSegments: 24,
        });
        bGeo.translate(0, 0, baseZ);
        borderGeometries.push(bGeo);
      }
    }

    // 3. Raised 3D Text Lines (or text-only-3d sculpture)
    if (design.letteringMode === 'raised' || design.mountingStyle === 'text-only-3d') {
      const zBase = design.mountingStyle === 'text-only-3d' ? 0 : baseZ;
      const textDepth = Math.max(0.6, design.textExtrusionMm);
      const bevelT = Math.min(0.35, textDepth * 0.15);

      for (const lineRes of textMeasurement.lines) {
        if (lineRes.shapes.length === 0) continue;
        const tGeo = new THREE.ExtrudeGeometry(lineRes.shapes, {
          depth: textDepth,
          bevelEnabled: true,
          bevelThickness: bevelT,
          bevelSize: bevelT * 0.75,
          bevelSegments: 2,
          curveSegments: 14,
        });
        tGeo.translate(0, 0, zBase);
        textMeshes.push({ geo: tGeo, color: lineRes.color, zOffset: zBase });
      }
    }

    // 4. Decorative 3D emblems
    const decos = buildDecorationGeometries(design.decoration, design);
    for (const d of decos) {
      d.translate(0, 0, baseZ);
      decorationGeometries.push(d);
    }

    // 5. Freestanding Desk Stand
    const standGeometries =
      design.mountingStyle === 'freestanding-desk' ? buildDeskStandGeometries(design) : [];

    return {
      baseGeometries,
      secondaryGeometries,
      recessedInlayGeometries,
      textMeshes,
      borderGeometries,
      decorationGeometries,
      ledGeometries,
      standGeometries,
      baseZ,
    };
  }, [design, textMeasurement]);

  // Dispose geometries when rebuilt or unmounted
  useEffect(() => {
    return () => {
      built.baseGeometries.forEach((g) => g.dispose());
      built.secondaryGeometries.forEach((g) => g.dispose());
      built.recessedInlayGeometries.forEach((r) => r.geo.dispose());
      built.textMeshes.forEach((t) => t.geo.dispose());
      built.borderGeometries.forEach((g) => g.dispose());
      built.decorationGeometries.forEach((g) => g.dispose());
      built.ledGeometries.forEach((g) => g.dispose());
      built.standGeometries.forEach((g) => g.dispose());
    };
  }, [built]);

  // PBR Materials
  const baseMatProps = useMemo(
    () => buildMaterialProps(design.materialFinish, design.baseColor),
    [design.materialFinish, design.baseColor],
  );
  const secondaryMatProps = useMemo(
    () =>
      buildMaterialProps(design.materialFinish, design.secondaryBaseColor, {
        isSecondary: true,
      }),
    [design.materialFinish, design.secondaryBaseColor],
  );
  const borderMatProps = useMemo(
    () => buildMaterialProps(design.materialFinish, design.borderColor),
    [design.materialFinish, design.borderColor],
  );
  const ledMatProps = useMemo(
    () =>
      buildMaterialProps('transparent', design.ledAccentColor, {
        emissiveHex: design.ledAccentColor,
        emissiveIntensity: design.ledGlowEnabled ? 1.45 : 0,
      }),
    [design.ledAccentColor, design.ledGlowEnabled],
  );

  // Positioning:
  // If freestanding-desk: stand sits on Y=0, plate is tilted backward by deskStandAngleDeg and raised so its bottom rests in the stand!
  // Otherwise: plate rests flat/upright facing camera, grounded at Y=0.
  const isDeskStand = design.mountingStyle === 'freestanding-desk';
  const tiltRad = isDeskStand
    ? -THREE.MathUtils.degToRad(Math.max(5, Math.min(45, design.deskStandAngleDeg)))
    : 0;
  const plateCenterY = isDeskStand
    ? (design.heightMm / 2) * Math.cos(tiltRad) + 3.2
    : design.heightMm / 2;

  const explodeGap = explodedPreview ? 12 : 0;

  return (
    <group ref={exportGroupRef as React.RefObject<THREE.Group>} name="NameplateRoot">
      {/* Main Tilted / Upright Plate Group */}
      <group position={[0, plateCenterY, 0]} rotation={[tiltRad, 0, 0]}>
        {/* Base Plate */}
        <group position={[0, 0, -explodeGap * 0.5]}>
          {built.baseGeometries.map((geo, idx) => (
            <mesh
              key={`base-${idx}`}
              geometry={geo}
              castShadow
              receiveShadow
              userData={{ partGroup: 'base' }}
            >
              <meshPhysicalMaterial {...baseMatProps} />
            </mesh>
          ))}
        </group>

        {/* Secondary Layered Backing Plate */}
        <group position={[0, 0, -explodeGap * 1.4]}>
          {built.secondaryGeometries.map((geo, idx) => (
            <mesh
              key={`sec-${idx}`}
              geometry={geo}
              castShadow
              receiveShadow
              userData={{ partGroup: 'backing' }}
            >
              <meshPhysicalMaterial {...secondaryMatProps} />
            </mesh>
          ))}
        </group>

        {/* LED Diffuser Channel */}
        {built.ledGeometries.map((geo, idx) => (
          <mesh
            key={`led-${idx}`}
            geometry={geo}
            userData={{ partGroup: 'led-diffuser' }}
          >
            <meshPhysicalMaterial {...ledMatProps} />
          </mesh>
        ))}

        {/* Engraved Pocket Highlight Inlay */}
        {built.recessedInlayGeometries.map((item, idx) => (
          <mesh
            key={`inlay-${idx}`}
            geometry={item.geo}
            userData={{ partGroup: 'inlay', excludeFromExport: true }}
          >
            <meshStandardMaterial color={item.color} roughness={0.65} />
          </mesh>
        ))}

        {/* Raised Border Frame */}
        <group position={[0, 0, explodeGap * 0.7]}>
          {built.borderGeometries.map((geo, idx) => (
            <mesh
              key={`border-${idx}`}
              geometry={geo}
              castShadow
              receiveShadow
              userData={{ partGroup: 'border' }}
            >
              <meshPhysicalMaterial {...borderMatProps} />
            </mesh>
          ))}
        </group>

        {/* Decorative Emblems */}
        <group position={[0, 0, explodeGap * 0.9]}>
          {built.decorationGeometries.map((geo, idx) => (
            <mesh
              key={`deco-${idx}`}
              geometry={geo}
              castShadow
              receiveShadow
              userData={{ partGroup: 'border' }}
            >
              <meshPhysicalMaterial {...borderMatProps} />
            </mesh>
          ))}
        </group>

        {/* 3D Extruded Text Lines */}
        <group position={[0, 0, explodeGap * 1.2]}>
          {built.textMeshes.map((item, idx) => {
            const textMat = buildMaterialProps(design.materialFinish, item.color);
            return (
              <mesh
                key={`text-${idx}`}
                geometry={item.geo}
                castShadow
                receiveShadow
                userData={{ partGroup: 'text' }}
              >
                <meshPhysicalMaterial {...textMat} />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* Freestanding Desk Stand */}
      {isDeskStand && (
        <group position={[0, 0, -explodeGap * 0.8]}>
          {built.standGeometries.map((geo, idx) => (
            <mesh
              key={`stand-${idx}`}
              geometry={geo}
              castShadow
              receiveShadow
              userData={{ partGroup: 'stand' }}
            >
              <meshPhysicalMaterial {...secondaryMatProps} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
