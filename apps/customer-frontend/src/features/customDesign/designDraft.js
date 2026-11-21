// Keeps the customer's in-progress design across the sign-in redirect. A draft
// is saved just before sending a signed-out customer to log in, restored when
// the customiser opens again, and cleared once the design is added to the cart
// (or the customer resets it). Drafts expire after 7 days.
//
// Reading is deliberately non-destructive so React StrictMode's double render
// in development can never lose a draft.

import {
  saveProductDraft,
  loadProductDraft,
  deleteProductDraft,
  sanitizeKeychainDraft,
} from '../customizerDraft/draftManager.js'

export function saveDraft(choices) {
  saveProductDraft('keychain', choices)
}

/** The saved choices, or null when there is none or it has expired. */
export function loadDraft() {
  const result = loadProductDraft('keychain')
  return result?.data || null
}

export function clearDraft() {
  deleteProductDraft('keychain')
}

/**
 * Keeps only the draft values that are still valid against the server's
 * current options, so a stale or hand-edited draft can never put the
 * customiser into an impossible state.
 */
export function restoreChoices(draft, options) {
  return sanitizeKeychainDraft(draft, options) || {}
}
