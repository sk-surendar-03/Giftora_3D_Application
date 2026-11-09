// Pure helpers for the Name field so icon insertion and the character limit
// agree with the geometry engine and the server, which both count Unicode
// code points (an icon such as the paw is 1 character but 2 UTF-16 units,
// which is what `<input maxLength>` and `string.length` would count).

import { stripEmojiControls } from './iconCatalog.js'

/** Number of Unicode code points (what the engine and server limit). */
export function codePointLength(text) {
  return [...(text ?? '')].length
}

/** Truncates to at most `max` code points, never splitting a surrogate pair. */
export function limitCodePoints(text, max) {
  const points = [...(text ?? '')]
  return points.length <= max ? text : points.slice(0, max).join('')
}

/** Cleans raw user input (typed or pasted) for the Name field. */
export function sanitizeNameInput(raw, maxCodePoints) {
  return limitCodePoints(stripEmojiControls(raw ?? ''), maxCodePoints)
}

/**
 * Inserts `insertion` into `text`, replacing the selection [start, end)
 * (UTF-16 offsets, as the DOM reports them). Existing text before and after
 * is preserved. Returns the new text and the caret offset right after the
 * insertion, or `null` when it would exceed `maxCodePoints`.
 */
export function insertAtSelection(text, start, end, insertion, maxCodePoints) {
  const value = text ?? ''
  const from = Math.min(Math.max(0, start ?? value.length), value.length)
  const to = Math.min(Math.max(from, end ?? from), value.length)
  const next = value.slice(0, from) + insertion + value.slice(to)
  if (codePointLength(next) > maxCodePoints) return null
  return { text: next, caret: from + insertion.length }
}
