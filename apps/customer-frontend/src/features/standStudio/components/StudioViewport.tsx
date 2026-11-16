import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Html,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type {
  DesignConfig,
  ViewportOptions,
} from '../types/design';
import type { GeneratedAssembly } from '../geometry/standBuilder';
import { createPartMaterial, detectSoftwareWebGL } from '../three/materials';

export interface StudioViewportHandle {
  capturePngDataUrl: () => string | null;
}

interface StudioViewportProps {
  config: DesignConfig;
  assembly: GeneratedAssembly;
  viewport: ViewportOptions;
  bedLimit: { x: number; y: number; z: number };
  darkMode: boolean;
  frameTrigger: number;
}

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

function StudioEnvironmentAndCapture({
  captureRef,
}: {
  captureRef: React.MutableRefObject<(() => string | null) | null>;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();
    return () => {
      envTex.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    captureRef.current = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/png');
    };
    return () => {
      captureRef.current = null;
    };
  }, [gl, scene, camera, captureRef]);

  return null;
}

function CameraRig({
  preset,
  projection,
  dimensions,
  frameTrigger,
  controlsRef,
}: {
  preset: ViewportOptions['cameraPreset'];
  projection: ViewportOptions['projection'];
  dimensions: { width: number; depth: number; height: number };
  frameTrigger: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, invalidate } = useThree();
  const animatingRef = useRef(false);

  useEffect(() => {
    const maxDim = Math.max(dimensions.width, dimensions.depth, dimensions.height, 80);
    const dist = projection === 'orthographic' ? maxDim * 2.2 : maxDim * 1.95;
    const cy = Math.max(25, dimensions.height * 0.45);

    _targetLook.set(0, cy, 0);
    if (preset === 'front') {
      _targetPos.set(0, cy + 12, dist);
    } else if (preset === 'side') {
      _targetPos.set(dist, cy + 12, 0);
    } else if (preset === 'top') {
      _targetPos.set(0, dist * 1.15, 0.01);
    } else {
      _targetPos.set(dist * 0.68, cy + dist * 0.52, dist * 0.78);
    }

    if (projection === 'orthographic' && 'zoom' in camera) {
      (camera as THREE.OrthographicCamera).zoom = Math.min(5, Math.max(1.8, 340 / maxDim));
      (camera as THREE.OrthographicCamera).updateProjectionMatrix();
    }

    animatingRef.current = true;
    invalidate();
  }, [preset, projection, frameTrigger, dimensions.width, dimensions.depth, dimensions.height, camera, invalidate]);

  useFrame((_, delta) => {
    if (!animatingRef.current || !controlsRef.current) return;
    const step = 1 - Math.exp(-10 * Math.min(delta, 0.05));
    camera.position.lerp(_targetPos, step);
    controlsRef.current.target.lerp(_targetLook, step);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(_targetPos) < 0.4 &&
      controlsRef.current.target.distanceTo(_targetLook) < 0.4
    ) {
      camera.position.copy(_targetPos);
      controlsRef.current.target.copy(_targetLook);
      controlsRef.current.update();
      animatingRef.current = false;
    } else {
      invalidate();
    }
  });

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const stopAnim = () => {
      animatingRef.current = false;
    };
    controls.addEventListener('start', stopAnim);
    return () => controls.removeEventListener('start', stopAnim);
  }, [controlsRef]);

  return null;
}

function StandModelMeshes({
  config,
  assembly,
  explodedAmount,
  castShadows,
}: {
  config: DesignConfig;
  assembly: GeneratedAssembly;
  explodedAmount: number;
  castShadows: boolean;
}) {
  const { gl, invalidate } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  const materials = useMemo(() => {
    const { finish, colors } = config.appearance;
    return {
      base: createPartMaterial(finish, colors.base, colors.accent, maxAnisotropy),
      back: createPartMaterial(finish, colors.back, colors.accent, maxAnisotropy),
      cup: createPartMaterial(finish, colors.cup, colors.accent, maxAnisotropy),
      text: createPartMaterial(
        finish === 'wood-grain' || finish === 'marble' ? 'satin' : finish,
        colors.text,
        colors.accent,
        maxAnisotropy
      ),
      accent: createPartMaterial(finish, colors.accent, colors.base, maxAnisotropy),
    };
  }, [config.appearance, maxAnisotropy]);

  useEffect(() => {
    invalidate();
    return () => {
      Object.values(materials).forEach((m) => m.dispose());
    };
  }, [materials, invalidate]);

  useEffect(() => {
    invalidate();
  }, [assembly, explodedAmount, invalidate]);

  return (
    <group>
      {assembly.parts.map((part) => (
        <mesh
          key={part.id}
          geometry={part.geometry}
          material={materials[part.zone]}
          castShadow={castShadows}
          receiveShadow={castShadows}
          position={[
            part.explodeVector[0] * explodedAmount,
            part.explodeVector[1] * explodedAmount,
            part.explodeVector[2] * explodedAmount,
          ]}
        />
      ))}
    </group>
  );
}

