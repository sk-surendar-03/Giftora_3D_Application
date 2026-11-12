/**
 * Colours can vary by material (e.g. Silk Metallic PLA's colours differ
 * from Standard PLA's). Falls back to the product's flat `colors` list for
 * products that only ever had one material.
 */
export function colorsForMaterial(product, material) {
  const byMaterial = product.colorsByMaterial
  if (byMaterial && typeof byMaterial === 'object') {
    // exact match only — no fallback to another material's colors
    return byMaterial[material] ?? []
  }
  return product.colors
}

export const sampleProducts = [
  {
    id: '1',
    slug: 'classic-name-keychain',
    name: 'Classic Name Keychain',
    price: 299,
    category: 'Keychains',
    material: 'Standard PLA',
    description: 'A personalised PLA keychain engraved with your name or custom text.',
    image: null,
    createdAt: '2026-08-01',
    materials: ['Standard PLA', 'Silk Metallic PLA'],
    // Each material has its own valid colour set (Silk Metallic PLA's
    // colours are metallic-looking filament shades, not real metal).
    // `colors` stays as the default material's list, for any code that
    // doesn't (yet) look up colours per material.
    colorsByMaterial: {
      'Standard PLA': [
        { label: 'White', hex: '#f5f3ee' },
        { label: 'Black', hex: '#1a1a1a' },
        { label: 'Red', hex: '#b33a3a' },
        { label: 'Natural', hex: '#e8d9b5' },
      ],
      'Silk Metallic PLA': [
        { label: 'Gold', hex: '#c9a227' },
        { label: 'Silver', hex: '#c0c0c0' },
        { label: 'Bronze', hex: '#8c6239' },
        { label: 'Copper', hex: '#b5651d' },
        { label: 'Steel Grey', hex: '#71797e' },
      ],
    },
    colors: [
      { label: 'White', hex: '#f5f3ee' },
      { label: 'Black', hex: '#1a1a1a' },
      { label: 'Red', hex: '#b33a3a' },
      { label: 'Natural', hex: '#e8d9b5' },
    ],
    sizes: ['Small (4 cm)', 'Medium (5.5 cm)', 'Large (7 cm)'],
  },
  {
    id: '2',
    slug: 'acrylic-nameplate',
    name: 'Acrylic Nameplate',
    price: 499,
    category: 'Nameplates',
    material: 'Acrylic',
    description: 'A sleek acrylic nameplate for desks or doors, customised with your text and font.',
    image: null,
    createdAt: '2026-09-12',
    materials: ['Acrylic'],
    colors: [
      { label: 'Clear', hex: '#eef2f3' },
      { label: 'Frosted White', hex: '#f7f5f0' },
      { label: 'Black', hex: '#161412' },
    ],
    sizes: ['Desk (15 cm)', 'Door (20 cm)'],
  },
  {
    id: '3',
    slug: 'metal-name-keychain',
    name: 'Metal Name Keychain',
    price: 349,
    category: 'Keychains',
    material: 'Metal',
    description: 'A durable stainless steel keychain with laser-engraved personalisation.',
    image: null,
    createdAt: '2026-10-20',
    materials: ['Metal'],
    colors: [
      { label: 'Steel Silver', hex: '#c4c8cc' },
      { label: 'Matte Black', hex: '#2a2a2a' },
      { label: 'Gold Finish', hex: '#b9923f' },
    ],
    sizes: ['Small (4 cm)', 'Medium (5.5 cm)'],
  },
]
