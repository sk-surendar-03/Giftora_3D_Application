/**
 * Image Asset Mapping for Nameplate Templates, Archetypes and Silhouette Shapes.
 *
 * Mapped to verified existing assets in apps/customer-frontend/public.
 * If an archetype or shape lacks dedicated custom artwork, it is explicitly
 * tracked in MISSING_NAMEPLATE_IMAGES and renders a clean typography fallback card.
 */

export const NAMEPLATE_TEMPLATE_PREVIEWS: Record<string, string> = {
  'tpl-minimalist': '/showcase/templates/nameplate.png',
  'tpl-luxury': '/hero-4.png',
  'tpl-royal': '/showcase/styles/name-keychain-soft-tag.png',
  'tpl-floral': '/showcase/styles/name-keychain-arch.png',
  'tpl-cartoon': '/showcase/styles/name-keychain-bubble.png',
  'tpl-superhero': '/showcase/styles/name-keychain-soft-tag.png',
  'tpl-gaming': '/showcase/styles/magnet-capsule.png',
  'tpl-corporate': '/showcase/templates/nameplate.png',
  'tpl-nature': '/showcase/styles/magnet-soft-tag.png',
  'tpl-wedding': '/showcase/styles/name-keychain-heart-split.png',
  'tpl-tamil-traditional': '/hero-3.png',
};

export const NAMEPLATE_TYPE_PREVIEWS: Record<string, string> = {
  desk: '/showcase/templates/nameplate.png',
  door: '/showcase/styles/name-keychain-arch.png',
  wall: '/showcase/templates/nameplate.png',
  kids: '/showcase/styles/name-keychain-bubble.png',
  business: '/showcase/templates/nameplate.png',
  led: '/showcase/templates/nameplate.png',
  'decorative-3d': '/showcase/styles/name-keychain-contour.png',
  wedding: '/showcase/styles/name-keychain-heart-split.png',
  'house-number': '/showcase/templates/nameplate.png',
  gaming: '/showcase/templates/nameplate.png',
};

export const NAMEPLATE_SHAPE_PREVIEWS: Record<string, string> = {
  rectangle: '/showcase/templates/nameplate.png',
  'rounded-rectangle': '/showcase/templates/nameplate.png',
  arch: '/showcase/styles/name-keychain-arch.png',
  cloud: '/showcase/styles/name-keychain-bubble.png',
  heart: '/showcase/styles/name-keychain-heart-split.png',
  'ribbon-banner': '/showcase/styles/name-keychain-ribbon.png',
  'chamfer-plate': '/showcase/styles/name-keychain-soft-tag.png',
  'ticket-notch': '/showcase/styles/magnet-soft-tag.png',
  'text-outline': '/showcase/styles/name-keychain-contour.png',
};

export const MISSING_NAMEPLATE_IMAGES = [
  { id: 'circle', type: 'shape', label: 'Circle Shape', requiredArt: 'Circular disc nameplate plaque render' },
  { id: 'oval', type: 'shape', label: 'Oval Shape', requiredArt: 'Horizontally elongated oval nameplate plaque render' },
  { id: 'hexagon', type: 'shape', label: 'Hexagon Shape', requiredArt: 'Hexagonal geometric battlestation plate render' },
  { id: 'octagon', type: 'shape', label: 'Octagon Shape', requiredArt: 'Chamfered octagonal architectural plaque render' },
  { id: 'diamond', type: 'shape', label: 'Diamond Shape', requiredArt: 'Rhombus diamond warning / house plate render' },
  { id: 'shield', type: 'shape', label: 'Shield Shape', requiredArt: 'Medieval heraldic crest shield plaque render' },
  { id: 'crest', type: 'shape', label: 'Royal Crest Shape', requiredArt: 'Ornamental baroque crest plaque render' },
  { id: 'scalloped', type: 'shape', label: 'Scalloped Shape', requiredArt: 'Ornate scalloped border vintage plaque render' },
  { id: 'house-roof', type: 'shape', label: 'House Roof Shape', requiredArt: 'Gabled roof architectural house number sign render' },
  { id: 'butterfly', type: 'shape', label: 'Butterfly Shape', requiredArt: 'Silhouetted butterfly wings nursery plaque render' },
  { id: 'star-burst', type: 'shape', label: 'Starburst Shape', requiredArt: 'Multi-point explosion starburst party sign render' },
  { id: 'tpl-birthday', type: 'template', label: 'Celebration Cake Topper / Sign', requiredArt: 'Circular birthday topper with party stars render' },
];

export function getNameplateTemplatePreview(templateId: string): string | undefined {
  return NAMEPLATE_TEMPLATE_PREVIEWS[templateId] ?? '/showcase/templates/nameplate.png';
}

export function getNameplateTypePreview(typeId: string): string | undefined {
  return NAMEPLATE_TYPE_PREVIEWS[typeId] ?? '/showcase/templates/nameplate.png';
}

export function getNameplateShapePreview(shapeId: string): string | undefined {
  return NAMEPLATE_SHAPE_PREVIEWS[shapeId];
}
