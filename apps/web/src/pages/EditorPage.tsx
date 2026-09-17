import React, { useEffect, useCallback } from "react";
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
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

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
        deleteSelected();
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, handleSave, duplicateSelected, deleteSelected, setActiveTool]);

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
    <div className="h-screen w-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0a0c10] text-slate-800 dark:text-slate-100 overflow-hidden transition-colors">
      <Toolbar onSave={handleSave} onExport={handleExport} />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 h-full relative">
          <Canvas />

          {/* Floating Canvas Zoom & Fit Navigator (Bottom Right) */}
          <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 shadow-lg backdrop-blur-md">
            <button
              onClick={zoomOut}
              title="Zoom Out (-)"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 px-1 min-w-[38px] text-center">
              {Math.round(document.viewport.zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              title="Zoom In (+)"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10 mx-1" />
            <button
              onClick={fitToScreen}
              title="Fit to Screen"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Maximize2 className="w-3 h-3" /> Fit
            </button>
          </div>
        </main>
        <PropertiesPanel />
      </div>

      <AiModal />
      <JsonModal />
      <ShareModal />
      <ShortcutsModal />
    </div>
  );
};
