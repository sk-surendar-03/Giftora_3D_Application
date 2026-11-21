/**
 * Image Asset Mapping for Nameplate Templates, Archetypes and Silhouette Shapes.
 *
 * Mapped to verified existing assets in apps/customer-frontend/public.
 * If an archetype or shape lacks dedicated custom artwork, it is explicitly
 * tracked in MISSING_NAMEPLATE_IMAGES and renders a clean typography fallback card.
 */

export const NAMEPLATE_TEMPLATE_PREVIEWS: Record<string, string> = {
  // All nameplate templates return undefined to render clean typography fallback cards
};

export const NAMEPLATE_TYPE_PREVIEWS: Record<string, string> = {
  // All nameplate types return undefined to render clean typography fallback cards
};

export const NAMEPLATE_SHAPE_PREVIEWS: Record<string, string> = {
  // All nameplate shapes return undefined to render clean typography fallback cards
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
  return NAMEPLATE_TEMPLATE_PREVIEWS[templateId];
}

export function getNameplateTypePreview(typeId: string): string | undefined {
  return NAMEPLATE_TYPE_PREVIEWS[typeId];
}

export function getNameplateShapePreview(shapeId: string): string | undefined {
  return NAMEPLATE_SHAPE_PREVIEWS[shapeId];
}
