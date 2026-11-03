// Pure UI grouping of the real, existing FONT_CATALOG (Step b's ported
// `fonts/catalog.js`) into the broader buckets the reference design shows
// (e.g. "Cursive / Script", "Bold & Block", "Retro & Fun"). This groups
// fonts that already exist — it does not add, rename, or invent any font.
export const FONT_UI_CATEGORIES = [
  { id: 'all', label: 'All Fonts', categories: null },
  { id: 'cursive-script', label: 'Cursive / Script', categories: ['Calligraphic', 'Handwritten'] },
  { id: 'bold-block', label: 'Bold & Block', categories: ['Chunky', 'Geometric'] },
  { id: 'retro-fun', label: 'Retro & Fun', categories: ['Playful', 'Decorative', 'Marker'] },
]

export function fontsForUiCategory(fonts, categoryId) {
  const bucket = FONT_UI_CATEGORIES.find((c) => c.id === categoryId)
  if (!bucket || !bucket.categories) return fonts
  return fonts.filter((font) => bucket.categories.includes(font.category))
}
