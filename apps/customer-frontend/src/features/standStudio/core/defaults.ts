import type {
  AppearanceParams,
  BuildBedPreset,
  DesignConfig,
  DesignThemeId,
  MaterialFinish,
  StudioCategory,
} from '../types/design';

export interface ThemePresetDefinition {
  id: DesignThemeId;
  label: string;
  description: string;
  finish: MaterialFinish;
  colors: AppearanceParams['colors'];
  recommendedCornerRadius: number;
  recommendedFont: DesignConfig['personalization']['fontStyle'];
  recommendedMotif: DesignConfig['personalization']['motif'];
}

export const DESIGN_THEMES: Record<DesignThemeId, ThemePresetDefinition> = {
  minimalist: {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Clean architectural matte tones with crisp geometry',
    finish: 'matte',
    colors: {
      base: '#1E293B',
      back: '#334155',
      cup: '#475569',
      text: '#F8FAFC',
      accent: '#2563EB',
    },
    recommendedCornerRadius: 6,
    recommendedFont: 'modern-sans',
    recommendedMotif: 'none',
  },
  'luxury-executive': {
    id: 'luxury-executive',
    label: 'Luxury Executive',
    description: 'Obsidian slate paired with brushed gold accents',
    finish: 'metallic-gold',
    colors: {
      base: '#18181B',
      back: '#27272A',
      cup: '#1F2937',
      text: '#D4AF37',
      accent: '#C59B27',
    },
    recommendedCornerRadius: 4,
    recommendedFont: 'serif',
    recommendedMotif: 'diamond',
  },
  'gaming-rgb': {
    id: 'gaming-rgb',
    label: 'Gaming RGB',
    description: 'Stealth carbon chassis with electric neon highlights',
    finish: 'two-tone',
    colors: {
      base: '#111827',
      back: '#1E293B',
      cup: '#0F172A',
      text: '#00E5FF',
      accent: '#8B5CF6',
    },
    recommendedCornerRadius: 3,
    recommendedFont: 'futuristic',
    recommendedMotif: 'hexagon',
  },
  'modern-geometric': {
    id: 'modern-geometric',
    label: 'Modern Geometric',
    description: 'Sharp faceted planes in warm stone and cobalt',
    finish: 'satin',
    colors: {
      base: '#E2E8F0',
      back: '#CBD5E1',
      cup: '#94A3B8',
      text: '#0F172A',
      accent: '#2563EB',
    },
    recommendedCornerRadius: 2,
    recommendedFont: 'bold',
    recommendedMotif: 'hexagon',
  },
  'cute-pastel': {
    id: 'cute-pastel',
    label: 'Cute & Pastel',
    description: 'Soft rounded contours in pastel lavender and rose',
    finish: 'satin',
    colors: {
      base: '#FBCFE8',
      back: '#DDD6FE',
      cup: '#BAE6FD',
      text: '#7C3AED',
      accent: '#F472B6',
    },
    recommendedCornerRadius: 12,
    recommendedFont: 'rounded',
    recommendedMotif: 'heart',
  },
  industrial: {
    id: 'industrial',
    label: 'Industrial',
    description: 'Utility graphite, brushed steel, and safety amber',
    finish: 'metallic-silver',
    colors: {
      base: '#374151',
      back: '#4B5563',
      cup: '#6B7280',
      text: '#F59E0B',
      accent: '#D97706',
    },
    recommendedCornerRadius: 3,
    recommendedFont: 'bold',
    recommendedMotif: 'gear',
  },
  'nature-inspired': {
    id: 'nature-inspired',
    label: 'Nature Inspired',
    description: 'Organic wood-grain finish with sage and botanical motifs',
    finish: 'wood-grain',
    colors: {
      base: '#8B5E3C',
      back: '#6F4E37',
      cup: '#A47551',
      text: '#ECFDF5',
      accent: '#15803D',
    },
    recommendedCornerRadius: 10,
    recommendedFont: 'handwritten',
    recommendedMotif: 'leaf',
  },
  futuristic: {
    id: 'futuristic',
    label: 'Futuristic',
    description: 'Pearl ceramic and anodized titanium gradient aesthetic',
    finish: 'gradient',
    colors: {
      base: '#E5E7EB',
      back: '#9CA3AF',
      cup: '#64748B',
      text: '#0284C7',
      accent: '#06B6D4',
    },
    recommendedCornerRadius: 8,
    recommendedFont: 'futuristic',
    recommendedMotif: 'star',
  },
  'corporate-gift': {
    id: 'corporate-gift',
    label: 'Corporate Gift',
    description: 'Executive navy and brushed copper presentation finish',
    finish: 'metallic-copper',
    colors: {
      base: '#1E3A5F',
      back: '#172554',
      cup: '#1E40AF',
      text: '#FDE68A',
      accent: '#B45309',
    },
    recommendedCornerRadius: 5,
    recommendedFont: 'serif',
    recommendedMotif: 'none',
  },
  'kids-student': {
    id: 'kids-student',
    label: 'Kids / Student',
    description: 'Playful sky blue, mint, and upbeat rounded styling',
    finish: 'matte',
    colors: {
      base: '#38BDF8',
      back: '#34D399',
      cup: '#FBBF24',
      text: '#FFFFFF',
      accent: '#F97316',
    },
    recommendedCornerRadius: 11,
    recommendedFont: 'playful',
    recommendedMotif: 'star',
  },
};

