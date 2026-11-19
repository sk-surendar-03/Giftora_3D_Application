import React from 'react'
import { CameraViewPreset, CameraProjection } from '../core/types'

interface ViewportControlsBarProps {
  cameraPreset: CameraViewPreset
  onPresetChange: (preset: CameraViewPreset) => void
  projection: CameraProjection
  onProjectionChange: (proj: CameraProjection) => void
  showBuildPlate: boolean
  onToggleBuildPlate: () => void
  explodedPreview: boolean
  onToggleExploded: () => void
}

export const ViewportControlsBar: React.FC<ViewportControlsBarProps> = ({
  cameraPreset,
  onPresetChange,
  projection,
  onProjectionChange,
  showBuildPlate,
  onToggleBuildPlate,
  explodedPreview,
  onToggleExploded,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-surface px-3 py-2 text-xs">
      <div className="flex items-center gap-1">
        <span className="text-muted font-medium mr-1 text-[11px] uppercase tracking-wider">View:</span>
        {(['isometric', 'front', 'top', 'side'] as CameraViewPreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPresetChange(p)}
            className={`rounded-control px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors ${
              cameraPreset === p
                ? 'bg-accent text-surface font-semibold'
                : 'text-muted hover:bg-alt hover:text-ink'
            }`}
          >
            {p === 'isometric' ? 'Iso' : p}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onProjectionChange(projection === 'perspective' ? 'orthographic' : 'perspective')}
          className="rounded-control border border-line px-2 py-1 text-[11px] text-muted hover:text-ink hover:bg-alt transition-colors"
          title="Toggle camera projection"
        >
          {projection === 'perspective' ? 'Persp' : 'Ortho'}
        </button>

        <button
          type="button"
          onClick={onToggleBuildPlate}
          className={`rounded-control border border-line px-2 py-1 text-[11px] transition-colors ${
            showBuildPlate ? 'text-accent border-accent/40 bg-accent/5' : 'text-muted hover:text-ink'
          }`}
          title="Toggle printer buildplate grid"
        >
          Grid
        </button>

        <button
          type="button"
          onClick={onToggleExploded}
          className={`rounded-control border border-line px-2 py-1 text-[11px] transition-colors ${
            explodedPreview ? 'text-accent border-accent/40 bg-accent/5 font-semibold' : 'text-muted hover:text-ink'
          }`}
          title="Toggle exploded layers view"
        >
          Explode
        </button>
      </div>
    </div>
  )
}
