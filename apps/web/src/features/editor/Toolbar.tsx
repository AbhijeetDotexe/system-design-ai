import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditorStore, ToolType } from "../../stores/editorStore";
import {
  Sparkles, RotateCcw, RotateCw, LayoutDashboard, Share2, Download, Code2, Keyboard, Save,
  MousePointer2, Hand, Square, Circle, Diamond, Type, Brush,
  Sun, Moon, Check, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Wrench,
} from "lucide-react";

interface ToolbarProps {
  onSave: () => void;
  onExport: (type: "png" | "svg" | "json") => void;
}

const TOOLS: { id: ToolType; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 className="w-4 h-4" />, hint: "V · click, drag, multi-select" },
  { id: "hand", label: "Pan", icon: <Hand className="w-4 h-4" />, hint: "H · drag canvas to pan" },
  { id: "rectangle", label: "Box", icon: <Square className="w-4 h-4" />, hint: "R · drag to draw container" },
  { id: "ellipse", label: "Oval", icon: <Circle className="w-4 h-4" />, hint: "O · drag to draw process" },
  { id: "diamond", label: "Decision", icon: <Diamond className="w-4 h-4" />, hint: "D · drag to draw decision" },
  { id: "text", label: "Text", icon: <Type className="w-4 h-4" />, hint: "T · drag to place note" },
  { id: "pencil", label: "Draw", icon: <Brush className="w-4 h-4" />, hint: "P · freehand sketch" },
];

// First two tools (Select, Pan) are always visible; the rest are collapsible
const ALWAYS_VISIBLE_COUNT = 2;

