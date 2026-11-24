import React from 'react';
import {
  LithophaneProject,
  PhotoSlot,
} from '../types/lithophane';
import { TemplateSelector } from './TemplateSelector';
import { PhotoManager } from './PhotoManager';
import { PrintSettingsPanel } from './PrintSettingsPanel';
import { BaseCustomizer } from './BaseCustomizer';
import { PersonalizationPanel } from './PersonalizationPanel';
import { LightingPanel } from './LightingPanel';
import { loadImageElement } from '../geometry/imageProcessor';

interface PhotoLampStudioControlsProps {
  project: LithophaneProject;
  onChangeProject: (updated: Partial<LithophaneProject>) => void;
  onOpenEditorForIndex: (index: number) => void;
}

export const PhotoLampStudioControls: React.FC<PhotoLampStudioControlsProps> = ({
  project,
  onChangeProject,
  onOpenEditorForIndex,
}) => {
  const handleUpdatePhotoSlot = (index: number, updated: Partial<PhotoSlot>) => {
    const newPhotos = [...project.photos];
    newPhotos[index] = { ...newPhotos[index], ...updated };
    onChangeProject({ photos: newPhotos });
  };

  const handleLoadSamplePreset = async (dataUrl: string, title: string) => {
    try {
      const img = await loadImageElement(dataUrl);
      handleUpdatePhotoSlot(project.activePhotoIndex, {
        originalName: title,
        dataUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        isLowRes: false,
      });
    } catch (err) {
      console.warn('Could not load sample preset:', err);
    }
  };

  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface px-5 shadow-sm">
      {/* 1. Lamp Shape Archetype */}
      <section className="py-5 first:pt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
            1. Lamp Shape & Archetype
          </span>
          <span className="text-[11px] font-medium text-muted">
            9 3D printable designs
          </span>
        </div>
        <TemplateSelector
          selectedShape={project.shape}
          onSelectShape={(shape) => onChangeProject({ shape })}
        />
      </section>

      {/* 2. Photos & Adjustments */}
      <section className="py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
            2. Photos & Adjustments
          </span>
          <span className="text-[11px] font-medium text-muted">
            {project.photos.length} photo slot{project.photos.length === 1 ? '' : 's'}
          </span>
        </div>
        <PhotoManager
          photos={project.photos}
          activePhotoIndex={project.activePhotoIndex}
          shape={project.shape}
          onSelectActiveIndex={(idx) =>
            onChangeProject({ activePhotoIndex: idx })
          }
          onUpdatePhoto={handleUpdatePhotoSlot}
          onOpenEditorForIndex={onOpenEditorForIndex}
          onLoadPreset={handleLoadSamplePreset}
        />
      </section>

      {/* 3. LED Lighting & Glow */}
      <section className="py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
            3. LED Lighting & Glow
          </span>
          <span className="text-[11px] font-medium text-muted">
            {project.lighting.isOn ? 'Backlight Active' : 'Off'}
          </span>
        </div>
        <LightingPanel
          lighting={project.lighting}
          onChangeLighting={(lightingUpdate) =>
            onChangeProject({
              lighting: { ...project.lighting, ...lightingUpdate },
            })
          }
        />
      </section>

      {/* 4. Pedestal & Base */}
      <section className="py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
            4. Pedestal & Base
          </span>
          <span className="text-[11px] font-medium text-muted">
            {project.baseSettings.enabled ? 'USB Puck Cavity' : 'None'}
          </span>
        </div>
        <BaseCustomizer
          baseSettings={project.baseSettings}
          onChangeBaseSettings={(baseUpdate) =>
            onChangeProject({
              baseSettings: { ...project.baseSettings, ...baseUpdate },
            })
          }
        />
      </section>

      {/* 5. Dimensions & Thickness */}
      <section className="py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
            5. Dimensions & Thickness
          </span>
          <span className="text-[11px] font-medium text-muted font-mono">
            {project.printSettings.modelHeightMm}mm (H)
          </span>
        </div>
        <PrintSettingsPanel
          settings={project.printSettings}
          shape={project.shape}
          onChangeSettings={(settingsUpdate) =>
            onChangeProject({
              printSettings: { ...project.printSettings, ...settingsUpdate },
            })
          }
        />
      </section>

      {/* 6. Personalization & Engraving */}
      <section className="py-5 last:pb-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
            6. Personalization & Engraving
          </span>
          <span className="text-[11px] font-medium text-muted">
            Laser / embossed base text
          </span>
        </div>
        <PersonalizationPanel
          personalization={project.personalization}
          onChangePersonalization={(persUpdate) =>
            onChangeProject({
              personalization: { ...project.personalization, ...persUpdate },
            })
          }
        />
      </section>
    </div>
  );
};
