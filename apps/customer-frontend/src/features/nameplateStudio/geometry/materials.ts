import * as THREE from 'three';
import { MATERIAL_PRESETS } from '../core/presets';
import { MaterialFinish } from '../core/types';

let cachedSoftwareGl: boolean | null = null;

/**
 * Detects software WebGL renderers (SwiftShader, llvmpipe, WARP) from the GPU renderer string
 * to pace rendering cost without changing scene content, layout, or logic.
 */
export function detectSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    cachedSoftwareGl = false;
  }
  return cachedSoftwareGl;
}

const textureCache = new Map<string, THREE.CanvasTexture>();

function createProceduralBumpTexture(kind: 'wood' | 'marble' | 'silk' | 'matte'): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cached = textureCache.get(kind);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 128;
      if (kind === 'wood') {
        const grain = Math.sin(y * 0.25 + Math.sin(x * 0.04) * 3.2) * 32;
        const fine = Math.sin(y * 1.4 + x * 0.08) * 14;
        v = 128 + grain + fine;
      } else if (kind === 'marble') {
        const vein = Math.sin((x + y * 0.7) * 0.05 + Math.sin(x * 0.03) * 4.0);
        const speckle = ((x * 73856093) ^ (y * 19349663)) & 31;
        v = vein > 0.78 ? 60 : 195 + (speckle - 16);
      } else if (kind === 'silk') {
        // Subtle 3D-printed layer/silk sheen lines
        v = 128 + Math.sin(y * 2.2) * 18;
      } else {
        // Matte micro-grain
        const n = (((x * 374761393 + y * 668265263) ^ 0x5bf03635) & 63) - 32;
        v = 128 + n * 0.6;
      }
      const clamped = Math.max(0, Math.min(255, Math.round(v)));
      const idx = (y * size + x) * 4;
      data[idx] = clamped;
      data[idx + 1] = clamped;
      data[idx + 2] = clamped;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.025, 0.025);
  tex.needsUpdate = true;
  textureCache.set(kind, tex);
  return tex;
}

export function buildMaterialProps(
  finish: MaterialFinish,
  colorHex: string,
  options?: {
    isSecondary?: boolean;
    emissiveHex?: string;
    emissiveIntensity?: number;
    gradientPreview?: boolean;
  },
): THREE.MeshPhysicalMaterialParameters {
  const spec = MATERIAL_PRESETS.find((m) => m.id === finish) ?? MATERIAL_PRESETS[0];

  let bumpMap: THREE.CanvasTexture | null = null;
  let bumpScale = 0;

  if (finish === 'wood-pla') {
    bumpMap = createProceduralBumpTexture('wood');
    bumpScale = 0.25;
  } else if (finish === 'marble-pla') {
    bumpMap = createProceduralBumpTexture('marble');
    bumpScale = 0.12;
  } else if (finish === 'silk-pla') {
    bumpMap = createProceduralBumpTexture('silk');
    bumpScale = 0.08;
  } else if (finish === 'matte-pla') {
    bumpMap = createProceduralBumpTexture('matte');
    bumpScale = 0.06;
  }

  const isTransparent = finish === 'transparent';
  const roughness = options?.isSecondary ? Math.min(1, spec.roughness + 0.12) : spec.roughness;
  const envMapIntensity =
    finish === 'metallic-pla' || finish === 'silk-pla'
      ? 1.15
      : finish === 'transparent'
        ? 0.9
        : 0.42;

  return {
    color: new THREE.Color(colorHex),
    roughness,
    metalness: spec.metalness,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: finish === 'silk-pla' ? 0.18 : 0.35,
    envMapIntensity,
    bumpMap: bumpMap ?? undefined,
    bumpScale,
    transparent: isTransparent,
    opacity: isTransparent ? 0.72 : 1,
    emissive: options?.emissiveHex ? new THREE.Color(options.emissiveHex) : new THREE.Color(0x000000),
    emissiveIntensity: options?.emissiveIntensity ?? 0,
  };
}