export const Toolbar: React.FC<ToolbarProps> = ({ onSave, onExport }) => {
  const {
    document, historyIndex, history, activeTool, theme,
    undo, redo, autoLayout, setActiveTool, toggleTheme,
    setAiModalOpen, setJsonModalOpen, setShareModalOpen, setShortcutsModalOpen, isSaved,
    clearSelection, deleteSelected, clearAll,
  } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasContent = document.nodes.length > 0 || document.edges.length > 0;
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Collapsible shape tools state (persisted)
  const [toolsExpanded, setToolsExpanded] = useState(() => localStorage.getItem("sc_tools_expanded") !== "0");

  const toggleToolsExpanded = () => {
    setToolsExpanded((v) => {
      localStorage.setItem("sc_tools_expanded", v ? "0" : "1");
      return !v;
    });
  };

  // If user selects a collapsed tool via keyboard shortcut, auto-expand
  const collapsibleToolIds = TOOLS.slice(ALWAYS_VISIBLE_COUNT).map(t => t.id);
  useEffect(() => {
    if (!toolsExpanded && collapsibleToolIds.includes(activeTool)) {
      setToolsExpanded(true);
      localStorage.setItem("sc_tools_expanded", "1");
    }
  }, [activeTool]);

  const alwaysVisibleTools = TOOLS.slice(0, ALWAYS_VISIBLE_COUNT);
  const collapsibleTools = TOOLS.slice(ALWAYS_VISIBLE_COUNT);

  return (
    <header className="glass sticky top-0 h-[60px] border-b border-border px-3 md:px-4 flex items-center gap-2 md:gap-3 z-20 shrink-0">
      {/* Brand + title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <a href="/dashboard" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-[14px] tracking-tight hidden lg:inline">
            SystemCraft<span className="text-muted-foreground font-medium"> AI</span>
          </span>
        </a>

        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={document.title}
            onChange={(e) => useEditorStore.getState().setTitle(e.target.value)}
            placeholder="Untitled architecture"
            className="text-[13px] font-semibold bg-transparent hover:bg-muted focus:bg-muted border border-transparent hover:border-border focus:border-primary px-2.5 py-1.5 rounded-lg transition truncate w-[140px] md:w-[220px] outline-none placeholder:text-muted-foreground placeholder:font-normal"
          />
          <span
            title={isSaved ? "All changes saved" : "Unsaved changes"}
            className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full border shrink-0 ${
              isSaved
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSaved ? "bg-emerald-500" : "bg-amber-500 animate-pulse-dot"}`} />
            {isSaved ? "Saved" : "Saving…"}
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Tools — segmented pill with collapsible shape tools */}
      <div className="hidden md:flex items-center gap-0.5 bg-muted/80 border border-border rounded-[14px] p-1 shadow-sm">
        {/* Always-visible tools (Select, Pan) */}
        {alwaysVisibleTools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            title={`${t.label} — ${t.hint}`}
            className={`flex items-center gap-1.5 px-2.5 py-[7px] rounded-[10px] text-[12px] font-semibold transition-all ${
              activeTool === t.id
                ? "bg-card text-primary shadow-soft border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card/70 border border-transparent"
            }`}
          >
            {t.icon}
            <span className="hidden xl:inline">{t.label}</span>
          </button>
        ))}

        {/* Collapse/Expand toggle */}
        <button
          onClick={toggleToolsExpanded}
          title={toolsExpanded ? "Collapse drawing tools" : "Expand drawing tools"}
          className="p-2 rounded-[10px] hover:bg-card text-muted-foreground hover:text-foreground transition-all"
        >
          {toolsExpanded ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <Wrench className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Collapsible tools — animated container */}
        <div
          className="flex items-center gap-0.5 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            maxWidth: toolsExpanded ? `${collapsibleTools.length * 110}px` : "0px",
            opacity: toolsExpanded ? 1 : 0,
          }}
        >
          {collapsibleTools.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={`${t.label} — ${t.hint}`}
              className={`flex items-center gap-1.5 px-2.5 py-[7px] rounded-[10px] text-[12px] font-semibold whitespace-nowrap transition-all duration-300 ${
                activeTool === t.id
                  ? "bg-card text-primary shadow-soft border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/70 border border-transparent"
              }`}
              style={{
                transform: toolsExpanded ? "scale(1)" : "scale(0.8)",
                opacity: toolsExpanded ? 1 : 0,
                transitionDelay: toolsExpanded ? `${idx * 30}ms` : "0ms",
              }}
            >
              {t.icon}
              <span className="hidden xl:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="p-2 rounded-[10px] hover:bg-card disabled:opacity-30 text-muted-foreground hover:text-foreground transition">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" className="p-2 rounded-[10px] hover:bg-card disabled:opacity-30 text-muted-foreground hover:text-foreground transition">
          <RotateCw className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={() => autoLayout("LR")}
          title="Auto-arrange with clean left-to-right layout"
          className="flex items-center gap-1.5 px-2.5 py-[7px] rounded-[10px] text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:bg-card transition"
        >
          <LayoutDashboard className="w-4 h-4 text-primary" />
          <span className="hidden xl:inline">Tidy up</span>
        </button>
      </div>

      {/* Mobile tools: horizontal scroll */}
      <div className="flex md:hidden items-center gap-1 bg-muted/80 border border-border rounded-xl p-1 overflow-x-auto max-w-[38vw]">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            title={t.label}
            className={`p-2 rounded-lg shrink-0 ${activeTool === t.id ? "bg-card text-primary shadow-soft" : "text-muted-foreground"}`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="flex-1 md:hidden" />

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition flex items-center justify-center"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setAiModalOpen(true)}
          className="flex items-center gap-1.5 h-9 px-3 md:px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-[12.5px] font-semibold transition-all active:scale-95"
          title="Describe your system and let AI draw it"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5">
          <button onClick={() => setShareModalOpen(true)} className="w-9 h-9 rounded-xl hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition flex items-center justify-center" title="Share read-only link">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="relative group">
            <button className="w-9 h-9 rounded-xl hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition flex items-center justify-center" title="Export PNG / SVG / JSON">
              <Download className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-popover border border-border rounded-xl p-1.5 shadow-card min-w-[150px] z-50 animate-pop-in">
              {([["png", "Export PNG image"], ["svg", "Export SVG vector"], ["json", "Download JSON"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => onExport(k)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-[12.5px] font-medium transition flex items-center gap-2">
                  <Check className="w-3 h-3 opacity-0" /> {label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setJsonModalOpen(true)} className="w-9 h-9 rounded-xl hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition hidden lg:flex items-center justify-center" title="View / edit JSON">
            <Code2 className="w-4 h-4" />
          </button>
          <button onClick={() => setShortcutsModalOpen(true)} className="w-9 h-9 rounded-xl hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition hidden lg:flex items-center justify-center" title="Shortcuts">
            <Keyboard className="w-4 h-4" />
          </button>
        </div>

        {/* Clear All */}
        {hasContent && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-9 h-9 rounded-xl hover:bg-red-500/10 border border-red-500/20 text-red-500 hover:text-red-600 transition flex items-center justify-center"
            title="Clear entire canvas (Shift+Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 h-9 px-3 md:px-4 rounded-xl bg-foreground text-background text-[12.5px] font-bold hover:opacity-90 transition-all active:scale-95"
          title="Save now (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>

      {/* Clear confirmation modal — rendered via portal to escape header stacking context */}
      {showClearConfirm && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-up"
            onClick={() => setShowClearConfirm(false)}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-card space-y-4 animate-pop-in">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold">Clear entire canvas?</h3>
                  <p className="text-[12.5px] text-muted-foreground mt-0.5">
                    This will delete all {document.nodes.length} component{document.nodes.length !== 1 ? "s" : ""} and {document.edges.length} connection{document.edges.length !== 1 ? "s" : ""}. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-md hover:bg-muted text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearAll();
                    setShowClearConfirm(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-[13px] font-medium transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear everything</span>
                </button>
              </div>
            </div>
          </div>
        </>,
        window.document.body
      )}
    </header>
  );
};
