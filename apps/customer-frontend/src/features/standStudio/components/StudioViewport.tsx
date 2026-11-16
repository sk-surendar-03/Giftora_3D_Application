import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { DesignConfig, ViewportOptions } from '../types/design';
import type { GeneratedAssembly } from '../geometry/standBuilder';
import { createPartMaterial } from '../three/materials';

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

export const StudioViewport = React.forwardRef<StudioViewportHandle, StudioViewportProps>(
  ({ config, assembly, viewport, bedLimit, darkMode, frameTrigger }, ref) => {
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    useImperativeHandle(ref, () => ({
      capturePngDataUrl: () => {
        if (!glRef.current) return null;
        return glRef.current.domElement.toDataURL('image/png');
      },
    }));

    return (
      <div className="w-full h-full relative" style={{ background: darkMode ? '#0a0a0a' : '#f3f6fb' }}>
        <Canvas
          shadows
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          camera={{ position: [150, 150, 200], fov: 40, near: 1, far: 2000 }}
          onCreated={({ gl }) => { glRef.current = gl; }}
        >
          <color attach="background" args={[darkMode ? '#0a0a0a' : '#f3f6fb']} />
          <ambientLight intensity={darkMode ? 0.4 : 0.7} />
          <directionalLight position={[100, 200, 100]} intensity={1.5} castShadow />
          <directionalLight position={[-100, 100, -100]} intensity={0.3} />

          <CameraController viewport={viewport} frameTrigger={frameTrigger} />
          <Controls viewport={viewport} />
          
          <SceneContent config={config} assembly={assembly} viewport={viewport} bedLimit={bedLimit} darkMode={darkMode} />
        </Canvas>
      </div>
    );
  }
);

function CameraController({ viewport, frameTrigger }: { viewport: ViewportOptions, frameTrigger: number }) {
  const { camera } = useThree();
  useEffect(() => {
    if (viewport.cameraPreset === 'iso') camera.position.set(150, 150, 200);
    else if (viewport.cameraPreset === 'front') camera.position.set(0, 80, 250);
    else if (viewport.cameraPreset === 'side') camera.position.set(250, 80, 0);
    else if (viewport.cameraPreset === 'top') camera.position.set(0, 300, 0);
    camera.lookAt(0, 40, 0);
  }, [viewport.cameraPreset, frameTrigger, camera]);
  return null;
}

function Controls({ viewport }: { viewport: ViewportOptions }) {
  return (
    <OrbitControls
      makeDefault
      enablePan={true}
      minDistance={50}
      maxDistance={600}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2 + 0.1}
      target={[0, 40, 0]}
    />
  );
}

function SceneContent({ config, assembly, viewport, bedLimit, darkMode }: { config: DesignConfig, assembly: GeneratedAssembly, viewport: ViewportOptions, bedLimit: { x: number, y: number, z: number }, darkMode: boolean }) {
  const gridColor = darkMode ? '#333' : '#cbd5e1';
  
  return (
    <group>
      {/* Grid */}
      {viewport.showGrid && (
        <gridHelper args={[400, 40, gridColor, gridColor]} position={[0, -0.1, 0]} />
      )}
      
      {/* Build Plate */}
      {viewport.showBuildPlate && (
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[bedLimit.x, bedLimit.y]} />
          <meshStandardMaterial color={darkMode ? '#1a1a1a' : '#e2e8f0'} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Assembly Parts */}
      {assembly.parts.map((part, i) => {
        // Explode offset
        const ex = viewport.explodedAmount * (part.explodeVector[0] * 3);
        const ey = viewport.explodedAmount * (part.explodeVector[1] * 3);
        const ez = viewport.explodedAmount * (part.explodeVector[2] * 3);
        const color = config.appearance.colors[part.zone] || config.appearance.colors.base;
        
        return (
          <mesh key={part.id} geometry={part.geometry} position={[ex, ey, ez]} castShadow receiveShadow>
            <primitive object={createPartMaterial(color, config.appearance.finish)} attach="material" />
          </mesh>
        );
      })}

      {/* Phone Mockup */}
      {viewport.showPhoneMockup && assembly.phonePose.enabled && (
        <group position={assembly.phonePose.position} rotation={[assembly.phonePose.rotationX, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[assembly.phonePose.width, assembly.phonePose.height, assembly.phonePose.thickness]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0, assembly.phonePose.thickness / 2 + 0.1]}>
            <planeGeometry args={[assembly.phonePose.width - 4, assembly.phonePose.height - 4]} />
            <meshStandardMaterial color="#333" emissive="#2563eb" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}

      {/* Pens Mockup */}
      {viewport.showPensMockup && assembly.penSlots.map((slot, i) => (
        <group key={i} position={slot.position} rotation={slot.rotation}>
          <mesh castShadow>
            <cylinderGeometry args={[3, 3, 100, 16]} />
            <meshStandardMaterial color={slot.color} roughness={0.4} />
          </mesh>
          <mesh position={[0, 50, 0]}>
            <coneGeometry args={[3, 10, 16]} />
            <meshStandardMaterial color="#ddd" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Dimensions Overlay (Simplified Bounding Box) */}
      {viewport.showDimensions && (
        <boxHelper args={[new THREE.Mesh(new THREE.BoxGeometry(assembly.dimensions.width, assembly.dimensions.height, assembly.dimensions.depth)), '#D9AE4E']} position={[0, assembly.dimensions.height / 2, 0]} />
      )}
    </group>
  );
}