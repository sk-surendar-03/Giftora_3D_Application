import React, { useState } from 'react'

/**
 * Reusable Draft Controls Bar component for Giftora 3D Customizers.
 * Displays:
 * - Realtime saved status & relative timestamp
 * - "Save Draft" button
 * - "Restore Draft" button (with safe confirmation if active design is customized)
 * - "Delete Draft" button
 */
export default function DraftControlsBar({
  hasDraft,
  savedAt,
  saveStatus,
  onSave,
  onRestore,
  onDelete,
  productLabel = 'Design',
}) {
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Relative time helper
  function formatRelativeTime(timestamp) {
    if (!timestamp) return null
    const diffSec = Math.floor((Date.now() - timestamp) / 1000)
    if (diffSec < 10) return 'just now'
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}h ago`
    return `${Math.floor(diffHour / 24)}d ago`
  }

  const timeLabel = formatRelativeTime(savedAt)

  return (
    <div className="rounded-card border border-line bg-surface/80 p-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Status indicator */}
        <div className="flex items-center gap-2 text-[12px]">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              saveStatus === 'saving'
                ? 'bg-amber-400 animate-ping'
                : hasDraft
                ? 'bg-emerald-500'
                : 'bg-muted/40'
            }`}
          />
          <span className="font-medium text-main">
            {saveStatus === 'saving'
              ? 'Saving draft...'
              : hasDraft
              ? `Draft auto-saved ${timeLabel ? `(${timeLabel})` : ''}`
              : 'No saved draft'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Manual Save */}
          <button
            type="button"
            onClick={onSave}
            title="Force save current customization as draft"
            className="inline-flex items-center gap-1 rounded-control border border-line bg-alt/60 px-2.5 py-1 text-[11.5px] font-semibold text-main hover:bg-alt hover:text-accent transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save
          </button>

          {/* Restore with confirmation */}
          {hasDraft && (
            <>
              {confirmRestore ? (
                <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  <span className="text-[11px] text-amber-500 font-medium">Replace current?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmRestore(false)
                      onRestore?.()
                    }}
                    className="text-[11px] font-bold text-emerald-500 hover:underline cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRestore(false)}
                    className="text-[11px] text-muted hover:underline cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRestore(true)}
                  title={`Restore saved ${productLabel} draft`}
                  className="inline-flex items-center gap-1 rounded-control border border-line bg-alt/60 px-2.5 py-1 text-[11.5px] font-semibold text-main hover:border-accent hover:text-accent transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Restore
                </button>
              )}
            </>
          )}

          {/* Delete Draft */}
          {hasDraft && (
            <>
              {confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-danger/10 px-2 py-0.5 rounded border border-danger/30">
                  <span className="text-[11px] text-danger font-medium">Delete?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete(false)
                      onDelete?.()
                    }}
                    className="text-[11px] font-bold text-danger hover:underline cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-[11px] text-muted hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  title="Delete saved draft"
                  className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-[11.5px] font-medium text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Discard
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
