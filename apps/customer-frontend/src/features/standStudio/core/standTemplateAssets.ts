/**
 * Image Asset Mapping for Phone & Pen Stand Templates, Themes and Categories.
 *
 * Mapped to verified existing assets in apps/customer-frontend/public.
 * If a template or theme does not have a dedicated photographic asset,
 * it is explicitly tracked in MISSING_STAND_IMAGES and renders a clean
 * fallback card in the UI.
 */

export const STAND_CATEGORY_PREVIEWS: Record<string, string> = {
  'phone-stand': '/hero-2.png',
  'pen-holder': '/hero-2.png',
  combined: '/hero-2.png',
};

export const STAND_THEME_PREVIEWS: Record<string, string> = {
  minimalist: '/hero-2.png',
  'corporate-gift': '/hero-2.png',
  'executive-marble': '/hero-4.png',
  // Missing dedicated artwork:
  // 'nature-inspired', 'gaming-rgb', 'kids-playful'
};

export const STAND_TEMPLATE_PREVIEWS: Record<string, string> = {
  'executive-desk-station': '/hero-2.png',
  'minimal-phone-dock': '/hero-2.png',
  'minimalist-duo-stand': '/hero-2.png',
  'executive-pen-tray': '/hero-4.png',
  // Missing dedicated artwork:
  // 'curved-phone-rest', 'gamer-phone-stand', 'personalized-charging-stand',
  // 'compact-travel-stand', 'sculptural-wave-cradle', 'hex-honeycomb-cup',
  // 'zen-wave-pen-holder', 'modular-pen-dock', 'gaming-battlestation-dock',
  // 'corner-desk-organizer'
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
