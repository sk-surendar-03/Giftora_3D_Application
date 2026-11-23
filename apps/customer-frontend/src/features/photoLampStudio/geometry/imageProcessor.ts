import { ImageAdjustmentSettings } from '../types/lithophane';

export interface ProcessedImageResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  // Normalized thickness map [0..1] where 0 = minThickness, 1 = maxThickness
  // Stored in row-major order: index = y * width + x
  thicknessMap: Float32Array;
  isLowRes: boolean;
  aspectRatio: number;
}

export function getDefaultAdjustments(): ImageAdjustmentSettings {
  return {
    brightness: 0,
    contrast: 15,
    gamma: 1.0,
    sharpness: 20,
    grayscale: true,
    invertTones: false,
    denoise: false,
    rotation: 0,
    flipH: false,
    flipV: false,
    cropAspect: 'free',
    zoom: 1.0,
    panX: 0,
    panY: 0,
  };
}

/**
 * Loads an image from File or URL and checks basic resolution
 */
export async function loadImageElement(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Applies adjustments, cropping, rotation, filters and outputs a processed canvas and normalized thickness grid
 */
export function processImageForLithophane(
  img: HTMLImageElement,
  settings: ImageAdjustmentSettings,
  targetWidth: number = 240, // standard grid sample width for 3D mesh
  targetHeight?: number
): ProcessedImageResult {
  const isLowRes = img.naturalWidth < 400 || img.naturalHeight < 400;

  // Compute aspect ratio considering rotation
  const isRotated90or270 = settings.rotation === 90 || settings.rotation === 270;
  const sourceW = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  const sourceH = isRotated90or270 ? img.naturalWidth : img.naturalHeight;
  const baseAspect = sourceW / sourceH;

  let effectiveAspect = baseAspect;
  if (settings.cropAspect === '1:1') effectiveAspect = 1.0;
  else if (settings.cropAspect === '4:3') effectiveAspect = 4 / 3;
  else if (settings.cropAspect === '3:4') effectiveAspect = 3 / 4;
  else if (settings.cropAspect === '16:9') effectiveAspect = 16 / 9;
  else if (settings.cropAspect === '9:16') effectiveAspect = 9 / 16;

  const outW = targetWidth;
  const outH = targetHeight ? targetHeight : Math.round(targetWidth / effectiveAspect);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create 2D canvas context for lithophane image processing.');
  }

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  ctx.save();
  // Move to center of canvas
  ctx.translate(outW / 2, outH / 2);

  // Apply Pan
  const px = (settings.panX / 100) * (outW / 2);
  const py = (settings.panY / 100) * (outH / 2);
  ctx.translate(px, py);

  // Apply Rotation
  ctx.rotate((settings.rotation * Math.PI) / 180);

  // Apply Flips
  ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);

  // Apply Zoom
  const zoom = Math.max(0.5, Math.min(4.0, settings.zoom));
  ctx.scale(zoom, zoom);

  // Draw source image centered and fitted to fill the target canvas
  const drawW = img.naturalWidth;
  const drawH = img.naturalHeight;

  // Scale factor to cover target
  const scale = Math.max(outW / sourceW, outH / sourceH);
  ctx.drawImage(
    img,
    -(drawW * scale) / 2,
    -(drawH * scale) / 2,
    drawW * scale,
    drawH * scale
  );

  ctx.restore();

  // Get pixel data for processing
  const imgData = ctx.getImageData(0, 0, outW, outH);
  const pixels = imgData.data;
  const totalPixels = outW * outH;

  // Contrast factor: contrast is -100 to 100
  const cFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
  const bOffset = settings.brightness * 2.55;
  const gamma = Math.max(0.2, Math.min(3.0, settings.gamma));
  const gammaInv = 1.0 / gamma;

  const grayValues = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];

    // Standard ITU-R BT.601 Luminance
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply brightness
    lum += bOffset;

    // Apply contrast
    lum = cFactor * (lum - 128) + 128;

    // Clamp
    lum = Math.max(0, Math.min(255, lum));

    // Apply Gamma
    let norm = lum / 255.0;
    norm = Math.pow(norm, gammaInv);

    grayValues[i] = norm;
  }

  // Optional 3x3 sharpen filter
  if (settings.sharpness > 0) {
    const sharpWeight = (settings.sharpness / 100) * 1.5;
    const sharpened = new Float32Array(totalPixels);

    for (let y = 0; y < outH; y++) {
      for (let x = 0; x < outW; x++) {
        const i = y * outW + x;
        if (x === 0 || x === outW - 1 || y === 0 || y === outH - 1) {
          sharpened[i] = grayValues[i];
          continue;
        }

        const center = grayValues[i];
        const up = grayValues[(y - 1) * outW + x];
        const down = grayValues[(y + 1) * outW + x];
        const left = grayValues[y * outW + (x - 1)];
        const right = grayValues[y * outW + (x + 1)];

        const laplacian = 4 * center - (up + down + left + right);
        const val = center + sharpWeight * laplacian;
        sharpened[i] = Math.max(0, Math.min(1, val));
      }
    }

    for (let i = 0; i < totalPixels; i++) {
      grayValues[i] = sharpened[i];
    }
  }

  // Optional denoise / gentle blur filter
  if (settings.denoise) {
    const denoised = new Float32Array(totalPixels);
    for (let y = 0; y < outH; y++) {
      for (let x = 0; x < outW; x++) {
        const i = y * outW + x;
        if (x === 0 || x === outW - 1 || y === 0 || y === outH - 1) {
          denoised[i] = grayValues[i];
          continue;
        }
        let sum = grayValues[i] * 4;
        sum += grayValues[(y - 1) * outW + x] * 2;
        sum += grayValues[(y + 1) * outW + x] * 2;
        sum += grayValues[y * outW + (x - 1)] * 2;
        sum += grayValues[y * outW + (x + 1)] * 2;
        sum += grayValues[(y - 1) * outW + (x - 1)];
        sum += grayValues[(y - 1) * outW + (x + 1)];
        sum += grayValues[(y + 1) * outW + (x - 1)];
        sum += grayValues[(y + 1) * outW + (x + 1)];
        denoised[i] = sum / 16;
      }
    }
    for (let i = 0; i < totalPixels; i++) {
      grayValues[i] = denoised[i];
    }
  }

  // Generate thickness map:
  // Bright regions = thinner (more light passes through)
  // Dark regions = thicker (less light passes through)
  const thicknessMap = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const norm = grayValues[i];
    const t = settings.invertTones ? norm : 1.0 - norm;
    thicknessMap[i] = Math.max(0.0, Math.min(1.0, t));

    // Write back to canvas for visual preview
    const grayByte = Math.round(norm * 255);
    const idx = i * 4;
    pixels[idx] = grayByte;
    pixels[idx + 1] = grayByte;
    pixels[idx + 2] = grayByte;
    pixels[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);

  return {
    canvas,
    width: outW,
    height: outH,
    thicknessMap,
    isLowRes,
    aspectRatio: outW / outH,
  };
}
