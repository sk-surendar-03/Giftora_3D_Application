import type {
  DesignConfig,
  DesignThemeId,
  ProjectFileV1,
  SavedDesignRecord,
  StudioCategory,
} from '../types/design';
import { createDefaultDesign, DESIGN_THEMES } from './defaults';

const STORAGE_KEY = 'stark_print_studio_saved_designs_v1';

export function loadSavedDesigns(): SavedDesignRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedDesignRecord =>
        Boolean(item && typeof item.id === 'string' && item.config && typeof item.name === 'string')
    );
  } catch {
    return [];
  }
}

export function persistSavedDesigns(records: SavedDesignRecord[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore quota errors gracefully
  }
}

export function saveDesignToStorage(config: DesignConfig, favorite = false): SavedDesignRecord[] {
  const existing = loadSavedDesigns();
  const now = new Date().toISOString();
  const id = config.id && config.id !== 'default-stark-design' ? config.id : `design-${Date.now()}`;
  const cleanConfig: DesignConfig = {
    ...config,
    id,
    updatedAt: now,
  };
  const prev = existing.find((r) => r.id === id);
  const record: SavedDesignRecord = {
    id,
    name: cleanConfig.name || 'Untitled Design',
    category: cleanConfig.category,
    favorite: prev ? prev.favorite : favorite,
    updatedAt: now,
    config: cleanConfig,
  };
  const updated = [record, ...existing.filter((r) => r.id !== id)];
  persistSavedDesigns(updated);
  return updated;
}

export function deleteSavedDesign(id: string): SavedDesignRecord[] {
  const updated = loadSavedDesigns().filter((r) => r.id !== id);
  persistSavedDesigns(updated);
  return updated;
}

export function toggleFavoriteDesign(id: string): SavedDesignRecord[] {
  const updated = loadSavedDesigns().map((r) =>
    r.id === id ? { ...r, favorite: !r.favorite } : r
  );
  persistSavedDesigns(updated);
  return updated;
}

export function serializeProjectJson(design: DesignConfig): string {
  const payload: ProjectFileV1 = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: 'stark-print-studio',
    design,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseProjectJson(jsonText: string): {
  ok: true;
  design: DesignConfig;
} | {
  ok: false;
  error: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Invalid JSON file format.' };
    }
    if (parsed.schemaVersion !== 1 || parsed.app !== 'stark-print-studio' || !parsed.design) {
      return {
        ok: false,
        error: 'Unrecognized project schema. Expected Stark Print Studio schemaVersion 1.',
      };
    }
    const base = createDefaultDesign(parsed.design.category || 'combined');
    const merged: DesignConfig = {
      ...base,
      ...parsed.design,
      phone: { ...base.phone, ...(parsed.design.phone || {}) },
      pen: { ...base.pen, ...(parsed.design.pen || {}) },
      combined: { ...base.combined, ...(parsed.design.combined || {}) },
      personalization: { ...base.personalization, ...(parsed.design.personalization || {}) },
      appearance: {
        ...base.appearance,
        ...(parsed.design.appearance || {}),
        colors: { ...base.appearance.colors, ...(parsed.design.appearance?.colors || {}) },
      },
      print: { ...base.print, ...(parsed.design.print || {}) },
    };
    return { ok: true, design: merged };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to parse project JSON.',
    };
  }
}

export function encodeDesignToShareHash(design: DesignConfig): string | null {
  try {
    // Strip large SVG data so share URL stays compact
    const compact: DesignConfig = {
      ...design,
      personalization: {
        ...design.personalization,
        svgLogoData: null,
        svgLogoName: null,
      },
    };
    const json = JSON.stringify(compact);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (encoded.length > 3500) return null;
    return encoded;
  } catch {
    return null;
  }
}

