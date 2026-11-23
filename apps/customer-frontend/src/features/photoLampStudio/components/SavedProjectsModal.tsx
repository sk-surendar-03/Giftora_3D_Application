import React, { useRef } from 'react';
import { LithophaneProject } from '../types/lithophane';
import {
  FolderHeart,
  Save,
  Upload,
  Download,
  Trash2,
  FolderOpen,
  X,
  Sparkles,
} from 'lucide-react';
import { triggerFileDownload } from '../geometry/stlExporter';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: LithophaneProject[];
  currentProject: LithophaneProject;
  onSaveCurrentProject: (name?: string) => void;
  onLoadProject: (project: LithophaneProject) => void;
  onDeleteProject: (id: string) => void;
  onImportProject: (imported: LithophaneProject) => void;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  isOpen,
  onClose,
  savedProjects,
  currentProject,
  onSaveCurrentProject,
  onLoadProject,
  onDeleteProject,
  onImportProject,
}) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const importedProject = raw.project || raw;
        if (importedProject.shape && importedProject.printSettings) {
          onImportProject(importedProject);
          onClose();
        } else {
          alert('Invalid project JSON structure.');
        }
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Saved Lamp Designs
              </h3>
              <p className="text-xs text-stone-400">
                Manage your personalized projects, export backups, or resume editing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-stone-950/50 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => onSaveCurrentProject()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Current Lamp Design</span>
          </button>

          <div className="flex items-center gap-2">
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* List of Saved Projects */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {savedProjects.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-stone-600" />
              <p className="text-sm font-medium">No saved designs yet</p>
              <p className="text-xs text-stone-600">
                Click "Save Current Lamp Design" above to store your custom models locally.
              </p>
            </div>
          ) : (
            savedProjects.map((p) => {
              const dateStr = new Date(p.updatedAt || p.createdAt).toLocaleDateString();
              const isCurrent = p.id === currentProject.id;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">
                          {p.name}
                        </h4>
                        {isCurrent && (
                          <span className="text-[9px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">
                        {p.shape.replace('_', ' ')} • {p.printSettings.modelHeightMm}mm Height • Saved {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        onLoadProject(p);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all"
                    >
                      Load
                    </button>

                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(p, null, 2)], {
                          type: 'application/json',
                        });
                        triggerFileDownload(blob, `${p.name.replace(/\s+/g, '_')}.json`, 'application/json');
                      }}
                      title="Export JSON"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteProject(p.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
