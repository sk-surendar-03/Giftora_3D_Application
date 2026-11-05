// Keeps the customer's in-progress design across the sign-in redirect. A draft
// is saved just before sending a signed-out customer to log in, restored when
// the customiser opens again, and cleared once the design is added to the cart
// (or the customer resets it). Drafts expire after 24 hours.
//
// Reading is deliberately non-destructive so React StrictMode's double render
// in development can never lose a draft.

const KEY = 'giftora_custom_design_draft'
const MAX_AGE_MS = 24 * 60 * 60 * 1000
const VERSION = 1

export function saveDraft(choices) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, savedAt: Date.now(), choices }))
  } catch {
    // Storage unavailable (private mode, quota): the design just isn't preserved.
  }
}

/** The saved choices, or null when there is none or it has expired. */
export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (draft?.v !== VERSION || typeof draft.savedAt !== 'number' || Date.now() - draft.savedAt > MAX_AGE_MS) return null
    return draft.choices && typeof draft.choices === 'object' ? draft.choices : null
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

const isString = (value) => typeof value === 'string'

/**
 * Keeps only the draft values that are still valid against the server's
 * current options, so a stale or hand-edited draft can never put the
 * customiser into an impossible state.
 */
export function restoreChoices(draft, options) {
  if (!draft || !options) return {}
  const template = options.templates.find((t) => t.id === draft.templateId)
  const restored = {}
  if (template) {
    restored.templateId = template.id
    if (template.styles.includes(draft.styleId)) restored.styleId = draft.styleId
    if (template.materials.includes(draft.material)) restored.material = draft.material
    if (template.sizes.includes(draft.size)) restored.size = draft.size
    if (template.supportsKeyring && options.keyringPositions.includes(draft.keyringPosition)) restored.keyringPosition = draft.keyringPosition
  }
  const maxLength = options.maxTextLength
  if (isString(draft.text) && [...draft.text].length <= maxLength) restored.text = draft.text
  if (isString(draft.subtitle) && [...draft.subtitle].length <= maxLength) restored.subtitle = draft.subtitle
  if (options.fonts.some((font) => font.id === draft.fontId)) restored.fontId = draft.fontId
  if (options.thicknesses.some((t) => t.id === draft.thickness)) restored.thickness = draft.thickness
  if (Number.isInteger(draft.quantity) && draft.quantity >= 1 && draft.quantity <= 10) restored.quantity = draft.quantity
  if (typeof draft.allowDisconnected === 'boolean') restored.allowDisconnected = draft.allowDisconnected
  if (draft.color && isString(draft.color.hex)) restored.color = { hex: draft.color.hex }
  if (draft.textColor && isString(draft.textColor.hex)) restored.textColor = { hex: draft.textColor.hex }
  return restored
}
