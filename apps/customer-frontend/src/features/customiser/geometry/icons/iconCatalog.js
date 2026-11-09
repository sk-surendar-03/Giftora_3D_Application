// Curated printable icons for the Name field. Every entry is a monochrome
// outline from the bundled Noto Emoji symbol font (SIL OFL 1.1, see
// public/fonts/licenses/noto-emoji.txt). Characters are plain single code points
// (no variation selector, ZWJ or skin-tone modifier) so they behave like any
// other character in the name: one code point, one billable character.

/** @typedef {{ id: string, name: string, char: string, keywords: string[] }} PrintableIcon */

/** @type {PrintableIcon[]} */
export const ICON_CATALOG = [
  { id: 'heart', name: 'Heart', char: '♥', keywords: ['love', 'valentine'] },
  { id: 'sparkling-heart', name: 'Sparkling heart', char: '\u{1F496}', keywords: ['love', 'heart'] },
  { id: 'paw', name: 'Paw prints', char: '\u{1F43E}', keywords: ['pet', 'dog', 'cat', 'animal', 'print'] },
  { id: 'star', name: 'Star', char: '⭐', keywords: ['favorite', 'night'] },
  { id: 'glowing-star', name: 'Glowing star', char: '\u{1F31F}', keywords: ['star', 'shine'] },
  { id: 'sparkles', name: 'Sparkles', char: '✨', keywords: ['shine', 'magic', 'glitter'] },
  { id: 'leaf', name: 'Leaf', char: '\u{1F33F}', keywords: ['plant', 'herb', 'nature', 'green'] },
  { id: 'maple-leaf', name: 'Maple leaf', char: '\u{1F341}', keywords: ['leaf', 'autumn', 'canada'] },
  { id: 'leaf-wind', name: 'Leaves in wind', char: '\u{1F343}', keywords: ['leaf', 'nature', 'breeze'] },
  { id: 'clover', name: 'Four-leaf clover', char: '\u{1F340}', keywords: ['luck', 'lucky', 'leaf'] },
  { id: 'cherry-blossom', name: 'Cherry blossom', char: '\u{1F338}', keywords: ['flower', 'spring'] },
  { id: 'tulip', name: 'Tulip', char: '\u{1F337}', keywords: ['flower', 'spring'] },
  { id: 'sunflower', name: 'Sunflower', char: '\u{1F33B}', keywords: ['flower', 'sun'] },
  { id: 'crown', name: 'Crown', char: '\u{1F451}', keywords: ['king', 'queen', 'royal', 'princess'] },
  { id: 'gem', name: 'Gem', char: '\u{1F48E}', keywords: ['diamond', 'jewel'] },
  { id: 'moon', name: 'Crescent moon', char: '\u{1F319}', keywords: ['night', 'sleep'] },
  { id: 'sun', name: 'Sun', char: '☀', keywords: ['sunny', 'summer', 'day'] },
  { id: 'rainbow', name: 'Rainbow', char: '\u{1F308}', keywords: ['pride', 'color'] },
  { id: 'butterfly', name: 'Butterfly', char: '\u{1F98B}', keywords: ['insect', 'nature'] },
  { id: 'bee', name: 'Bee', char: '\u{1F41D}', keywords: ['honey', 'insect'] },
  { id: 'dog', name: 'Dog', char: '\u{1F436}', keywords: ['pet', 'puppy', 'animal'] },
  { id: 'cat', name: 'Cat', char: '\u{1F431}', keywords: ['pet', 'kitten', 'animal'] },
  { id: 'bone', name: 'Bone', char: '\u{1F9B4}', keywords: ['dog', 'pet'] },
  { id: 'fish', name: 'Fish', char: '\u{1F41F}', keywords: ['sea', 'animal'] },
  { id: 'rabbit', name: 'Rabbit', char: '\u{1F430}', keywords: ['bunny', 'animal'] },
  { id: 'bear', name: 'Bear', char: '\u{1F43B}', keywords: ['teddy', 'animal'] },
  { id: 'unicorn', name: 'Unicorn', char: '\u{1F984}', keywords: ['magic', 'horse'] },
  { id: 'music', name: 'Music note', char: '\u{1F3B5}', keywords: ['song', 'sound'] },
  { id: 'gift', name: 'Gift', char: '\u{1F381}', keywords: ['present', 'birthday'] },
  { id: 'balloon', name: 'Balloon', char: '\u{1F388}', keywords: ['party', 'birthday'] },
  { id: 'ribbon', name: 'Ribbon', char: '\u{1F380}', keywords: ['bow', 'gift'] },
  { id: 'cake', name: 'Cake', char: '\u{1F382}', keywords: ['birthday', 'party'] },
  { id: 'fire', name: 'Fire', char: '\u{1F525}', keywords: ['flame', 'hot'] },
  { id: 'lightning', name: 'Lightning', char: '⚡', keywords: ['bolt', 'power', 'electric'] },
  { id: 'anchor', name: 'Anchor', char: '⚓', keywords: ['sea', 'ship'] },
  { id: 'key', name: 'Key', char: '\u{1F511}', keywords: ['lock', 'home'] },
  { id: 'home', name: 'Home', char: '\u{1F3E0}', keywords: ['house'] },
  { id: 'football', name: 'Football', char: '⚽', keywords: ['soccer', 'sport', 'ball'] },
  { id: 'rocket', name: 'Rocket', char: '\u{1F680}', keywords: ['space', 'launch'] },
]

const ICON_CHAR_SET = new Set(ICON_CATALOG.map((icon) => icon.char))

/** True when the character is one of the curated printable icons. */
export function isPrintableIcon(character) {
  return ICON_CHAR_SET.has(character)
}

/** Case-insensitive search over icon names and keywords; empty query returns everything. */
export function searchIcons(query) {
  const needle = (query ?? '').trim().toLowerCase()
  if (!needle) return ICON_CATALOG
  return ICON_CATALOG.filter((icon) => icon.name.toLowerCase().includes(needle) || icon.keywords.some((keyword) => keyword.includes(needle)))
}

// Emoji/text presentation selectors, zero-width joiner and skin-tone
// modifiers. Printable icons are single code points, so these never carry
// meaning here and would only create glyphs the fonts cannot draw.
const UNSUPPORTED_EMOJI_CONTROLS = /︎|️|‍|\u{1F3FB}|\u{1F3FC}|\u{1F3FD}|\u{1F3FE}|\u{1F3FF}/gu

/**
 * Removes variation selectors, ZWJ and skin-tone modifiers. Leaves all other text untouched.
 * The one rewrite: the emoji-keyboard red heart (U+2764 + U+FE0F) becomes the catalog heart
 * (U+2665). A bare U+2764 is left alone, so existing text in fonts that draw it is unchanged.
 */
export function stripEmojiControls(text) {
  if (typeof text !== 'string') return text
  return text.replace(/❤️/g, '♥').replace(UNSUPPORTED_EMOJI_CONTROLS, '')
}
