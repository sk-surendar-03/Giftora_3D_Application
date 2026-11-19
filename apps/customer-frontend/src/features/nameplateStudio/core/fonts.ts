import { FontCategory } from './types';

export interface StudioFont {
  id: string;
  name: string;
  family: string;
  googleFamily: string;
  category: Exclude<FontCategory, 'all'>;
  defaultWeight: '400' | '600' | '700' | '800';
  supportsBold: boolean;
  supportsItalic: boolean;
  supportsTamil: boolean;
  fallback: string;
}

export const STUDIO_FONTS: StudioFont[] = [
  // Modern (11)
  { id: 'outfit', name: 'Outfit', family: 'Outfit', googleFamily: 'Outfit:wght@400;600;700;800', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'plus-jakarta', name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', googleFamily: 'Plus+Jakarta+Sans:ital,wght@0,400;0,700;0,800;1,400;1,700', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat', googleFamily: 'Montserrat:ital,wght@0,400;0,700;0,900;1,700', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'poppins', name: 'Poppins', family: 'Poppins', googleFamily: 'Poppins:ital,wght@0,400;0,700;0,800;1,700', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'dm-sans', name: 'DM Sans', family: 'DM Sans', googleFamily: 'DM+Sans:ital,wght@0,400;0,700;1,700', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'manrope', name: 'Manrope', family: 'Manrope', googleFamily: 'Manrope:wght@400;700;800', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'urbanist', name: 'Urbanist', family: 'Urbanist', googleFamily: 'Urbanist:ital,wght@0,400;0,700;0,800;1,700', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'sora', name: 'Sora', family: 'Sora', googleFamily: 'Sora:wght@400;700;800', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'raleway', name: 'Raleway', family: 'Raleway', googleFamily: 'Raleway:ital,wght@0,400;0,700;0,800;1,700', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'rubik', name: 'Rubik', family: 'Rubik', googleFamily: 'Rubik:ital,wght@0,500;0,700;0,800;1,700', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'lexend', name: 'Lexend', family: 'Lexend', googleFamily: 'Lexend:wght@500;700;800', category: 'modern', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },

  // Bold / Display (11)
  { id: 'bebas-neue', name: 'Bebas Neue', family: 'Bebas Neue', googleFamily: 'Bebas+Neue', category: 'bold', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'Impact, sans-serif' },
  { id: 'oswald', name: 'Oswald', family: 'Oswald', googleFamily: 'Oswald:wght@500;700', category: 'bold', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'anton', name: 'Anton', family: 'Anton', googleFamily: 'Anton', category: 'bold', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'Impact, sans-serif' },
  { id: 'archivo-black', name: 'Archivo Black', family: 'Archivo Black', googleFamily: 'Archivo+Black', category: 'bold', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'russo-one', name: 'Russo One', family: 'Russo One', googleFamily: 'Russo+One', category: 'bold', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'bungee', name: 'Bungee', family: 'Bungee', googleFamily: 'Bungee', category: 'bold', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'Impact, sans-serif' },
  { id: 'barlow-condensed', name: 'Barlow Condensed', family: 'Barlow Condensed', googleFamily: 'Barlow+Condensed:ital,wght@0,600;0,800;1,700', category: 'bold', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'alfa-slab-one', name: 'Alfa Slab One', family: 'Alfa Slab One', googleFamily: 'Alfa+Slab+One', category: 'bold', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'serif' },
  { id: 'lilita-one', name: 'Lilita One', family: 'Lilita One', googleFamily: 'Lilita+One', category: 'bold', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'kanit', name: 'Kanit', family: 'Kanit', googleFamily: 'Kanit:ital,wght@0,600;0,800;1,700', category: 'bold', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'righteous', name: 'Righteous', family: 'Righteous', googleFamily: 'Righteous', category: 'bold', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },

  // Script & Handwritten (10)
  { id: 'pacific-script', name: 'Pacifico', family: 'Pacifico', googleFamily: 'Pacifico', category: 'script', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'great-vibes', name: 'Great Vibes', family: 'Great Vibes', googleFamily: 'Great+Vibes', category: 'script', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'dancing-script', name: 'Dancing Script', family: 'Dancing Script', googleFamily: 'Dancing+Script:wght@600;700', category: 'script', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'lobster', name: 'Lobster', family: 'Lobster', googleFamily: 'Lobster', category: 'script', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'sacramento', name: 'Sacramento', family: 'Sacramento', googleFamily: 'Sacramento', category: 'script', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'satisfy', name: 'Satisfy', family: 'Satisfy', googleFamily: 'Satisfy', category: 'script', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'kaushan-script', name: 'Kaushan Script', family: 'Kaushan Script', googleFamily: 'Kaushan+Script', category: 'script', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'yellowtail', name: 'Yellowtail', family: 'Yellowtail', googleFamily: 'Yellowtail', category: 'script', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'courgette', name: 'Courgette', family: 'Courgette', googleFamily: 'Courgette', category: 'script', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'caveat', name: 'Caveat', family: 'Caveat', googleFamily: 'Caveat:wght@600;700', category: 'script', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },

  // Elegant / Luxury Serif (10)
  { id: 'cinzel', name: 'Cinzel', family: 'Cinzel', googleFamily: 'Cinzel:wght@600;700;800', category: 'elegant', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'playfair-display', name: 'Playfair Display', family: 'Playfair Display', googleFamily: 'Playfair+Display:ital,wght@0,600;0,800;1,600', category: 'elegant', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'cormorant', name: 'Cormorant Garamond', family: 'Cormorant Garamond', googleFamily: 'Cormorant+Garamond:ital,wght@0,600;0,700;1,600', category: 'elegant', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'bodoni-moda', name: 'Bodoni Moda', family: 'Bodoni Moda', googleFamily: 'Bodoni+Moda:ital,wght@0,600;0,800;1,600', category: 'elegant', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'abril-fatface', name: 'Abril Fatface', family: 'Abril Fatface', googleFamily: 'Abril+Fatface', category: 'elegant', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'fraunces', name: 'Fraunces', family: 'Fraunces', googleFamily: 'Fraunces:ital,wght@0,600;0,800;1,600', category: 'elegant', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'prata', name: 'Prata', family: 'Prata', googleFamily: 'Prata', category: 'elegant', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'marcellus', name: 'Marcellus', family: 'Marcellus', googleFamily: 'Marcellus', category: 'elegant', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'yeseva-one', name: 'Yeseva One', family: 'Yeseva One', googleFamily: 'Yeseva+One', category: 'elegant', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'cinzel-decorative', name: 'Cinzel Decorative', family: 'Cinzel Decorative', googleFamily: 'Cinzel+Decorative:wght@700;900', category: 'elegant', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'Georgia, serif' },

  // Playful / Kids / Cartoon (8)
  { id: 'fredoka', name: 'Fredoka', family: 'Fredoka', googleFamily: 'Fredoka:wght@500;600;700', category: 'playful', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'baloo-2', name: 'Baloo 2', family: 'Baloo 2', googleFamily: 'Baloo+2:wght@600;700;800', category: 'playful', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'bangers', name: 'Bangers', family: 'Bangers', googleFamily: 'Bangers', category: 'playful', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'luckiest-guy', name: 'Luckiest Guy', family: 'Luckiest Guy', googleFamily: 'Luckiest+Guy', category: 'playful', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'titan-one', name: 'Titan One', family: 'Titan One', googleFamily: 'Titan+One', category: 'playful', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'chewy', name: 'Chewy', family: 'Chewy', googleFamily: 'Chewy', category: 'playful', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'comfortaa', name: 'Comfortaa', family: 'Comfortaa', googleFamily: 'Comfortaa:wght@600;700', category: 'playful', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'bubblegum-sans', name: 'Bubblegum Sans', family: 'Bubblegum Sans', googleFamily: 'Bubblegum+Sans', category: 'playful', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },

  // Classic (7)
  { id: 'merriweather', name: 'Merriweather', family: 'Merriweather', googleFamily: 'Merriweather:ital,wght@0,700;0,900;1,700', category: 'classic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'lora', name: 'Lora', family: 'Lora', googleFamily: 'Lora:ital,wght@0,600;0,700;1,600', category: 'classic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'libre-baskerville', name: 'Libre Baskerville', family: 'Libre Baskerville', googleFamily: 'Libre+Baskerville:ital,wght@0,700;1,400', category: 'classic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'eb-garamond', name: 'EB Garamond', family: 'EB Garamond', googleFamily: 'EB+Garamond:ital,wght@0,600;0,700;1,600', category: 'classic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'crimson-pro', name: 'Crimson Pro', family: 'Crimson Pro', googleFamily: 'Crimson+Pro:ital,wght@0,600;0,700;1,600', category: 'classic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'bitter', name: 'Bitter', family: 'Bitter', googleFamily: 'Bitter:ital,wght@0,600;0,800;1,600', category: 'classic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },
  { id: 'zilla-slab', name: 'Zilla Slab', family: 'Zilla Slab', googleFamily: 'Zilla+Slab:ital,wght@0,600;0,700;1,600', category: 'classic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'Georgia, serif' },

  // Futuristic / Sci-Fi / Gaming (7)
  { id: 'orbitron', name: 'Orbitron', family: 'Orbitron', googleFamily: 'Orbitron:wght@600;700;800', category: 'futuristic', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'chakra-petch', name: 'Chakra Petch', family: 'Chakra Petch', googleFamily: 'Chakra+Petch:ital,wght@0,600;0,700;1,700', category: 'futuristic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'audiowide', name: 'Audiowide', family: 'Audiowide', googleFamily: 'Audiowide', category: 'futuristic', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'rajdhani', name: 'Rajdhani', family: 'Rajdhani', googleFamily: 'Rajdhani:wght@600;700', category: 'futuristic', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'exo-2', name: 'Exo 2', family: 'Exo 2', googleFamily: 'Exo+2:ital,wght@0,700;0,800;1,700', category: 'futuristic', defaultWeight: '700', supportsBold: true, supportsItalic: true, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'oxanium', name: 'Oxanium', family: 'Oxanium', googleFamily: 'Oxanium:wght@600;700;800', category: 'futuristic', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'michroma', name: 'Michroma', family: 'Michroma', googleFamily: 'Michroma', category: 'futuristic', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },

  // Stencil & Industrial (5)
  { id: 'black-ops-one', name: 'Black Ops One', family: 'Black Ops One', googleFamily: 'Black+Ops+One', category: 'stencil', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'Impact, sans-serif' },
  { id: 'stardos-stencil', name: 'Stardos Stencil', family: 'Stardos Stencil', googleFamily: 'Stardos+Stencil:wght@400;700', category: 'stencil', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: false, fallback: 'serif' },
  { id: 'allerta-stencil', name: 'Allerta Stencil', family: 'Allerta Stencil', googleFamily: 'Allerta+Stencil', category: 'stencil', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'saira-stencil-one', name: 'Saira Stencil One', family: 'Saira Stencil One', googleFamily: 'Saira+Stencil+One', category: 'stencil', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'bungee-shade', name: 'Bungee Shade', family: 'Bungee Shade', googleFamily: 'Bungee+Shade', category: 'stencil', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },

  // Retro & Art Deco (5)
  { id: 'poiret-one', name: 'Poiret One', family: 'Poiret One', googleFamily: 'Poiret+One', category: 'retro', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'monoton', name: 'Monoton', family: 'Monoton', googleFamily: 'Monoton', category: 'retro', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },
  { id: 'shrikhand', name: 'Shrikhand', family: 'Shrikhand', googleFamily: 'Shrikhand', category: 'retro', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'cursive' },
  { id: 'press-start-2p', name: 'Press Start 2P', family: 'Press Start 2P', googleFamily: 'Press+Start+2P', category: 'retro', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'monospace' },
  { id: 'fascinate', name: 'Fascinate', family: 'Fascinate', googleFamily: 'Fascinate', category: 'retro', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: false, fallback: 'sans-serif' },

  // Tamil & Bilingual Support (6)
  { id: 'noto-sans-tamil', name: 'Noto Sans Tamil', family: 'Noto Sans Tamil', googleFamily: 'Noto+Sans+Tamil:wght@500;700;800', category: 'tamil', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: true, fallback: 'sans-serif' },
  { id: 'mukta-malar', name: 'Mukta Malar (Tamil)', family: 'Mukta Malar', googleFamily: 'Mukta+Malar:wght@500;700;800', category: 'tamil', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: true, fallback: 'sans-serif' },
  { id: 'hind-madurai', name: 'Hind Madurai (Tamil)', family: 'Hind Madurai', googleFamily: 'Hind+Madurai:wght@500;600;700', category: 'tamil', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: true, fallback: 'sans-serif' },
  { id: 'baloo-thambi-2', name: 'Baloo Thambi 2 (Tamil)', family: 'Baloo Thambi 2', googleFamily: 'Baloo+Thambi+2:wght@600;700;800', category: 'tamil', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: true, fallback: 'sans-serif' },
  { id: 'catamaran', name: 'Catamaran (Tamil)', family: 'Catamaran', googleFamily: 'Catamaran:wght@600;700;800', category: 'tamil', defaultWeight: '700', supportsBold: true, supportsItalic: false, supportsTamil: true, fallback: 'sans-serif' },
  { id: 'kavivanar', name: 'Kavivanar (Tamil Script)', family: 'Kavivanar', googleFamily: 'Kavivanar', category: 'tamil', defaultWeight: '400', supportsBold: false, supportsItalic: false, supportsTamil: true, fallback: 'sans-serif' },
];

export const FONT_CATEGORIES: { id: FontCategory; label: string }[] = [
  { id: 'all', label: `All (${STUDIO_FONTS.length})` },
  { id: 'modern', label: 'Modern' },
  { id: 'bold', label: 'Bold' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'script', label: 'Script' },
  { id: 'playful', label: 'Playful' },
  { id: 'classic', label: 'Classic' },
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'stencil', label: 'Stencil' },
  { id: 'retro', label: 'Retro' },
  { id: 'tamil', label: 'Tamil + EN' },
];

const loadedFontPromises = new Map<string, Promise<boolean>>();
const stylesheetPromises = new Map<string, Promise<void>>();

export function getFontById(fontId: string): StudioFont {
  return STUDIO_FONTS.find((f) => f.id === fontId) ?? STUDIO_FONTS[0];
}

export function resolveFontCssDescriptor(
  font: StudioFont,
  bold: boolean,
  italic: boolean,
): { weight: string; style: string; cssFontPrefix: string } {
  const weight = font.supportsBold ? (bold ? '700' : '400') : font.defaultWeight;
  const style = italic && font.supportsItalic ? 'italic' : 'normal';
  return {
    weight,
    style,
    cssFontPrefix: `${style} ${weight}`,
  };
}

export function isFontReadyInBrowser(fontId: string, bold: boolean, italic: boolean): boolean {
  if (typeof document === 'undefined' || !('fonts' in document)) return true;
  const font = getFontById(fontId);
  const { cssFontPrefix } = resolveFontCssDescriptor(font, bold, italic);
  try {
    return document.fonts.check(`${cssFontPrefix} 32px "${font.family}"`);
  } catch {
    return true;
  }
}

function ensureStylesheetLoaded(font: StudioFont): Promise<void> {
  const linkId = `gfont-${font.id}`;
  const existingTask = stylesheetPromises.get(linkId);
  if (existingTask) return existingTask;

  const task = new Promise<void>((resolve) => {
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (link && link.sheet) {
      resolve();
      return;
    }
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;
      document.head.appendChild(link);
    }
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => resolve(), { once: true });
    setTimeout(resolve, 2500);
  });

  stylesheetPromises.set(linkId, task);
  return task;
}

