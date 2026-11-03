// Ported from Open Keychain (MIT) — src/domain/keychain/fonts/catalog.ts.
// Logic and the bundled font list unchanged (this is the "bundled" catalog —
// all entries are local .ttf files Giftora now serves from public/fonts/,
// matching the files + OFL licenses already present there). The separate
// Google Fonts live-API catalog (google-provider.ts) is intentionally not
// ported — see THIRD-PARTY-NOTICES.md and DEVELOPMENT_PROGRESS.md.
//
// This is a distinct, parallel catalog from the existing, simpler
// `geometry/fontCatalog.js` (2 fonts, used by the live Phase 5 customizer) —
// that file is untouched; this one serves the newly-ported keychain-builder
// engine once it's wired up.

/**
 * @typedef {'latin'|'cyrillic'} FontScript
 * @typedef {'Rounded'|'Geometric'|'Chunky'|'Condensed'|'Serif'|'Playful'|'Decorative'|'Handwritten'|'Calligraphic'|'Marker'} FontCategory
 * @typedef {'bundled'|'google'|'local'} FontSource
 * @typedef {'bundled'|'google-fonts'|'local-file'} FontProvider
 * @typedef {object} FontDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} file
 * @property {ArrayBuffer} [data]
 * @property {string} [dataRevision]
 * @property {string} previewFamily
 * @property {number} weight
 * @property {FontCategory} category
 * @property {readonly FontScript[]} scripts
 * @property {boolean} supportsArticulated
 * @property {number} [articulatedDilationMm]
 * @property {number} [minimumCyrillicWeightMm]
 * @property {number} [minimumFittedTextHeightMm]
 * @property {string} sampleLatin
 * @property {string} sampleCyrillic
 * @property {FontSource} source
 * @property {FontProvider} provider
 * @property {string} [specimenUrl]
 * @property {string} [licenseUrl]
 */

const latin = ['latin']
const latinCyrillic = ['latin', 'cyrillic']

export const FONT_CATEGORY_ORDER = ['Rounded', 'Geometric', 'Chunky', 'Condensed', 'Serif', 'Playful', 'Decorative', 'Handwritten', 'Calligraphic', 'Marker']

