import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ICON_CATALOG, searchIcons } from '../../features/customiser/geometry/icons/iconCatalog'

const PREVIEW_FAMILY = 'GiftoraIconPreview'
let previewFontPromise

// Previews use the same bundled symbol font the 3D engine prints from, so the
// grid shows the real monochrome shapes (not the OS colour emoji).
function ensurePreviewFont() {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return Promise.resolve()
  if (!previewFontPromise) {
    previewFontPromise = new FontFace(PREVIEW_FAMILY, 'url(/fonts/noto-emoji.ttf)')
      .load()
      .then((face) => {
        document.fonts.add(face)
      })
      .catch(() => {
        previewFontPromise = undefined
      })
  }
  return previewFontPromise
}

/**
 * Searchable printable-icon picker for the Name field. `onPick(char)` is called
 * with the chosen icon; the parent decides where to insert it. Presentation
 * only: it never touches the geometry engine.
 */
export default function IconPicker({ onPick, onOpen, disabled = false, disabledReason = '' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const panelId = useId()
  const icons = useMemo(() => searchIcons(query), [query])

  useEffect(() => {
    if (!open) return undefined
    ensurePreviewFont()
    searchRef.current?.focus()
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggle() {
    if (disabled) return
    if (!open) {
      setQuery('')
      onOpen?.()
    }
    setOpen((value) => !value)
  }

  function choose(icon) {
    onPick(icon.char)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggle}
        disabled={disabled}
        title={disabled ? disabledReason : 'Insert an icon'}
        aria-label="Insert an icon into the name"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={`inline-flex h-[46px] w-[46px] items-center justify-center rounded-control border bg-surface transition-colors ${
          disabled
            ? 'cursor-not-allowed border-line text-muted opacity-50'
            : open
              ? 'cursor-pointer border-accent bg-soft text-accent'
              : 'cursor-pointer border-line text-ink hover:border-accent/60 hover:text-accent'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 14.2c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2" />
          <path d="M9 9.5h.01M15 9.5h.01" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose an icon"
          className="absolute right-0 z-30 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-control border border-line bg-surface p-3 shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
        >
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search icons (paw, heart, crown…)"
            aria-label="Search icons"
            className="block h-[38px] w-full rounded-control border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="mt-2 max-h-[236px] overflow-y-auto pr-0.5">
            {icons.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-muted">No icons match “{query}”.</p>
            ) : (
              <ul className="grid grid-cols-4 gap-1.5 min-[761px]:grid-cols-5" role="list">
                {icons.map((icon) => (
                  <li key={icon.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(icon)}
                      title={icon.name}
                      aria-label={`Insert ${icon.name}`}
                      className="group flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-[4px] border border-line bg-surface px-1 py-1.5 transition-colors hover:border-accent/60 hover:bg-soft focus:border-accent focus:outline-none"
                    >
                      <span className="text-[24px] leading-none text-ink group-hover:text-accent" style={{ fontFamily: `${PREVIEW_FAMILY}, sans-serif` }} aria-hidden="true">
                        {icon.char}
                      </span>
                      <span className="w-full truncate text-center text-[10px] text-muted">{icon.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-2 text-[10.5px] leading-snug text-muted">
            Icons are printed in relief like letters and count as one character each. {ICON_CATALOG.length} icons available.
          </p>
        </div>
      )}
    </div>
  )
}