function PhoneMockupMesh({
  pose,
}: {
  pose: GeneratedAssembly['phonePose'];
}) {
  if (!pose.enabled) return null;
  const { position, rotationX, width, height, thickness } = pose;

  return (
    <group position={position} rotation={[rotationX, 0, 0]}>
      {/* Anodized phone chassis */}
      <mesh>
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial color="#1f2937" metalness={0.65} roughness={0.3} transparent opacity={0.82} />
      </mesh>
      {/* Glass display screen */}
      <mesh position={[0, 0, thickness / 2 + 0.15]}>
        <planeGeometry args={[width - 5, height - 6]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.08} transparent opacity={0.86} />
      </mesh>
      {/* Subtle UI screen bar indicator */}
      <mesh position={[0, height * 0.32, thickness / 2 + 0.25]}>
        <planeGeometry args={[width * 0.55, 4]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>
      {/* Camera bump on back */}
      <mesh position={[-width * 0.24, height * 0.34, -thickness / 2 - 1.1]}>
        <boxGeometry args={[18, 22, 2.2]} />
        <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function PensMockupMeshes({
  slots,
}: {
  slots: GeneratedAssembly['penSlots'];
}) {
  if (slots.length === 0) return null;

  return (
    <group>
      {slots.map((slot, idx) => (
        <group key={idx} position={slot.position} rotation={slot.rotation}>
          {/* Pen barrel (135mm tall) */}
          <mesh position={[0, 68, 0]}>
            <cylinderGeometry args={[4.4, 4.4, 130, 14]} />
            <meshStandardMaterial color={slot.color} roughness={0.35} metalness={0.25} />
          </mesh>
          {/* Metallic tip */}
          <mesh position={[0, 1.5, 0]}>
            <coneGeometry args={[4.4, 10, 14]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Top cap / eraser */}
          <mesh position={[0, 135, 0]}>
            <cylinderGeometry args={[4.5, 4.5, 6, 14]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DimensionOverlays({
  dimensions,
  visible,
}: {
  dimensions: { width: number; depth: number; height: number };
  visible: boolean;
}) {
  if (!visible) return null;
  const hw = dimensions.width / 2;
  const hd = dimensions.depth / 2;
  const h = dimensions.height;

  return (
    <group>
      {/* Width label along front */}
      <Html position={[0, 2, hd + 10]} center distanceFactor={235}>
        <div className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-slate-900/90 text-white rounded border border-slate-700 whitespace-nowrap shadow-sm pointer-events-none">
          W: {dimensions.width.toFixed(1)} mm
        </div>
      </Html>
      {/* Depth label along right */}
      <Html position={[hw + 11, 2, 0]} center distanceFactor={235}>
        <div className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-slate-900/90 text-white rounded border border-slate-700 whitespace-nowrap shadow-sm pointer-events-none">
          D: {dimensions.depth.toFixed(1)} mm
        </div>
      </Html>
      {/* Height label along left */}
      <Html position={[-hw - 11, h / 2, 0]} center distanceFactor={235}>
        <div className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-blue-600/95 text-white rounded border border-blue-400 whitespace-nowrap shadow-sm pointer-events-none">
          H: {dimensions.height.toFixed(1)} mm
        </div>
      </Html>
    </group>
  );
}

function BuildPlateFloor({
  bedLimit,
  showGrid,
  showBuildPlate,
  darkMode,
}: {
  bedLimit: { x: number; y: number; z: number };
  showGrid: boolean;
  showBuildPlate: boolean;
  darkMode: boolean;
}) {
  const plateGeom = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(bedLimit.x, 1, bedLimit.y)),
    [bedLimit.x, bedLimit.y]
  );

  useEffect(() => () => plateGeom.dispose(), [plateGeom]);

  return (
    <group>
      {showBuildPlate && (
        <group position={[0, -0.6, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[bedLimit.x, 1, bedLimit.y]} />
            <meshStandardMaterial
              color={darkMode ? '#161b22' : '#e5e9f0'}
              roughness={0.85}
              metalness={0.05}
            />
          </mesh>
          <lineSegments geometry={plateGeom}>
            <lineBasicMaterial color={darkMode ? '#3b82f6' : '#2563eb'} transparent opacity={0.45} />
          </lineSegments>
        </group>
      )}
      {showGrid && (
        <gridHelper
          args={[
            Math.max(bedLimit.x, bedLimit.y, 260),
            Math.round(Math.max(bedLimit.x, bedLimit.y, 260) / 10),
            darkMode ? '#334155' : '#94a3b8',
            darkMode ? '#1e293b' : '#cbd5e1',
          ]}
          position={[0, 0.02, 0]}
        />
      )}
    </group>
  );
}

export const StudioViewport = React.forwardRef<StudioViewportHandle, StudioViewportProps>(
  function StudioViewport({ config, assembly, viewport, bedLimit, darkMode, frameTrigger }, ref) {
    const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const captureRef = useRef<(() => string | null) | null>(null);

    useImperativeHandle(ref, () => ({
      capturePngDataUrl: () => {
        if (!captureRef.current) return null;
        return captureRef.current();
      },
    }));

    const bgColor = darkMode ? '#0d1117' : '#eef1f6';

    return (
      <div
        data-testid="studio-3d-viewport"
        className="relative w-full h-full min-h-[360px] select-none overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        <Canvas
          frameloop="demand"
          dpr={isSoftwareGl ? 1 : [1, 2]}
          shadows={!isSoftwareGl}
          gl={{
            antialias: !isSoftwareGl,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
          }}
        >
          <color attach="background" args={[bgColor]} />
          <fog attach="fog" args={[bgColor, 380, 920]} />

          <PerspectiveCamera
            makeDefault={viewport.projection === 'perspective'}
            position={[150, 125, 175]}
            fov={38}
            near={1}
            far={2000}
          />
          <OrthographicCamera
            makeDefault={viewport.projection === 'orthographic'}
            position={[150, 125, 175]}
            zoom={2.8}
            near={-500}
            far={2000}
          />

          <StudioEnvironmentAndCapture captureRef={captureRef} />

          {/* Warm/cool 3-point studio lighting rig */}
          <hemisphereLight args={['#dbeafe', '#475569', 0.65]} />
          <directionalLight
            position={[130, 210, 140]}
            intensity={1.35}
            color="#fff7ed"
            castShadow={!isSoftwareGl}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-140}
            shadow-camera-right={140}
            shadow-camera-top={140}
            shadow-camera-bottom={-140}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
          />
          <directionalLight position={[-120, 80, -130]} intensity={0.45} color="#bfdbfe" />

          <StandModelMeshes
            config={config}
            assembly={assembly}
            explodedAmount={viewport.explodedAmount}
            castShadows={!isSoftwareGl}
          />

          {viewport.showPhoneMockup && <PhoneMockupMesh pose={assembly.phonePose} />}
          {viewport.showPensMockup && <PensMockupMeshes slots={assembly.penSlots} />}

          <DimensionOverlays
            dimensions={assembly.dimensions}
            visible={viewport.showDimensions}
          />

          <BuildPlateFloor
            bedLimit={bedLimit}
            showGrid={viewport.showGrid}
            showBuildPlate={viewport.showBuildPlate}
            darkMode={darkMode}
          />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping={!isSoftwareGl}
            dampingFactor={0.08}
            minDistance={60}
            maxDistance={520}
            maxPolarAngle={Math.PI / 2 - 0.02}
          />

          <CameraRig
            preset={viewport.cameraPreset}
            projection={viewport.projection}
            dimensions={assembly.dimensions}
            frameTrigger={frameTrigger}
            controlsRef={controlsRef}
          />
        </Canvas>
      </div>
    );
  }
);
