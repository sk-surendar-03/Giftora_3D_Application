import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StudioPage } from '../features/standStudio/pages/StudioPage'
import { createDefaultDesign } from '../features/standStudio/core/defaults'
import { loadSavedDesigns } from '../features/standStudio/core/storage'

export default function StandCustomiser() {
  const [design, setDesign] = useState(() => createDefaultDesign('combined', 'minimalist'))
  const [, setSaved] = useState(() => loadSavedDesigns())

  return (
    <div className="bg-paper text-ink">
      {/* Studio switcher */}
      <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-4 flex gap-3">
        <Link
          to="/customise"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Name Keychain
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent/10 px-4 py-1.5 text-[13px] font-semibold text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="14" width="8" height="8" rx="1" />
            <path d="M10 18h4M14 14h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6" />
            <path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
          </svg>
          Phone & Pen Stand
        </span>
      </div>

      {/* Studio workspace — dark theme matches Giftora's dark palette */}
      <div className="[color-scheme:dark]">
        <StudioPage
          design={design}
          darkMode={true}
          onUpdateDesign={setDesign}
          onToggleTheme={() => {}}
          onNavigateSaved={() => {}}
          onSavedListChange={() => setSaved(loadSavedDesigns())}
        />
      </div>
    </div>
  )
}
