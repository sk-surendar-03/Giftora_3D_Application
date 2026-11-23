import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  LedLightingSettings,
  LampShapeType,
} from '../types/lithophane';
import {
  EyeOff,
  RotateCw,
  Camera,
  Layers,
  Boxes,
} from 'lucide-react';

interface LithophaneViewerProps {
  lithophaneGeometry: THREE.BufferGeometry | null;
  baseGeometry?: THREE.BufferGeometry | null;
  frameGeometry?: THREE.BufferGeometry | null;
  shape: LampShapeType;
  lighting: LedLightingSettings;
  explodedProgress: number; // 0 to 1
  onSnapshotReady?: (dataUrl: string) => void;
  processedCanvas?: HTMLCanvasElement;
}

export const LithophaneViewer: React.FC<LithophaneViewerProps> = ({
  lithophaneGeometry,
  baseGeometry,
  frameGeometry,
  shape,
  lighting,
  explodedProgress,
  onSnapshotReady,
  processedCanvas,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Mesh refs
  const lithophaneMeshRef = useRef<THREE.Mesh | null>(null);
  const baseMeshRef = useRef<THREE.Mesh | null>(null);
  const frameMeshRef = useRef<THREE.Mesh | null>(null);
  const internalLedLightRef = useRef<THREE.PointLight | null>(null);
  const ledGlowMeshRef = useRef<THREE.Mesh | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.PolarGridHelper | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const lithoBottomYRef = useRef<number>(-60);

  // Animation and state
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeViewPreset, setActiveViewPreset] = useState<'persp' | 'front' | 'side' | 'top' | 'inside'>('persp');
  const [wireframe, setWireframe] = useState(false);
  const [housingDisplay, setHousingDisplay] = useState<'solid' | 'ghost' | 'hidden'>('solid');
  const animationFrameId = useRef<number>(0);
  const rgbHueRef = useRef<number>(0);

  // Compute color based on lighting settings
  const getSimulatedLedColor = useCallback(() => {
    if (lighting.rgbCycle) {
      const col = new THREE.Color();
      col.setHSL((rgbHueRef.current % 360) / 360, 0.9, 0.6);
      return col;
    }
    switch (lighting.colorPreset) {
      case 'warm':
        return new THREE.Color('#ffdfa0'); // 2700K Warm White
      case 'cool':
        return new THREE.Color('#e0f0ff'); // 6500K Cool White
      case 'neutral':
        return new THREE.Color('#fff6e6'); // 4000K Neutral White
      case 'amber':
        return new THREE.Color('#ff9c38'); // Amber Golden
      case 'sunset':
        return new THREE.Color('#ff5e3a'); // Sunset Coral
      case 'custom':
        return new THREE.Color(lighting.customColor || '#ffbb66');
      default:
        return new THREE.Color('#ffdfa0');
    }
  }, [lighting]);

  // Setup Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Detect software GL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c0a10');
    sceneRef.current = scene;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 1, 2000);
    camera.position.set(0, 6, 345);
    cameraRef.current = camera;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, -12, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 600;
    controls.minDistance = 25;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.update();
    controlsRef.current = controls;

    // 5. Procedural Studio Environment
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Fallback gracefully
    }

    // 6. External Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x111122, 0.5);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(100, 180, 120);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);
    dirLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(0x8fa4c4, 0.35);
    fillLight.position.set(-100, 80, -90);
    scene.add(fillLight);

    // 7. Internal Simulated LED Light inside the lamp
    const ledLight = new THREE.PointLight(0xffdfa0, 0.9, 260, 1.4);
    ledLight.position.set(0, 12, 0);
    scene.add(ledLight);
    internalLedLightRef.current = ledLight;

    // Visual glowing 5V LED disc puck resting on top of the lamp base
    const ledGlowGeo = new THREE.CylinderGeometry(16, 16, 3, 24);
    const ledGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffdfa0,
      transparent: true,
      opacity: 0.92,
    });
    const ledGlowMesh = new THREE.Mesh(ledGlowGeo, ledGlowMat);
    ledGlowMesh.position.set(0, -58, 0);
    scene.add(ledGlowMesh);
    ledGlowMeshRef.current = ledGlowMesh;

    // 8. Ground Contact Shadow & Base Floor Plane (positioned dynamically beneath base)
    const shadowGeo = new THREE.PlaneGeometry(380, 380);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050308,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -85;
    scene.add(shadowPlane);
    shadowPlaneRef.current = shadowPlane;

    // Subtle radial grid floor seated at the bottom of the lamp base
    const gridHelper = new THREE.PolarGridHelper(160, 8, 8, 48, 0x332244, 0x1f142b);
    gridHelper.position.y = -84.6;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 9. Resize observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      if (sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId.current);
      clearTimeout(animationFrameId.current);
      renderer.dispose();
    };
  }, []);

  // Animation Loop for OrbitControls & Optional Auto-Rotate / RGB cycle
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!renderer || !scene || !camera || !controls) return;

    const renderScene = () => {
      renderer.render(scene, camera);
    };

    controls.addEventListener('change', renderScene);
    renderScene();

    let lastTime = performance.now();
    let isDisposed = false;

    const tick = (currentTime: number) => {
      if (isDisposed) return;
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const needsContinuousRender = autoRotate || (lighting.rgbCycle && lighting.isOn);

      if (needsContinuousRender) {
        if (lighting.rgbCycle && lighting.isOn) {
          rgbHueRef.current = (rgbHueRef.current + delta * 50) % 360;
          const col = new THREE.Color();
          col.setHSL(rgbHueRef.current / 360, 0.95, 0.6);
          if (internalLedLightRef.current) internalLedLightRef.current.color.copy(col);
          if (ledGlowMeshRef.current) {
            (ledGlowMeshRef.current.material as THREE.MeshBasicMaterial).color.copy(col);
          }
        }

        controls.update();
        renderScene();

        animationFrameId.current = window.setTimeout(() => {
          if (!isDisposed) requestAnimationFrame(tick);
        }, 60);
      } else {
        animationFrameId.current = window.setTimeout(() => {
          if (!isDisposed) requestAnimationFrame(tick);
        }, 120);
      }
    };

    animationFrameId.current = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      controls.removeEventListener('change', renderScene);
      cancelAnimationFrame(animationFrameId.current);
      clearTimeout(animationFrameId.current);
    };
  }, [autoRotate, lighting.rgbCycle, lighting.isOn]);

  // Update Backdrop & Ambient Environment
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const ambientRatio = 1.0 - (lighting.ambientDarkness / 100) * 0.75;

    switch (lighting.backdrop) {
      case 'nightstand':
        scene.background = new THREE.Color('#08060d');
        break;
      case 'modern_studio':
        scene.background = new THREE.Color('#100e18');
        break;
      case 'wood_desk':
        scene.background = new THREE.Color('#140b07');
        break;
      case 'maker_bench':
        scene.background = new THREE.Color('#0a1118');
        break;
      default:
        scene.background = new THREE.Color('#0c0a10');
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = 0.35 * ambientRatio;
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = 0.45 * ambientRatio;
    }
    if (dirLightRef.current) {
      dirLightRef.current.intensity = 0.9 * ambientRatio;
    }

    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(scene, cameraRef.current);
    }
  }, [lighting.backdrop, lighting.ambientDarkness]);

  // Update Internal LED Light
  useEffect(() => {
    if (!internalLedLightRef.current || !ledGlowMeshRef.current) return;
    const led = internalLedLightRef.current;
    const glow = ledGlowMeshRef.current;

    if (!lighting.isOn) {
      led.intensity = 0;
      glow.visible = false;
    } else {
      glow.visible = housingDisplay !== 'hidden';
      const targetColor = getSimulatedLedColor();
      led.color.copy(targetColor);
      (glow.material as THREE.MeshBasicMaterial).color.copy(targetColor);

      const factor = lighting.brightness / 100;
      led.intensity = 0.85 * factor + (lighting.ambientDarkness > 50 ? 0.25 : 0);
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [lighting, housingDisplay, getSimulatedLedColor]);

  // Update OrbitControls Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.8;
    }
  }, [autoRotate]);

  // Update Lithophane, Base & Frame Meshes + Ground Floor Alignment
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old meshes
    if (lithophaneMeshRef.current) {
      scene.remove(lithophaneMeshRef.current);
      lithophaneMeshRef.current.geometry.dispose();
      lithophaneMeshRef.current = null;
    }
    if (baseMeshRef.current) {
      scene.remove(baseMeshRef.current);
      baseMeshRef.current.geometry.dispose();
      baseMeshRef.current = null;
    }
    if (frameMeshRef.current) {
      scene.remove(frameMeshRef.current);
      frameMeshRef.current.geometry.dispose();
      frameMeshRef.current = null;
    }

    if (!lithophaneGeometry) return;

    const ledColor = getSimulatedLedColor();
    const isLit = lighting.isOn;
    const litIntensity = isLit ? lighting.brightness / 100 : 0;

    let emissiveMap: THREE.CanvasTexture | undefined;
    if (processedCanvas && isLit) {
      emissiveMap = new THREE.CanvasTexture(processedCanvas);
      emissiveMap.colorSpace = THREE.SRGBColorSpace;
      emissiveMap.wrapS = THREE.RepeatWrapping;
      emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
    }

    const lithoMaterial = new THREE.MeshPhysicalMaterial({
      color: isLit ? 0x3b342c : 0xefe9df,
      emissive: isLit ? ledColor : 0x000000,
      emissiveIntensity: isLit ? 1.15 * litIntensity : 0,
      emissiveMap: emissiveMap,
      roughness: 0.42,
      metalness: 0.02,
      clearcoat: 0.12,
      clearcoatRoughness: 0.45,
      side: THREE.DoubleSide,
      wireframe: wireframe,
    });

    const lithoCol = lithophaneGeometry.clone();
    lithoCol.computeBoundingBox();
    const lithoBottomY = lithoCol.boundingBox ? lithoCol.boundingBox.min.y : -60;
    lithoBottomYRef.current = lithoBottomY;

    const lithoMesh = new THREE.Mesh(lithoCol, lithoMaterial);
    lithoMesh.castShadow = true;
    lithoMesh.receiveShadow = true;
    scene.add(lithoMesh);
    lithophaneMeshRef.current = lithoMesh;

    let floorY = lithoBottomY;

    // Base Mesh (Positioned cleanly below lithoBottomY)
    if (baseGeometry && housingDisplay !== 'hidden') {
      const baseCol = baseGeometry.clone();
      baseCol.computeBoundingBox();
      if (baseCol.boundingBox) {
        floorY = Math.min(floorY, baseCol.boundingBox.min.y);
      }

      const isGhost = housingDisplay === 'ghost';
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x18141c,
        roughness: 0.5,
        metalness: 0.18,
        wireframe: wireframe,
        transparent: isGhost,
        opacity: isGhost ? 0.35 : 1.0,
        depthWrite: !isGhost,
      });
      const baseMesh = new THREE.Mesh(baseCol, baseMaterial);
      baseMesh.castShadow = !isGhost;
      baseMesh.receiveShadow = true;
      scene.add(baseMesh);
      baseMeshRef.current = baseMesh;
    }

    // Frame / Top Cap Mesh
    if (frameGeometry && housingDisplay !== 'hidden') {
      const frameCol = frameGeometry.clone();
      const isGhost = housingDisplay === 'ghost';
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x1f1b24,
        roughness: 0.45,
        metalness: 0.25,
        wireframe: wireframe,
        transparent: isGhost,
        opacity: isGhost ? 0.35 : 1.0,
        depthWrite: !isGhost,
      });
      const frameMesh = new THREE.Mesh(frameCol, frameMaterial);
      frameMesh.castShadow = !isGhost;
      frameMesh.receiveShadow = true;
      scene.add(frameMesh);
      frameMeshRef.current = frameMesh;
    }

    // Update LED puck and ground plane to match exact assembly bounds
    const explodeOffset = explodedProgress * 38;
    if (ledGlowMeshRef.current) {
      ledGlowMeshRef.current.position.y = lithoBottomY + 2 - explodeOffset * 0.45;
      ledGlowMeshRef.current.visible = lighting.isOn && housingDisplay !== 'hidden';
    }
    if (shadowPlaneRef.current) {
      shadowPlaneRef.current.position.y = floorY - explodeOffset - 0.6;
    }
    if (gridHelperRef.current) {
      gridHelperRef.current.position.y = floorY - explodeOffset - 0.3;
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [
    lithophaneGeometry,
    baseGeometry,
    frameGeometry,
    lighting,
    wireframe,
    housingDisplay,
    processedCanvas,
    explodedProgress,
    getSimulatedLedColor,
  ]);

  // Handle Exploded View separation along Y axis
  useEffect(() => {
    const explodeY = explodedProgress * 38; // mm offset
    const lithoBottomY = lithoBottomYRef.current;

    if (baseMeshRef.current) {
      baseMeshRef.current.position.y = -explodeY;
    }
    if (frameMeshRef.current) {
      frameMeshRef.current.position.y = explodeY;
    }
    if (ledGlowMeshRef.current) {
      ledGlowMeshRef.current.position.y = lithoBottomY + 2 - explodeY * 0.45;
    }

    // Keep floor beneath exploded base
    const baseHeightApprox = baseGeometry ? 27 : 0;
    const floorY = lithoBottomY - (housingDisplay !== 'hidden' ? baseHeightApprox : 0) - explodeY;
    if (shadowPlaneRef.current) {
      shadowPlaneRef.current.position.y = floorY - 0.6;
    }
    if (gridHelperRef.current) {
      gridHelperRef.current.position.y = floorY - 0.3;
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [explodedProgress, baseGeometry, housingDisplay]);

  // Camera Presets
  const applyViewPreset = (preset: 'persp' | 'front' | 'side' | 'top' | 'inside') => {
    if (!cameraRef.current || !controlsRef.current) return;
    setActiveViewPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    controls.target.set(0, -10, 0);

    switch (preset) {
      case 'front':
        camera.position.set(0, -10, 310);
        break;
      case 'side':
        camera.position.set(310, -10, 0);
        break;
      case 'top':
        camera.position.set(0, 310, 0.1);
        break;
      case 'inside':
        camera.position.set(0, 10, 28);
        break;
      case 'persp':
      default:
        camera.position.set(0, 10, 315);
        break;
    }
    camera.lookAt(controls.target);
    controls.update();
    if (rendererRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, camera);
    }
  };

  // Cycle housing visibility: solid -> ghost (translucent) -> hidden (lithophane only)
  const handleCycleHousing = () => {
    setHousingDisplay((prev) => {
      if (prev === 'solid') return 'ghost';
      if (prev === 'ghost') return 'hidden';
      return 'solid';
    });
  };

  // High-Res Snapshot Capture
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    if (onSnapshotReady) {
      onSnapshotReady(dataUrl);
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col bg-stone-950 overflow-hidden select-none">
      {/* WebGL Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 min-h-0 relative overflow-hidden cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-stone-900/85 border border-stone-700/60 rounded-xl px-2.5 py-1.5 shadow-xl">
          <span className="text-[11px] font-mono font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            3D Studio View
          </span>
          <span className="text-stone-600">|</span>
          <span className="text-[11px] text-stone-300 font-medium capitalize">
            {shape.replace('_', ' ')} Lamp
          </span>
        </div>

        {/* Action icons right */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Base & Housing Visibility Toggle */}
          <button
            onClick={handleCycleHousing}
            title="Cycle Base & Cap Display (Solid / X-Ray / Lithophane Only)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              housingDisplay !== 'solid'
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-stone-900/85 hover:bg-stone-800 text-stone-300 border border-stone-700/60'
            }`}
          >
            {housingDisplay === 'hidden' ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Boxes className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {housingDisplay === 'solid'
                ? 'Base: Solid'
                : housingDisplay === 'ghost'
                ? 'Base: X-Ray'
                : 'Litho Only'}
            </span>
          </button>

          {/* Wireframe toggle */}
          <button
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Inspection"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              wireframe
                ? 'bg-amber-500 text-stone-950 font-semibold'
                : 'bg-stone-900/85 hover:bg-stone-800 text-stone-300 border border-stone-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wireframe</span>
          </button>

          {/* Auto Rotate toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Auto-Rotate Camera"
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              autoRotate
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-900/85 hover:bg-stone-800 text-stone-300 border border-stone-700/60'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          {/* Screenshot Capture */}
          <button
            onClick={handleCaptureSnapshot}
            title="Capture High-Res Photo Snapshot"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700/60 flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Camera View Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <div className="pointer-events-auto flex items-center gap-1 bg-stone-900/90 border border-stone-800 rounded-xl p-1 shadow-2xl">
          <button
            onClick={() => applyViewPreset('persp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeViewPreset === 'persp'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            3D Orbit
          </button>
          <button
            onClick={() => applyViewPreset('front')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeViewPreset === 'front'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => applyViewPreset('side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeViewPreset === 'side'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            Side
          </button>
          <button
            onClick={() => applyViewPreset('top')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeViewPreset === 'top'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => applyViewPreset('inside')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeViewPreset === 'inside'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            Inside LED
          </button>
        </div>
      </div>
    </div>
  );
};