export async function ensureFontLoaded(
  fontId: string,
  bold = true,
  italic = false,
): Promise<boolean> {
  if (typeof document === 'undefined') return true;
  const font = getFontById(fontId);
  const { cssFontPrefix } = resolveFontCssDescriptor(font, bold, italic);
  const key = `${font.id}:${cssFontPrefix}`;

  const existing = loadedFontPromises.get(key);
  if (existing) return existing;

  const task = (async () => {
    await ensureStylesheetLoaded(font);

    try {
      await Promise.race([
        Promise.all([
          document.fonts.load(`${cssFontPrefix} 48px "${font.family}"`),
          document.fonts.load(`normal ${font.defaultWeight} 48px "${font.family}"`),
        ]),
        new Promise((resolve) => setTimeout(resolve, 2800)),
      ]);
    } catch {
      // Ignore network/offline font fetch failures
    }

    return isFontReadyInBrowser(fontId, bold, italic);
  })();

  loadedFontPromises.set(key, task);
  return task;
}

export function preloadCategoryFonts(category: FontCategory): void {
  if (typeof document === 'undefined') return;
  const subset =
    category === 'all'
      ? STUDIO_FONTS.slice(0, 16)
      : STUDIO_FONTS.filter((f) => f.category === category);
  for (const f of subset) {
    void ensureFontLoaded(f.id, f.supportsBold, false);
  }
}

export function hasTamilCharacters(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}
