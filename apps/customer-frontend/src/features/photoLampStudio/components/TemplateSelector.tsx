import React from 'react';
import { LampShapeType } from '../types/lithophane';
import {
  Cylinder,
  Square,
  Box,
  Heart,
  Moon,
  Hexagon,
  Smile,
  Circle,
  RotateCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface TemplateOption {
  id: LampShapeType;
  title: string;
  badge?: string;
  photosRequired: number;
  description: string;
  recommendedFor: string;
  icon: React.ElementType;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'cylinder',
    title: 'Cylindrical Photo Lamp',
    badge: 'Bestseller',
    photosRequired: 1,
    description: '360° panoramic curved lithophane with seamless wrap and printable LED base.',
    recommendedFor: 'Couples, sunsets, panoramic memories & desk ambient lights',
    icon: Cylinder,
  },
  {
    id: 'rectangle',
    title: 'Rectangular Photo Light Box',
    badge: 'Classic',
    photosRequired: 1,
    description: 'Flat upright lithophane panel mounted inside a modern printable backlit frame.',
    recommendedFor: 'Portraits, family group pictures, baby milestones & gallery walls',
    icon: Square,
  },
  {
    id: 'four_sided',
    title: 'Four-Sided Memory Lamp',
    badge: 'Multi-Photo',
    photosRequired: 4,
    description: 'Cube pillar lamp featuring four distinct customized photos and interlocking frame.',
    recommendedFor: 'Full family albums, 4-stage relationship milestones & birthdays',
    icon: Box,
  },
  {
    id: 'heart',
    title: 'Heart-Shaped Photo Lamp',
    badge: 'Romantic',
    photosRequired: 1,
    description: 'Romantic heart contour lithophane with custom engraved names and anniversary base.',
    recommendedFor: 'Valentine, wedding gifts, proposals & anniversary celebrations',
    icon: Heart,
  },
  {
    id: 'curved',
    title: 'Curved Portrait Lamp',
    badge: 'Trending',
    photosRequired: 1,
    description: 'Gently curved 110° arc standing upright with weighted modern base.',
    recommendedFor: 'Solo portraits, graduation, pet tributes & bedside tables',
    icon: Smile,
  },
  {
    id: 'moon',
    title: 'Moon Photo Lamp',
    badge: 'Celestial',
    photosRequired: 1,
    description: 'Spherical lunar lithophane blending real lunar crater textures with your memory.',
    recommendedFor: 'Baby night lights, stargazers, celestial gifts & dreamers',
    icon: Moon,
  },
  {
    id: 'hexagonal',
    title: 'Hexagonal Memory Lantern',
    badge: '6 Photos',
    photosRequired: 6,
    description: 'Traditional lantern housing holding six glowing memory panels with top lid.',
    recommendedFor: 'Festivals (Diwali/Christmas), large families & heritage tributes',
    icon: Hexagon,
  },
  {
    id: 'circular',
    title: 'Circular Medallion Lamp',
    badge: 'Modern Art',
    photosRequired: 1,
    description: 'Round medallion lithophane set in a circular decorative bezel ring and stand.',
    recommendedFor: 'Close-up pet portraits, round logos, baby faces & medal gifts',
    icon: Circle,
  },
  {
    id: 'rotating',
    title: 'Rotating Photo Lamp',
    badge: 'Motor Ready',
    photosRequired: 3,
    description: 'Multi-panel carousel with internal shaft housing for optional 5V rotating turntable motor.',
    recommendedFor: 'Showcase tables, store displays & active kinetic makers',
    icon: RotateCw,
  },
];

interface TemplateSelectorProps {
  selectedShape: LampShapeType;
  onSelectShape: (shape: LampShapeType) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedShape,
  onSelectShape,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            1. Select Lamp Template
          </h3>
          <p className="text-xs text-stone-400">
            Choose your lamp geometry. Every template generates watertight, 3D-printable files.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {TEMPLATES.map((tmpl) => {
          const isSelected = selectedShape === tmpl.id;
          const Icon = tmpl.icon;
          return (
            <div
              key={tmpl.id}
              onClick={() => onSelectShape(tmpl.id)}
              className={`relative p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
              }`}
            >
              {/* Badge */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {tmpl.title}
                    </h4>
                    <span className="text-[10px] text-stone-400">
                      {tmpl.photosRequired === 1
                        ? '1 Photo Panel'
                        : `${tmpl.photosRequired} Photo Panels`}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                ) : tmpl.badge ? (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-stone-700">
                    {tmpl.badge}
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-stone-400 line-clamp-2 mb-2">
                {tmpl.description}
              </p>

              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                <span className="text-stone-500">Best for:</span>
                <span className="text-amber-200/90 font-medium truncate max-w-[170px]">
                  {tmpl.recommendedFor}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
