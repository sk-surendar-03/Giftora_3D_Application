// Maps a product's real material name to plausible PBR properties so the
// preview reads differently per material. This is a stylistic approximation
// for the live preview, not a manufacturing material specification.
const APPEARANCE_BY_MATERIAL = {
  Metal: { metalness: 0.85, roughness: 0.25 },
  Acrylic: { metalness: 0, roughness: 0.1, transparent: true, opacity: 0.88 },
  // Standard PLA: an ordinary, mostly-matte plastic filament finish.
  'Standard PLA': { metalness: 0, roughness: 0.6 },
  // Silk Metallic PLA: still plain PLA plastic, not real metal — but "silk"
  // filaments print with a glossy, metallic-looking surface, which a high
  // metalness + low roughness reads as visually, even though the material
  // itself isn't metal.
  'Silk Metallic PLA': { metalness: 0.75, roughness: 0.18 },
}

const DEFAULT_APPEARANCE = { metalness: 0.1, roughness: 0.5 }

export function getMaterialAppearance(materialName) {
  return APPEARANCE_BY_MATERIAL[materialName] ?? DEFAULT_APPEARANCE
}