export const MATERIAL_SWATCHES: Array<{
  name: string;
  hex: string;
  group: 'Neutrals' | 'Metallics' | 'Pastels' | 'Neons';
}> = [
  { name: 'Matte Black', hex: '#18181B', group: 'Neutrals' },
  { name: 'Chalk White', hex: '#F8FAFC', group: 'Neutrals' },
  { name: 'Studio Gray', hex: '#64748B', group: 'Neutrals' },
  { name: 'Deep Navy', hex: '#1E3A5F', group: 'Neutrals' },
  { name: 'Warm Beige', hex: '#D6C7B2', group: 'Neutrals' },
  { name: 'Brushed Gold', hex: '#D4AF37', group: 'Metallics' },
  { name: 'Brushed Silver', hex: '#C0C7D1', group: 'Metallics' },
  { name: 'Warm Copper', hex: '#B87333', group: 'Metallics' },
  { name: 'Pastel Pink', hex: '#F9A8D4', group: 'Pastels' },
  { name: 'Pastel Lavender', hex: '#C4B5FD', group: 'Pastels' },
  { name: 'Pastel Mint', hex: '#86EFAC', group: 'Pastels' },
  { name: 'Sky Blue', hex: '#7DD3FC', group: 'Pastels' },
  { name: 'Neon Green', hex: '#22C55E', group: 'Neons' },
  { name: 'Electric Blue', hex: '#00B4FF', group: 'Neons' },
  { name: 'Neon Orange', hex: '#FF6B00', group: 'Neons' },
  { name: 'Neon Purple', hex: '#A855F7', group: 'Neons' },
];

export const CATEGORY_META: Record<
  StudioCategory,
  { label: string; shortLabel: string; summary: string }
> = {
  'phone-stand': {
    label: 'Phone Stand Studio',
    shortLabel: 'Phone Stand',
    summary: 'Angled docks, cradles, vertical chargers, and hinged travel stands.',
  },
  'pen-holder': {
    label: 'Pen Holder Studio',
    shortLabel: 'Pen Holder',
    summary: 'Round, hex, honeycomb, ribbed cups, and multi-slot pen racks.',
  },
  combined: {
    label: 'Combined Phone + Pen Stand',
    shortLabel: 'Phone + Pen',
    summary: 'Unified or multi-part phone docks paired with precision pen cups.',
  },
  'desk-organizer': {
    label: 'Desk Organizer Studio',
    shortLabel: 'Desk Organizer',
    summary: 'Workstations combining phone rests, pen slots, and small-item trays.',
  },
  'personalized-gift': {
    label: 'Personalized Gift Stand',
    shortLabel: 'Gift Stand',
    summary: 'Monogrammed plinths, engraved tributes, and custom motif keepsakes.',
  },
};