export function decodeDesignFromShareHash(encoded: string): DesignConfig | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((encoded.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const raw = JSON.parse(json);
    const base = createDefaultDesign(raw.category || 'combined');
    return {
      ...base,
      ...raw,
      phone: { ...base.phone, ...(raw.phone || {}) },
      pen: { ...base.pen, ...(raw.pen || {}) },
      combined: { ...base.combined, ...(raw.combined || {}) },
      personalization: { ...base.personalization, ...(raw.personalization || {}) },
      appearance: {
        ...base.appearance,
        ...(raw.appearance || {}),
        colors: { ...base.appearance.colors, ...(raw.appearance?.colors || {}) },
      },
      print: { ...base.print, ...(raw.print || {}) },
    };
  } catch {
    return null;
  }
}

/**
 * Generates a constrained, guaranteed-printable random design within safe tolerances.
 */
export function randomizePrintableDesign(
  current: DesignConfig,
  seed: number = Date.now()
): DesignConfig {
  const rand = (() => {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  })();

  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const range = (min: number, max: number, step = 1) =>
    Math.round((min + rand() * (max - min)) / step) * step;

  const categories: StudioCategory[] = [
    'phone-stand',
    'pen-holder',
    'combined',
    'desk-organizer',
    'personalized-gift',
  ];
  const category = pick(categories);
  const themeIds = Object.keys(DESIGN_THEMES) as DesignThemeId[];
  const themeId = pick(themeIds);
  const theme = DESIGN_THEMES[themeId];

  const base = createDefaultDesign(category, themeId);

  return {
    ...base,
    id: `random-${seed}`,
    name: `${theme.label} Custom Stand`,
    print: { ...current.print },
    phone: {
      ...base.phone,
      type: pick([
        'minimalist-angled',
        'cradle',
        'vertical-dock',
        'curved-sculptural',
        'gaming-themed',
        'geometric',
        'nameplate',
        'cable-groove',
      ]),
      baseWidth: range(72, 98, 2),
      baseDepth: range(84, 110, 2),
      baseThickness: range(4, 7, 0.5),
      backHeight: range(78, 108, 2),
      restingAngle: range(58, 76, 2),
      lipHeight: range(9, 14, 1),
      cornerRadius: theme.recommendedCornerRadius,
      cableRoutingHole: rand() > 0.3,
      nonSlipRecesses: rand() > 0.4,
      decorativePattern: pick(['none', 'ribs', 'hex-cutout', 'chamfer-facets']),
    },
    pen: {
      ...base.pen,
      type: pick([
        'round-cup',
        'square-cup',
        'hexagonal-cup',
        'honeycomb-holder',
        'wave-ribbed',
        'geometric-polygon',
        'spiral-aesthetic',
        'multi-slot-rack',
        'angled-pen-holder',
      ]),
      cupHeight: range(80, 112, 2),
      exteriorDiameter: range(60, 82, 2),
      wallThickness: range(2.8, 4.4, 0.2),
      slotCount: range(3, 9, 1),
      slotDiameter: range(10, 14, 1),
      holeShape: pick(['round', 'square', 'hexagonal']),
      holeArrangement: pick(['grid', 'circular', 'staggered', 'linear']),
      ribCount: range(12, 24, 2),
    },
    combined: {
      ...base.combined,
      type: pick([
        'phone-left-pen-right',
        'pen-left-phone-right',
        'center-phone-dual-pens',
        'phone-cradle-rear-pen',
        'desk-organizer-tray',
      ]),
      moduleSpacing: range(6, 16, 2),
      baseShape: pick(['rounded-rect', 'stadium', 'chamfered']),
      includeTray: category === 'desk-organizer' || rand() > 0.5,
    },
    personalization: {
      ...base.personalization,
      enabled: true,
      text: pick(['STARK', 'STUDIO', 'MAKER', 'CREATE', 'DESK', 'FOCUS']),
      mode: rand() > 0.45 ? 'raised' : 'engraved',
      depth: 1.4,
    },
  };
}
