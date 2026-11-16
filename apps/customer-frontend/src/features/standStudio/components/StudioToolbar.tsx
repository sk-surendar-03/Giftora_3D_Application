import React from 'react';
import { Camera, Copy, Download, FolderOpen, Redo2, RotateCcw, Save, Share2, Shuffle, Undo2 } from 'lucide-react';

interface StudioToolbarProps {
  designName: string;
  canUndo: boolean;
  canRedo: boolean;
  canExport: boolean;
  darkMode: boolean;
  statusBanner: string | null;
  onRename: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onDuplicate: () => void;
  onOpenSaved: () => void;
  onReset: () => void;
  onRandomize: () => void;
  onShareLink: () => void;
  onCapturePreview: () => void;
  onToggleTheme: () => void;
  onDownloadStl: () => void;
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  designName, canUndo, canRedo, canExport, statusBanner,
  onRename, onUndo, onRedo, onSave, onDuplicate, onOpenSaved, onReset,
  onRandomize, onShareLink, onCapturePreview, onDownloadStl,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-surface border-b border-line">
      <div className="flex items-center gap-2 min-w-0">
        <label htmlFor="studio-design-name" className="sr-only">Design Name</label>
        <input id="studio-design-name" type="text" value={designName} maxLength={48} onChange={(e) => onRename(e.target.value)} className="w-44 sm:w-56 px-2.5 py-1.5 text-sm font-semibold rounded-control border border-line bg-alt text-ink focus:outline-none focus:border-accent" />
        {statusBanner && <span className="hidden md:inline text-xs font-medium text-accent truncate max-w-[220px]">{statusBanner}</span>}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <ToolbarBtn label="Undo" disabled={!canUndo} onClick={onUndo}><Undo2 className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn label="Redo" disabled={!canRedo} onClick={onRedo}><Redo2 className="w-4 h-4" /></ToolbarBtn>

        <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />

        <ToolbarBtn label="Save Design" text="Save" onClick={onSave}><Save className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn label="Duplicate Design" onClick={onDuplicate}><Copy className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn label="Load Saved Designs" text="Load" onClick={onOpenSaved}><FolderOpen className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn label="Reset to Default" text="Reset" onClick={onReset}><RotateCcw className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn label="Randomize Printable Design" text="Randomize" onClick={onRandomize}><Shuffle className="w-3.5 h-3.5" /></ToolbarBtn>

        <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />

        <ToolbarBtn label="Share Configuration Link" onClick={onShareLink}><Share2 className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn label="Capture Preview Screenshot" onClick={onCapturePreview}><Camera className="w-3.5 h-3.5" /></ToolbarBtn>

        <button type="button" disabled={!canExport} onClick={onDownloadStl} className="ml-1 px-3 py-1.5 rounded-control text-xs font-semibold inline-flex items-center gap-1.5 bg-accent hover:bg-accent/90 disabled:bg-soft disabled:text-muted text-on-accent transition-colors whitespace-nowrap shrink-0">
          <Download className="w-3.5 h-3.5" /> <span>Download STL</span>
        </button>
      </div>
    </div>
  );
};

interface ToolbarBtnProps { label: string; text?: string; disabled?: boolean; onClick: () => void; children: React.ReactNode; }
const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ label, text, disabled, onClick, children }) => (
  <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="px-2 py-1.5 rounded-control text-xs font-medium inline-flex items-center gap-1.5 text-muted hover:bg-soft hover:text-ink disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0">
    {children} {text && <span className="hidden xl:inline">{text}</span>}
  </button>
);