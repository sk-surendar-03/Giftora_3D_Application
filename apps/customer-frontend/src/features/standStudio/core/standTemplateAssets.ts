/**
 * Image Asset Mapping for Phone & Pen Stand Templates, Themes and Categories.
 *
 * Mapped to verified existing assets in apps/customer-frontend/public.
 * If a template or theme does not have a dedicated photographic asset,
 * it is explicitly tracked in MISSING_STAND_IMAGES and renders a clean
 * fallback card in the UI.
 */

export const STAND_CATEGORY_PREVIEWS: Record<string, string> = {
  // All stand categories return undefined to render clean typography fallback cards
};

export const STAND_THEME_PREVIEWS: Record<string, string> = {
  // All stand themes return undefined to render clean typography fallback cards
};

export const STAND_TEMPLATE_PREVIEWS: Record<string, string> = {
  // All stand templates return undefined to render clean typography fallback cards
};

export const MISSING_STAND_IMAGES = [
  { id: 'curved-phone-rest', type: 'template', label: 'Curved Phone Rest', requiredArt: 'Wood-finish curved phone cradle render' },
  { id: 'gamer-phone-stand', type: 'template', label: 'Gamer Phone Stand', requiredArt: 'Hex-ventilated RGB gaming phone dock render' },
  { id: 'personalized-charging-stand', type: 'template', label: 'Personalized Charging Stand', requiredArt: 'T-groove vertical charging stand render' },
  { id: 'compact-travel-stand', type: 'template', label: 'Compact Travel Stand', requiredArt: 'Hinged folding travel rest render' },
  { id: 'sculptural-wave-cradle', type: 'template', label: 'Sculptural Wave Cradle', requiredArt: 'Double-radiused wave phone cradle render' },
  { id: 'hex-honeycomb-cup', type: 'template', label: 'Hex Honeycomb Pencil Cup', requiredArt: 'Faceted honeycomb pencil cup render' },
  { id: 'zen-wave-pen-holder', type: 'template', label: 'Zen Wave Pen Stand', requiredArt: 'Sculptural ribbed desk cup render' },
  { id: 'modular-pen-dock', type: 'template', label: 'Modular Desk Organizer Cup', requiredArt: 'Split-level dual chamber pen organizer render' },
  { id: 'gaming-battlestation-dock', type: 'template', label: 'Gaming Battlestation Dock', requiredArt: 'Dual-dock gaming organizer with cable route render' },
  { id: 'corner-desk-organizer', type: 'template', label: 'Compact Corner Station', requiredArt: 'L-shaped 90-degree corner desk station render' },
  { id: 'nature-inspired', type: 'theme', label: 'Nature-Inspired Theme', requiredArt: 'Earthy wood-fill PLA preview badge' },
  { id: 'gaming-rgb', type: 'theme', label: 'Gaming Theme', requiredArt: 'Neon cyan/magenta gaming chassis preview badge' },
  { id: 'kids-playful', type: 'theme', label: 'Kids Playful Theme', requiredArt: 'Vibrant multi-color playful stationery dock render' },
];

export function getStandTemplatePreview(templateId: string): string | undefined {
  return STAND_TEMPLATE_PREVIEWS[templateId];
}

export function getStandThemePreview(themeId: string): string | undefined {
  return STAND_THEME_PREVIEWS[themeId];
}

export function getStandCategoryPreview(category: string): string | undefined {
  return STAND_CATEGORY_PREVIEWS[category];
}
