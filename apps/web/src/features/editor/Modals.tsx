import React, { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { X, Copy, Check, Share2, Keyboard } from "lucide-react";
import { api } from "../../services/api";

export const JsonModal: React.FC = () => {
  const { isJsonModalOpen, setJsonModalOpen, document, setDiagram, diagramId } = useEditorStore();
  const [jsonText, setJsonText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isJsonModalOpen) {
      setJsonText(JSON.stringify(document, null, 2));
      setError(null);
    }
  }, [isJsonModalOpen, document]);

  if (!isJsonModalOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setDiagram(diagramId, parsed);
      setJsonModalOpen(false);
    } catch (err: any) {
      setError("Invalid JSON format: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-card border border-border rounded-3xl p-5 shadow-card flex flex-col max-h-[85vh] animate-pop-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Diagram JSON Representation</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
            <button
              onClick={() => setJsonModalOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && <div className="p-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded mt-2">{error}</div>}

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="flex-1 my-3 p-3 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={() => setJsonModalOpen(false)}
            className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Apply JSON Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export const ShareModal: React.FC = () => {
  const { isShareModalOpen, setShareModalOpen, diagramId } = useEditorStore();
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isShareModalOpen && diagramId) {
      api.post(`/diagrams/${diagramId}/share`, { isPublic: true })
        .then((res) => {
          setShareUrl(res.data.data.shareUrl || `${window.location.origin}/share/${res.data.data.shareToken}`);
        })
        .catch(console.error);
    }
  }, [isShareModalOpen, diagramId]);

  if (!isShareModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-card space-y-4 animate-pop-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Share architecture diagram</h2>
          </div>
          <button
            onClick={() => setShareModalOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Anyone with this read-only link can view and inspect this system architecture diagram.
        </p>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-white/10 rounded-lg">
          <input
            type="text"
            readOnly
            value={shareUrl || "Generating share link..."}
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none truncate"
          />
          <button
            disabled={!shareUrl}
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white font-medium flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setShortcutsModalOpen } = useEditorStore();

  if (!isShortcutsModalOpen) return null;

  const shortcuts = [
    { key: "V", desc: "Select Tool" },
    { key: "H", desc: "Hand / Pan Tool" },
    { key: "R", desc: "Rectangle Tool (drag on canvas)" },
    { key: "O", desc: "Ellipse / Circle Tool" },
    { key: "D", desc: "Diamond Decision Tool" },
    { key: "T", desc: "Text Note Tool" },
    { key: "P", desc: "Freehand Pencil Tool" },
    { key: "Escape", desc: "Switch back to Select Tool" },
    { key: "Ctrl / Cmd + Z", desc: "Undo last change" },
    { key: "Ctrl / Cmd + Shift + Z", desc: "Redo change" },
    { key: "Ctrl / Cmd + S", desc: "Save diagram" },
    { key: "Ctrl / Cmd + D", desc: "Duplicate selected component" },
    { key: "Backspace / Delete", desc: "Delete selected node or edge" },
    { key: "Right-Click Node", desc: "Context menu (layering, duplicate)" },
    { key: "Mouse Wheel", desc: "Pan canvas" },
    { key: "Ctrl + Mouse Wheel", desc: "Zoom in / out" },
    { key: "Shift + Delete", desc: "Clear entire canvas" },
    { key: "Right-Click Node", desc: "Context menu (layering, duplicate)" },
    { key: "]", desc: "Show / hide properties panel" },
    { key: "Drag Handle", desc: "Resize shape (8 directions)" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-card space-y-4 animate-pop-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold">Shortcuts & tools</h2>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-white/5 text-xs">
              <span className="text-slate-600 dark:text-slate-400">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