export function getBedDimensions(
  preset: BuildBedPreset,
  customX: number,
  customY: number,
  customZ: number
): { x: number; y: number; z: number } {
  switch (preset) {
    case '180x180':
      return { x: 180, y: 180, z: 180 };
    case '220x220':
      return { x: 220, y: 220, z: 250 };
    case '256x256':
      return { x: 256, y: 256, z: 256 };
    case 'custom':
      return {
        x: Math.max(60, customX || 220),
        y: Math.max(60, customY || 220),
        z: Math.max(60, customZ || 220),
      };
  }
}

export function createDefaultDesign(
  category: StudioCategory = 'combined',
  themeId: DesignThemeId = 'minimalist'
): DesignConfig {
  const theme = DESIGN_THEMES[themeId];
  const isDeskOrganizer = category === 'desk-organizer';
  const isPersonalizedGift = category === 'personalized-gift';

  return {
    id: `default-${category}-${Date.now()}`,
    name: isDeskOrganizer
      ? 'Modular Workstation Organizer'
      : isPersonalizedGift
      ? 'Monogram Gift Plinth'
      : category === 'phone-stand'
      ? 'Classic Phone Stand'
      : category === 'pen-holder'
      ? 'Executive Pen Holder'
      : 'Stark Studio Stand',
    category,
    phone: {
      type: isDeskOrganizer ? 'cable-groove' : isPersonalizedGift ? 'nameplate' : 'minimalist-angled',
      baseWidth: 82,
      baseDepth: 96,
      baseThickness: 5,
      backHeight: 92,
      backWidth: 68,
      restingAngle: 68,
      phoneThickness: 9.5,
      caseClearance: 1.5,
      lipHeight: 11,
      lipWidth: 66,
      orientation: 'portrait',
      cornerRadius: theme.recommendedCornerRadius,
      cableSlotWidth: 16,
      cableRoutingHole: true,
      nonSlipRecesses: true,
      decorativePattern: 'none',
      sidePenLoop: false,
    },
    pen: {
      type: isDeskOrganizer ? 'multi-slot-rack' : 'round-cup',
      cupHeight: 95,
      exteriorDiameter: 68,
      wallThickness: 3.2,
      bottomThickness: 4,
      slotCount: 6,
      slotDiameter: 12,
      slotSpacing: 18,
      holeShape: 'round',
      holeArrangement: 'circular',
      shallowTray: false,
      ribCount: 16,
      ribDepth: 1.6,
      integratedBase: true,
      cupCount: 1,
      secondaryCupHeight: 65,
      secondaryCupDiameter: 54,
    },
    combined: {
      type: isDeskOrganizer
        ? 'desk-organizer-tray'
        : isPersonalizedGift
        ? 'executive-personalized'
        : 'phone-left-pen-right',
      moduleSpacing: isPersonalizedGift ? 10 : 8,
      baseShape: isPersonalizedGift ? 'chamfered' : 'rounded-rect',
      symmetrical: false,
      includeTray: isDeskOrganizer,
      trayWidth: 52,
      trayDepth: 46,
      trayWallHeight: 14,
      mergeSingleSolid: true,
      phoneOffsetX: -40,
      penOffsetX: 44,
    },
    personalization: {
      enabled: isPersonalizedGift || true,
      text: isDeskOrganizer ? 'WORK' : isPersonalizedGift ? 'GIFT' : 'STARK',
      fontStyle: isPersonalizedGift ? 'serif' : theme.recommendedFont,
      fontSize: 8.5,
      alignment: 'center',
      letterSpacing: 1.1,
      depth: 1.6,
      mode: 'raised',
      curved: false,
      placement: 'front',
      motif: theme.recommendedMotif,
      motifSize: 11,
      svgLogoData: null,
      svgLogoName: null,
      svgLogoScale: 1,
      svgLogoMode: 'raised',
    },
    appearance: {
      themeId,
      finish: theme.finish,
      colors: { ...theme.colors },
    },
    print: {
      filament: 'PLA',
      layerHeight: 0.2,
      infillPercent: 20,
      minWallThickness: 2.4,
      bedPreset: '220x220',
      customBedX: 220,
      customBedY: 220,
      customBedZ: 250,
      filamentCostPerKg: 22,
      markupPercent: 180,
    },
    updatedAt: '2026-11-13T10:00:00.000Z',
  };
}
