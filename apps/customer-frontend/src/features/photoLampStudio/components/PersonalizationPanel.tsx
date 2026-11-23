import React from 'react';
import {
  PersonalizationSettings,
  PersonalizationTheme,
} from '../types/lithophane';
import {
  Heart,
  Sparkles,
  Calendar,
  Gift,
  Smile,
  Flame,
  TreePine,
  Feather,
} from 'lucide-react';

interface PersonalizationPanelProps {
  personalization: PersonalizationSettings;
  onChangePersonalization: (updated: Partial<PersonalizationSettings>) => void;
}

const THEME_PRESETS: {
  id: PersonalizationTheme;
  title: string;
  defaultTitle: string;
  defaultSubtitle: string;
  icon: React.ElementType;
}[] = [
  { id: 'romantic', title: 'Romantic Love', defaultTitle: 'Forever & Always', defaultSubtitle: 'You & Me', icon: Heart },
  { id: 'wedding', title: 'Wedding Memories', defaultTitle: 'Mr. & Mrs.', defaultSubtitle: 'Best Day Ever', icon: Sparkles },
  { id: 'anniversary', title: 'Anniversary Gift', defaultTitle: 'Happy Anniversary', defaultSubtitle: 'Growing in love each day', icon: Calendar },
  { id: 'birthday', title: 'Birthday Surprise', defaultTitle: 'Happy Birthday!', defaultSubtitle: 'Wishing you endless joy', icon: Gift },
  { id: 'family', title: 'Family Memories', defaultTitle: 'The Family', defaultSubtitle: 'Where life begins & love never ends', icon: Smile },
  { id: 'baby', title: 'Baby Milestones', defaultTitle: 'Welcome Little One', defaultSubtitle: 'Sweetest Blessing', icon: Feather },
  { id: 'pet', title: 'Beloved Pet', defaultTitle: 'Forever in our Hearts', defaultSubtitle: 'Paws & Purrs', icon: Smile },
  { id: 'memorial', title: 'In Loving Memory', defaultTitle: 'Always Remembered', defaultSubtitle: 'Forever in our thoughts', icon: Sparkles },
  { id: 'diwali', title: 'Diwali Celebration', defaultTitle: 'Shubh Deepavali', defaultSubtitle: 'May your life glow with joy', icon: Flame },
  { id: 'christmas', title: 'Christmas Glow', defaultTitle: 'Merry Christmas', defaultSubtitle: 'Peace, joy & light', icon: TreePine },
  { id: 'minimal', title: 'Minimal Modern', defaultTitle: 'Custom Memory', defaultSubtitle: '', icon: Sparkles },
];

export const PersonalizationPanel: React.FC<PersonalizationPanelProps> = ({
  personalization,
  onChangePersonalization,
}) => {
  const handleSelectTheme = (theme: PersonalizationTheme) => {
    const preset = THEME_PRESETS.find((p) => p.id === theme);
    if (!preset) return;
    onChangePersonalization({
      theme,
      titleText: preset.defaultTitle,
      subtitleText: preset.defaultSubtitle,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Personalized Text & Themed Styling
        </h3>
        <p className="text-xs text-stone-400">
          Add custom engraved dates, names, or quotes on the lamp housing or base plaque.
        </p>
      </div>

      {/* Theme Presets */}
      <div>
        <label className="text-xs font-semibold text-stone-300 mb-2 block">
          Select Gifting Occasion Preset
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {THEME_PRESETS.map((p) => {
            const isSelected = personalization.theme === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectTheme(p.id)}
                className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{p.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Fields */}
      <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">
              Main Name / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Alex & Maya"
              value={personalization.titleText}
              onChange={(e) =>
                onChangePersonalization({ titleText: e.target.value })
              }
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">
              Anniversary Date / Subtitle
            </label>
            <input
              type="text"
              placeholder="e.g. 15th October 2024"
              value={personalization.dateText}
              onChange={(e) =>
                onChangePersonalization({ dateText: e.target.value })
              }
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-300 mb-1 block">
            Special Quote or Message
          </label>
          <input
            type="text"
            placeholder="e.g. You are my sunshine today and forever"
            value={personalization.subtitleText}
            onChange={(e) =>
              onChangePersonalization({ subtitleText: e.target.value })
            }
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Font Selection & Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-800">
          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">
              Typography Font
            </label>
            <select
              value={personalization.fontFamily}
              onChange={(e) =>
                onChangePersonalization({ fontFamily: e.target.value as any })
              }
              className="w-full bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="serif">Playfair Serif (Luxury & Romance)</option>
              <option value="sans">Modern Sans (Clean & Contemporary)</option>
              <option value="script">Script Calligraphy (Celebrations)</option>
              <option value="mono">JetBrains Mono (Maker / Tech)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">
              Engraving Profile
            </label>
            <select
              value={personalization.textStyle}
              onChange={(e) =>
                onChangePersonalization({ textStyle: e.target.value as any })
              }
              className="w-full bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="engraved">Engraved Inward (-0.8mm depth)</option>
              <option value="embossed">Embossed Raised (+0.8mm height)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">
              Decorative Accent Icon
            </label>
            <select
              value={personalization.decorativeIcon}
              onChange={(e) =>
                onChangePersonalization({ decorativeIcon: e.target.value as any })
              }
              className="w-full bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="none">None</option>
              <option value="heart">Heart (❤)</option>
              <option value="star">Star (★)</option>
              <option value="rings">Wedding Rings (💍)</option>
              <option value="flower">Floral Motif (✿)</option>
              <option value="sparkle">Sparkle (✨)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
