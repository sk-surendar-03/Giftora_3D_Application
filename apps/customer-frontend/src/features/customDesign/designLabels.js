import { fontDefinition } from '../customiser/geometry/fonts/catalog.js'

// Human-readable labels for the IDs stored in a custom design's parameters
// (used by the cart, checkout and order pages).
const TEMPLATE_LABELS = { 'name-keychain': 'Name keychain', 'articulated-name': 'Articulated name', nameplate: 'Nameplate' }
const STYLE_LABELS = {
  plain: 'Plain',
  contour: 'Contour',
  capsule: 'Capsule',
  'soft-tag': 'Soft tag',
  bubble: 'Bubble',
  arch: 'Arch',
  ribbon: 'Ribbon',
  'heart-split': 'Heart',
}
const THICKNESS_LABELS = { standard: 'Standard', premium: 'Premium' }
const KEYRING_LABELS = { left: 'Left', right: 'Right', top: 'Top', bottom: 'Bottom', 'top-left': 'Top left', 'top-right': 'Top right' }

/** Rows describing a design, for display. `colors` rows carry swatch hex values. */
export function describeDesign(params) {
  if (!params) return []
  let fontName = params.fontId
  try {
    fontName = fontDefinition(params.fontId)?.name ?? params.fontId
  } catch {
    // Unknown font id: show the raw id.
  }
  return [
    { label: 'Template', value: TEMPLATE_LABELS[params.templateId] ?? params.templateId },
    params.styleId && { label: 'Style', value: STYLE_LABELS[params.styleId] ?? params.styleId },
    { label: 'Text', value: params.text },
    params.subtitle && { label: 'Subtitle', value: params.subtitle },
    { label: 'Font', value: fontName },
    { label: 'Material', value: params.material },
    params.color && { label: 'Base colour', value: params.color.label, hex: params.color.hex },
    params.textColor && { label: 'Text colour', value: params.textColor.label, hex: params.textColor.hex },
    { label: 'Size', value: params.size },
    { label: 'Thickness', value: THICKNESS_LABELS[params.thickness] ?? params.thickness },
    params.keyringPosition && { label: 'Keyring', value: KEYRING_LABELS[params.keyringPosition] ?? params.keyringPosition },
  ].filter(Boolean)
}
