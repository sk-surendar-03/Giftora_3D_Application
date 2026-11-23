import * as THREE from 'three';
import type { MaterialType } from '../types/studio';

export function createStandMaterial(
  color: string,
  materialType: MaterialType = 'pla',
  wireframe = false
): THREE.MeshStandardMaterial {
  const threeColor = new THREE.Color(color);

  let roughness = 0.35;
  let metalness = 0.05;

  switch (materialType) {
    case 'matte':
      roughness = 0.85;
      metalness = 0.02;
      break;
    case 'metallic':
      roughness = 0.28;
      metalness = 0.82;
      break;
    case 'silk':
      roughness = 0.18;
      metalness = 0.35;
      break;
    case 'petg':
      roughness = 0.22;
      metalness = 0.08;
      break;
    case 'pla':
    default:
      roughness = 0.45;
      metalness = 0.05;
      break;
  }

  return new THREE.MeshStandardMaterial({
    color: threeColor,
    roughness,
    metalness,
    wireframe,
    side: THREE.DoubleSide,
  });
}