const BUNDLED_FONT_CATALOG = [
  { id: 'nunito', name: 'Nunito', file: '/fonts/nunito.ttf', previewFamily: 'OpenNunito', weight: 700, category: 'Rounded', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'quicksand', name: 'Quicksand', file: '/fonts/quicksand.ttf', previewFamily: 'OpenQuicksand', weight: 700, category: 'Geometric', scripts: latin, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'fredoka', name: 'Fredoka', file: '/fonts/fredoka.ttf', previewFamily: 'OpenFredoka', weight: 600, category: 'Chunky', scripts: latin, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'oswald', name: 'Oswald', file: '/fonts/oswald.ttf', previewFamily: 'OpenOswald', weight: 600, category: 'Condensed', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'bree-serif', name: 'Bree Serif', file: '/fonts/bree-serif.ttf', previewFamily: 'OpenBree', weight: 400, category: 'Serif', scripts: latin, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'baloo2', name: 'Baloo 2', file: '/fonts/baloo2.ttf', previewFamily: 'OpenBaloo', weight: 600, category: 'Playful', scripts: latin, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'kalam', name: 'Kalam', file: '/fonts/kalam.ttf', previewFamily: 'OpenKalam', weight: 700, category: 'Handwritten', scripts: latin, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'bungee', name: 'Bungee', file: '/fonts/bungee.ttf', previewFamily: 'OpenBungee', weight: 400, category: 'Decorative', scripts: latin, supportsArticulated: true, articulatedDilationMm: 0.55, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'rubik', name: 'Rubik Black', file: '/fonts/rubik.ttf', previewFamily: 'OpenRubik', weight: 900, category: 'Chunky', scripts: latinCyrillic, supportsArticulated: true, articulatedDilationMm: 1.6, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'montserrat', name: 'Montserrat Black', file: '/fonts/montserrat.ttf', previewFamily: 'OpenMontserrat', weight: 900, category: 'Geometric', scripts: latinCyrillic, supportsArticulated: true, articulatedDilationMm: 1.6, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'caveat', name: 'Caveat', file: '/fonts/caveat.ttf', previewFamily: 'OpenCaveat', weight: 400, category: 'Calligraphic', scripts: latinCyrillic, supportsArticulated: false, minimumCyrillicWeightMm: 0.4, minimumFittedTextHeightMm: 18, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'marck-script', name: 'Marck Script', file: '/fonts/marck-script.ttf', previewFamily: 'OpenMarck', weight: 400, category: 'Calligraphic', scripts: latinCyrillic, supportsArticulated: false, minimumCyrillicWeightMm: 0.4, minimumFittedTextHeightMm: 18, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'bad-script', name: 'Bad Script', file: '/fonts/bad-script.ttf', previewFamily: 'OpenBadScript', weight: 400, category: 'Calligraphic', scripts: latinCyrillic, supportsArticulated: false, minimumCyrillicWeightMm: 0.4, minimumFittedTextHeightMm: 18, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'neucha', name: 'Neucha', file: '/fonts/neucha.ttf', previewFamily: 'OpenNeucha', weight: 400, category: 'Handwritten', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'amatic-sc', name: 'Amatic SC', file: '/fonts/amatic-sc.ttf', previewFamily: 'OpenAmatic', weight: 400, category: 'Marker', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'lobster', name: 'Lobster', file: '/fonts/lobster.ttf', previewFamily: 'OpenLobster', weight: 400, category: 'Calligraphic', scripts: latinCyrillic, supportsArticulated: false, minimumCyrillicWeightMm: 0.4, minimumFittedTextHeightMm: 18, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'pangolin', name: 'Pangolin', file: '/fonts/pangolin.ttf', previewFamily: 'OpenPangolin', weight: 400, category: 'Handwritten', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'playpen-sans', name: 'Playpen Sans', file: '/fonts/playpen-sans.ttf', previewFamily: 'OpenPlaypen', weight: 500, category: 'Handwritten', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'shantell-sans', name: 'Shantell Sans', file: '/fonts/shantell-sans.ttf', previewFamily: 'OpenShantell', weight: 500, category: 'Handwritten', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'balsamiq-sans', name: 'Balsamiq Sans', file: '/fonts/balsamiq-sans.ttf', previewFamily: 'OpenBalsamiq', weight: 400, category: 'Handwritten', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'comforter', name: 'Comforter', file: '/fonts/comforter.ttf', previewFamily: 'OpenComforter', weight: 400, category: 'Calligraphic', scripts: latinCyrillic, supportsArticulated: false, minimumCyrillicWeightMm: 0.4, minimumFittedTextHeightMm: 18, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'comforter-brush', name: 'Comforter Brush', file: '/fonts/comforter-brush.ttf', previewFamily: 'OpenComforterBrush', weight: 400, category: 'Calligraphic', scripts: latinCyrillic, supportsArticulated: false, minimumCyrillicWeightMm: 0.4, minimumFittedTextHeightMm: 18, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
  { id: 'underdog', name: 'Underdog', file: '/fonts/underdog.ttf', previewFamily: 'OpenUnderdog', weight: 400, category: 'Marker', scripts: latinCyrillic, supportsArticulated: false, sampleLatin: 'ALEX', sampleCyrillic: 'АБВГ' },
]

/** @type {FontDefinition[]} */
export const FONT_CATALOG = BUNDLED_FONT_CATALOG.map((font) => ({ ...font, source: 'bundled', provider: 'bundled' }))
export const FONT_BY_ID = new Map(FONT_CATALOG.map((font) => [font.id, font]))

/** @param {string} id @returns {FontDefinition} */
export function fontDefinition(id) {
  return FONT_BY_ID.get(id) ?? FONT_CATALOG[0]
}

/** @param {string} text @returns {boolean} */
export function textUsesCyrillic(text) {
  return /\p{Script=Cyrillic}/u.test(text)
}

/** @param {FontDefinition} font @param {string} text @returns {boolean} */
export function fontSupportsText(font, text) {
  return !textUsesCyrillic(text) || font.scripts.includes('cyrillic')
}

/** @param {FontDefinition} font @param {string} text @returns {boolean} */
export function fontSupportsArticulatedName(font, text) {
  return font.supportsArticulated && fontSupportsText(font, text)
}

/** @param {FontDefinition} font @param {string} text @param {number} requestedWeightMm @returns {number} */
export function effectiveFontWeightMm(font, text, requestedWeightMm) {
  const minimumWeightMm = textUsesCyrillic(text) ? (font.minimumCyrillicWeightMm ?? 0) : 0
  return Math.max(requestedWeightMm, minimumWeightMm)
}

/** @param {string} text @returns {FontDefinition} */
export function articulatedFallbackFont(text) {
  return FONT_CATALOG.find((font) => fontSupportsArticulatedName(font, text)) ?? FONT_CATALOG[0]
}
