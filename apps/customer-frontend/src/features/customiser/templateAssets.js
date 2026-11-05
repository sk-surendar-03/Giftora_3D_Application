export const TEMPLATE_PREVIEWS = {
  'name-keychain': '/showcase/templates/name-keychain.png',
  'articulated-name': '/showcase/templates/articulated-name.png',
  nameplate: '/showcase/templates/nameplate.png',
  'plant-label': '/showcase/templates/plant-label.png',
  magnet: '/showcase/templates/magnet.png',
}

export const STYLE_PREVIEWS = {
  'name-keychain': {
    contour: '/showcase/styles/name-keychain-contour.png',
    capsule: '/showcase/styles/name-keychain-capsule.png',
    'soft-tag': '/showcase/styles/name-keychain-soft-tag.png',
    bubble: '/showcase/styles/name-keychain-bubble.png',
    arch: '/showcase/styles/name-keychain-arch.png',
    'heart-split': '/showcase/styles/name-keychain-heart-split.png',
  },
  'plant-label': {
    contour: '/showcase/styles/plant-label-contour.png',
    capsule: '/showcase/styles/plant-label-capsule.png',
    'soft-tag': '/showcase/styles/plant-label-soft-tag.png',
    bubble: '/showcase/styles/plant-label-bubble.png',
    arch: '/showcase/styles/plant-label-arch.png',
  },
  magnet: {
    plain: '/showcase/templates/magnet.png',
    contour: '/showcase/styles/magnet-contour.png',
    capsule: '/showcase/styles/magnet-capsule.png',
    'soft-tag': '/showcase/styles/magnet-soft-tag.png',
    bubble: '/showcase/styles/magnet-bubble.png',
    arch: '/showcase/styles/magnet-arch.png',
    ribbon: '/showcase/styles/magnet-ribbon.png',
  },
}

export function getStylePreview(templateId, styleId) {
  return STYLE_PREVIEWS[templateId]?.[styleId] ?? TEMPLATE_PREVIEWS[templateId]
}
