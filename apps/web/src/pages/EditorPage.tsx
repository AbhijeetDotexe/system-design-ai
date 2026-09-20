import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditorStore } from "../stores/editorStore";
import { api } from "../services/api";
import { Canvas } from "../features/editor/Canvas";
import { Sidebar } from "../features/editor/Sidebar";
import { PropertiesPanel } from "../features/editor/PropertiesPanel";
import { Toolbar } from "../features/editor/Toolbar";
import { AiModal } from "../features/ai/AiModal";
import { JsonModal, ShareModal, ShortcutsModal } from "../features/editor/Modals";
import { toPng, toSvg } from "html-to-image";
import { ZoomIn, ZoomOut, Maximize2, Sparkles, LayoutTemplate, MousePointerClick, PanelLeftOpen, PanelRightOpen, FileText, Loader2, X, AlertCircle } from "lucide-react";

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    document,
    setDiagram,
    setIsSaved,
    undo,
    redo,
    deleteSelected,
    clearSelection,
    clearAll,
    duplicateSelected,
    zoomIn,
    zoomOut,
    fitToScreen,
    setActiveTool
  } = useEditorStore();

  // Load Diagram
  useEffect(() => {
    if (!id || id === "new") {
      setDiagram(null, {
        title: "Untitled Architecture",
        nodes: [],
        edges: [],
        viewport: { x: 50, y: 50, zoom: 1 }
      });
      return;
    }

    api
      .get(`/diagrams/${id}`)
      .then((res) => {
        const diagram = res.data.data;
        setDiagram(diagram._id, diagram.document);
      })
      .catch((err) => {
        console.error("Failed to load diagram:", err);
      });
  }, [id, setDiagram]);

  // Autosave / Save Handler
  const handleSave = useCallback(async () => {
    try {
      const currentDoc = useEditorStore.getState().document;
      const currentId = useEditorStore.getState().diagramId;

      if (currentId) {
        await api.patch(`/diagrams/${currentId}`, {
          title: currentDoc.title,
          document: currentDoc
        });
      } else {
        const res = await api.post("/diagrams", {
          title: currentDoc.title,
          document: currentDoc
        });
        const createdId = res.data.data._id;
        useEditorStore.getState().setDiagram(createdId, currentDoc);
        navigate(`/editor/${createdId}`, { replace: true });
      }
      setIsSaved(true);
    } catch (err) {
      console.error("Save diagram error:", err);
    }
  }, [navigate, setIsSaved]);

  // Debounced Autosave on Document Change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useEditorStore.getState().isSaved && useEditorStore.getState().diagramId) {
        handleSave();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [document, handleSave]);

  // Collapsible side panels (persisted)
  const [leftOpen, setLeftOpen] = useState(() => localStorage.getItem("sc_left_open") !== "0");
  const [rightOpen, setRightOpen] = useState(() => localStorage.getItem("sc_right_open") !== "0");
  const [showSummarize, setShowSummarize] = useState(false);
  const [summarizeText, setSummarizeText] = useState("");
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  // Cache: track whether we already have a summary for this session
  const hasSummaryRef = useRef(false);

  const handleSummarize = useCallback(async () => {
    if (summarizeLoading) return;
    setSummarizeLoading(true);

    try {
      const res = await api.post("/ai/summarize-diagram", { currentDiagram: document });
      const text = res.data.data.summary || "Could not generate summary.";
      setSummarizeText(text);
      hasSummaryRef.current = true;
    } catch (err: any) {
      console.error("Summarize error:", err);
      setSummarizeText("Failed to generate summary. Try again.");
    } finally {
      setSummarizeLoading(false);
    }
  }, [document, summarizeLoading]);

  const toggleLeft = useCallback(() => {
    setLeftOpen((v) => {
      localStorage.setItem("sc_left_open", v ? "0" : "1");
      return !v;
    });
    // let canvas reclaim space before any fit calculations
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }, []);

  const toggleRight = useCallback(() => {
    setRightOpen((v) => {
      localStorage.setItem("sc_right_open", v ? "0" : "1");
      return !v;
    });
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (isMeta && (e.key === "Z" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (isMeta && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (isMeta && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        if (e.shiftKey) {
          e.preventDefault();
          clearAll();
        } else {
          deleteSelected();
        }
      } else if (e.key === "Escape") {
        setActiveTool("select");
      } else if (!isMeta) {
        // Quick Tool switcher keys
        const k = e.key.toLowerCase();
        if (k === "v") setActiveTool("select");
        else if (k === "h") setActiveTool("hand");
        else if (k === "r") setActiveTool("rectangle");
        else if (k === "o") setActiveTool("ellipse");
        else if (k === "d") setActiveTool("diamond");
        else if (k === "t") setActiveTool("text");
        else if (k === "p") setActiveTool("pencil");
        else if (e.key === "[") toggleLeft();
        else if (e.key === "]") toggleRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, handleSave, duplicateSelected, deleteSelected, setActiveTool, toggleLeft, toggleRight]);

  // Export handlers
  const handleExport = async (type: "png" | "svg" | "json") => {
    if (type === "json") {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(document, null, 2));
      const downloadAnchor = window.document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${document.title.toLowerCase().replace(/\s+/g, "-")}.json`);
      downloadAnchor.click();
      return;
    }

    const node = window.document.getElementById("canvas-viewport");
    if (!node) return;

    try {
      if (type === "png") {
        const dataUrl = await toPng(node, { quality: 0.95 });
        const link = window.document.createElement("a");
        link.download = `${document.title.toLowerCase().replace(/\s+/g, "-")}.png`;
        link.href = dataUrl;
        link.click();
      } else if (type === "svg") {
        const dataUrl = await toSvg(node);
        const link = window.document.createElement("a");
        link.download = `${document.title.toLowerCase().replace(/\s+/g, "-")}.svg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden transition-colors">
      <Toolbar onSave={handleSave} onExport={handleExport} />

      <div className="flex-1 flex overflow-hidden relative">
        {leftOpen ? (
          <Sidebar onCollapse={toggleLeft} />
        ) : (
          <div className="w-10 h-full bg-card border-r border-border flex flex-col items-center py-3 gap-2 shrink-0 z-10">
            <button
              onClick={toggleLeft}
              title="Show components panel ( [ )"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}
        <main className="flex-1 h-full relative min-w-0">
          <Canvas />

          {/* Friendly empty-state onboarding */}
          {document.nodes.length === 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none">
              <div className="pointer-events-auto max-w-[440px] w-full rounded-xl glass border border-border shadow-card p-6 text-center space-y-4 animate-fade-up">
                <div className="w-11 h-11 mx-auto rounded-lg bg-foreground text-background flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold tracking-tight">Start your architecture</h2>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                    Describe it in words, pick a template, or drag building blocks from the left.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                  <button
                    onClick={() => useEditorStore.getState().setAiModalOpen(true)}
                    className="rounded-lg border border-border bg-muted/50 hover:bg-muted p-3 transition group"
                  >
                    <Sparkles className="w-4 h-4 text-foreground mb-1.5" />
                    <p className="text-[12px] font-semibold">Ask AI</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">Generate full system</p>
                  </button>
                  <button
                    onClick={() => navigate("/dashboard?tab=templates")}
                    className="rounded-lg border border-border bg-card hover:bg-muted p-3 transition"
                  >
                    <LayoutTemplate className="w-4 h-4 text-foreground mb-1.5" />
                    <p className="text-[12px] font-semibold">Template</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">Start from proven stack</p>
                  </button>
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <MousePointerClick className="w-4 h-4 text-muted-foreground mb-1.5" />
                    <p className="text-[12px] font-semibold">Drag & drop</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">Add blocks manually</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tip: hover any card → click <span className="font-semibold text-foreground">● dots</span> on its edge to connect two services.
                </p>
              </div>
            </div>
          )}

          {/* Floating Canvas Zoom & Fit Navigator (Bottom Right) */}
          <div className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-2">
            {/* Summarize Button — opens cached summary or generates first time */}
            <button
              onClick={() => {
                setShowSummarize(true);
                // Only auto-generate if we don't have a cached summary yet
                if (!hasSummaryRef.current && !summarizeText) {
                  handleSummarize();
                }
              }}
              disabled={summarizeLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 shadow-glow"
              title="Summarize with AI (S)"
            >
              {summarizeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span className="hidden sm:inline">Summarize</span>
            </button>

            {/* Floating Canvas Zoom & Fit Navigator */}
            <div className="flex items-center gap-1 glass border border-border rounded-2xl px-2 py-1.5 shadow-card">
              <button
                onClick={zoomOut}
                title="Zoom out (-)"
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1 min-w-[44px] text-center tabular-nums">
                {Math.round(document.viewport.zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                title="Zoom in (+)"
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={fitToScreen}
                title="Fit everything on screen"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-bold hover:bg-muted transition"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Fit
              </button>
            </div>
          </div>
        </main>
        {rightOpen ? (
          <PropertiesPanel onCollapse={toggleRight} />
        ) : (
          <div className="w-10 h-full bg-card border-l border-border hidden lg:flex flex-col items-center py-3 gap-2 shrink-0 z-10">
            <button
              onClick={toggleRight}
              title="Show properties panel ( ] )"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <AiModal />
      <JsonModal />
      <ShareModal />
      <ShortcutsModal />

      {/* Summarize Modal */}
      {showSummarize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-up">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl p-6 shadow-card animate-pop-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-[15px] font-semibold">Diagram Summary</h2>
              </div>
              <button
                onClick={() => setShowSummarize(false)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {summarizeLoading ? (
              <div className="flex flex-col items-center justify-center h-32 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[12px] text-muted-foreground">Analyzing your architecture…</p>
              </div>
            ) : summarizeText ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {summarizeText.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => {
                  const trimmed = line.trim();
                  // Render bold markdown (**text**) as <strong>
                  const renderBold = (text: string) => {
                    const parts = text.split(/(\*\*[^*]+\*\*)/);
                    return parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={j}>{part}</span>;
                    });
                  };

                  // Bullet point lines
                  if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                    const content = trimmed.replace(/^[•\-]\s*/, '');
                    return (
                      <div key={i} className="flex gap-2.5 pl-1">
                        <span className="text-primary mt-0.5 shrink-0">•</span>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{renderBold(content)}</p>
                      </div>
                    );
                  }

                  // Overview or Data Flow heading lines
                  if (trimmed.startsWith('**Overview:') || trimmed.startsWith('**Data Flow:')) {
                    return (
                      <p key={i} className="text-[13.5px] leading-relaxed">{renderBold(trimmed)}</p>
                    );
                  }

                  // Regular paragraph
                  return <p key={i} className="text-[13px] text-muted-foreground leading-relaxed">{renderBold(trimmed)}</p>;
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                <FileText className="w-8 h-8 opacity-30" />
                <p className="text-[13px] italic">No summary yet. Click Regenerate to generate one.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setShowSummarize(false)}
                className="px-4 py-2 rounded-md hover:bg-muted text-[13px] font-medium"
              >
                Close
              </button>
              <button
                onClick={handleSummarize}
                disabled={summarizeLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover text-[13px] font-medium transition-all disabled:opacity-50"
              >
                {summarizeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{hasSummaryRef.current ? 'Regenerate' : 'Generate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
