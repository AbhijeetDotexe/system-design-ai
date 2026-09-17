import React from "react";
import { useEditorStore, ToolType } from "../../stores/editorStore";
import { 
  Sparkles, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize2, 
  LayoutDashboard, Share2, Download, Code2, Keyboard, Save, CheckCircle,
  MousePointer, Hand, Square, Circle, Diamond, ArrowRight, Type, Edit3,
  Sun, Moon, ShieldCheck
} from "lucide-react";

interface ToolbarProps {
  onSave: () => void;
  onExport: (type: "png" | "svg" | "json") => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSave, onExport }) => {
  const {
    document,
    historyIndex,
    history,
    activeTool,
    theme,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    autoLayout,
    setActiveTool,
    toggleTheme,
    setAiModalOpen,
    setJsonModalOpen,
    setShareModalOpen,
    setShortcutsModalOpen,
    isSaved
  } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: "select", label: "Select", icon: <MousePointer className="w-3.5 h-3.5" />, shortcut: "V" },
    { id: "hand", label: "Hand / Pan", icon: <Hand className="w-3.5 h-3.5" />, shortcut: "H" },
    { id: "rectangle", label: "Rectangle", icon: <Square className="w-3.5 h-3.5" />, shortcut: "R" },
    { id: "ellipse", label: "Ellipse / Circle", icon: <Circle className="w-3.5 h-3.5" />, shortcut: "O" },
    { id: "diamond", label: "Diamond Decision", icon: <Diamond className="w-3.5 h-3.5" />, shortcut: "D" },
    { id: "text", label: "Text Note", icon: <Type className="w-3.5 h-3.5" />, shortcut: "T" },
    { id: "pencil", label: "Freehand Pencil", icon: <Edit3 className="w-3.5 h-3.5" />, shortcut: "P" }
  ];

  return (
    <header className="h-14 bg-white dark:bg-[#0d1117] border-b border-slate-200 dark:border-white/5 px-4 flex items-center justify-between z-20 shrink-0 transition-colors">
      {/* Left: Brand + Document Title */}
      <div className="flex items-center gap-3">
        <a href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white hidden md:inline">
            SystemCraft<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </a>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden md:block" />

        <input
          type="text"
          value={document.title}
          onChange={(e) => useEditorStore.getState().setTitle(e.target.value)}
          className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 focus:bg-slate-100 dark:focus:bg-slate-900 border border-transparent hover:border-slate-300 dark:hover:border-white/10 focus:border-indigo-500 px-2 py-1 rounded transition-colors truncate max-w-[180px] md:max-w-xs outline-none"
        />

        {/* Save Status Badge */}
        <div className="flex items-center gap-1 text-[11px] text-slate-500 ml-1">
          {isSaved ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-medium">Unsaved</span>
          )}
        </div>
      </div>

      {/* Middle: Tool Selector Palette */}
      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-lg p-1 shadow-sm">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTool === t.id
                ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5"
            }`}
          >
            {t.icon}
            <span className="hidden xl:inline">{t.label}</span>
          </button>
        ))}

        <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-1" />

        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 text-slate-600 dark:text-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 text-slate-600 dark:text-slate-300"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-1" />

        <button
          onClick={() => autoLayout("LR")}
          title="Auto Layout Diagram (Left to Right)"
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden md:inline">Auto Layout</span>
        </button>
      </div>

      {/* Right: Actions & Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 transition-colors"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Prominent Ask AI Button */}
        <button
          onClick={() => setAiModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>

        <button
          onClick={() => setShareModalOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300"
          title="Share diagram link"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Export Dropdown */}
        <div className="relative group">
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300"
            title="Export diagram"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-1 text-xs shadow-xl min-w-[130px] z-50">
            <button
              onClick={() => onExport("png")}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
            >
              Export PNG
            </button>
            <button
              onClick={() => onExport("svg")}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
            >
              Export SVG
            </button>
            <button
              onClick={() => onExport("json")}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
            >
              Export JSON
            </button>
          </div>
        </div>

        <button
          onClick={() => setJsonModalOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hidden sm:block"
          title="Inspect Diagram JSON"
        >
          <Code2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hidden sm:block"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </div>
    </header>
  );
};
