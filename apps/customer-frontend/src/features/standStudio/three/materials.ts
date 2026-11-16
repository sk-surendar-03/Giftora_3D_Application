import * as THREE from 'three';
import type { MaterialFinish } from '../types/design';

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

const textureCache = new Map<string, THREE.CanvasTexture>();

export function getProceduralTexture(
  kind: 'wood' | 'marble' | 'gradient' | 'layerlines',
  baseHex: string,
  accentHex = '#FFFFFF',
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const key = `${kind}:${baseHex}:${accentHex}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    if (kind === 'wood') {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, size, size);
      const baseColor = new THREE.Color(baseHex);
      const dark = baseColor.clone().multiplyScalar(0.68).getStyle();
      const light = baseColor.clone().lerp(new THREE.Color('#D2A679'), 0.28).getStyle();

      for (let y = 0; y < size; y += 3) {
        const wave = Math.sin(y * 0.08) * 6;
        ctx.strokeStyle = y % 6 === 0 ? dark : light;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(size * 0.33, y + wave, size * 0.66, y - wave, size, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'marble') {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, size, size);
      const veinColor = new THREE.Color(baseHex).getHSL({ h: 0, s: 0, l: 0 }).l > 0.5
        ? 'rgba(71, 85, 105, 0.25)'
        : 'rgba(241, 245, 249, 0.25)';
      ctx.strokeStyle = veinColor;
      for (let i = 0; i < 14; i++) {
        ctx.lineWidth = 0.8 + (i % 3) * 0.8;
        ctx.beginPath();
        let x = (i * 37) % size;
        let y = 0;
        ctx.moveTo(x, y);
        while (y < size) {
          y += 16;
          x += Math.sin(y * 0.05 + i) * 14;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (kind === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, baseHex);
      grad.addColorStop(1, accentHex);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else {
      // Subtle FDM layer lines grayscale bump map
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y += 4) {
        ctx.fillStyle = y % 8 === 0 ? '#929292' : '#6e6e6e';
        ctx.fillRect(0, y, size, 2);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.03, 0.03);
  tex.anisotropy = maxAnisotropy;
  if (kind !== 'layerlines') {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

export function createPartMaterial(
  finish: MaterialFinish,
  colorHex: string,
  accentHex: string,
  maxAnisotropy = 4
): THREE.MeshPhysicalMaterial {
  const bumpTex = getProceduralTexture('layerlines', '#808080', '#808080', maxAnisotropy);

  switch (finish) {
    case 'metallic-gold':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        metalness: 0.88,
        roughness: 0.24,
        clearcoat: 0.2,
        bumpMap: bumpTex,
        bumpScale: 0.08,
      });
    case 'metallic-silver':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        metalness: 0.9,
        roughness: 0.22,
        clearcoat: 0.15,
        bumpMap: bumpTex,
        bumpScale: 0.08,
      });
    case 'metallic-copper':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        metalness: 0.86,
        roughness: 0.26,
        clearcoat: 0.25,
        bumpMap: bumpTex,
        bumpScale: 0.08,
      });
    case 'satin':
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        metalness: 0.08,
        roughness: 0.36,
        clearcoat: 0.35,
        clearcoatRoughness: 0.3,
        bumpMap: bumpTex,
        bumpScale: 0.1,
      });
    case 'wood-grain': {
      const woodTex = getProceduralTexture('wood', colorHex, accentHex, maxAnisotropy);
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        map: woodTex,
        metalness: 0.02,
        roughness: 0.68,
        bumpMap: woodTex,
        bumpScale: 0.25,
      });
    }
    case 'marble': {
      const marbleTex = getProceduralTexture('marble', colorHex, accentHex, maxAnisotropy);
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        map: marbleTex,
        metalness: 0.04,
        roughness: 0.28,
        clearcoat: 0.65,
        clearcoatRoughness: 0.15,
      });
    }
    case 'gradient': {
      const gradTex = getProceduralTexture('gradient', colorHex, accentHex, maxAnisotropy);
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        map: gradTex,
        metalness: 0.18,
        roughness: 0.32,
        clearcoat: 0.4,
        bumpMap: bumpTex,
        bumpScale: 0.08,
      });
    }
    case 'two-tone':
    case 'matte':
    default:
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        metalness: 0.05,
        roughness: 0.72,
        bumpMap: bumpTex,
        bumpScale: 0.14,
      });
  }
}
