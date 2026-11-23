import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CameraPreset, StandDesign } from '../types/studio';
import { generateStandGeometry, type StandPartGeometries } from '../geometry/standGeometry';
import { createStandMaterial } from '../geometry/materials';

export interface QRStandViewerHandle {
  capturePreview: () => string | null;
  getParts: () => StandPartGeometries | null;
}

interface QRStandViewerProps {
  design: StandDesign;
  cameraPreset?: CameraPreset;
  wireframe?: boolean;
}

export const QRStandViewer = forwardRef<QRStandViewerHandle, QRStandViewerProps>(({
  design,
  cameraPreset = 'iso',
  wireframe = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesGroupRef = useRef<THREE.Group | null>(null);
  const partsRef = useRef<StandPartGeometries | null>(null);

  useImperativeHandle(ref, () => ({
    capturePreview: () => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      }
      return null;
    },
    getParts: () => partsRef.current,
  }), []);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F1F5F9');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
    camera.position.set(0, 80, 220);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 600;
    controls.minDistance = 20;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, 200, 150);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.6);
    dirLight2.position.set(-100, -80, -100);
    scene.add(dirLight2);

    const group = new THREE.Group();
    scene.add(group);
    meshesGroupRef.current = group;

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update geometry when design or wireframe changes
  useEffect(() => {
    const group = meshesGroupRef.current;
    if (!group) return;

    // Clean previous meshes
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else if (child.material) {
        child.material.dispose();
      }
    }

    const parts = generateStandGeometry(design);
    partsRef.current = parts;

    const matType = design.colors.materialType;

    const addMesh = (geo: THREE.BufferGeometry | null, color: string) => {
      if (!geo) return;
      const mat = createStandMaterial(color, matType, wireframe);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    };

    if (parts.base) addMesh(parts.base, design.colors.baseColor);
    if (parts.body) addMesh(parts.body, design.colors.standColor);
    if (parts.frame) addMesh(parts.frame, design.colors.frameColor);
    if (parts.qrModules) addMesh(parts.qrModules, design.colors.qrColor);
    if (parts.text) addMesh(parts.text, design.colors.textColor);
    if (parts.logo) addMesh(parts.logo, design.colors.accentColor);
    if (parts.decorations) addMesh(parts.decorations, design.colors.accentColor);

    // Re-center controls target
    if (controlsRef.current && parts.bounds) {
      controlsRef.current.target.copy(parts.bounds.center);
      controlsRef.current.update();
    }
  }, [design, wireframe]);

  // Handle camera presets
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const parts = partsRef.current;
    if (!camera || !controls || !parts) return;

    const center = parts.bounds.center;
    const span = Math.max(parts.bounds.size.x, parts.bounds.size.y, parts.bounds.size.z) * 1.8;

    switch (cameraPreset) {
      case 'front':
        camera.position.set(center.x, center.y, center.z + span);
        break;
      case 'back':
        camera.position.set(center.x, center.y, center.z - span);
        break;
      case 'side':
        camera.position.set(center.x + span, center.y, center.z);
        break;
      case 'top':
        camera.position.set(center.x, center.y + span, center.z);
        break;
      case 'iso':
      default:
        camera.position.set(center.x + span * 0.65, center.y + span * 0.7, center.z + span * 0.85);
        break;
    }
    controls.target.copy(center);
    controls.update();
  }, [cameraPreset]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs font-mono text-slate-300 pointer-events-none">
        Triangles: {partsRef.current?.triangleCount.toLocaleString() ?? '...'} | Mode: {design.printingMode.toUpperCase()}
      </div>
    </div>
  );
});

QRStandViewer.displayName = 'QRStandViewer';
