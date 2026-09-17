import React from "react";
import { useEditorStore } from "../../stores/editorStore";
import { NodeTypeEnum } from "@systemcraft/diagram-schema";
import { 
  Trash2, Copy, Sliders, Link, Hash, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, Palette, Type, Move, Maximize
} from "lucide-react";

const COLOR_PRESETS = [
  { label: "Default", bg: "transparent", border: "#64748b" },
  { label: "Blue", bg: "rgba(59, 130, 246, 0.15)", border: "#3b82f6" },
  { label: "Indigo", bg: "rgba(99, 102, 241, 0.15)", border: "#6366f1" },
  { label: "Purple", bg: "rgba(168, 85, 247, 0.15)", border: "#a855f7" },
  { label: "Emerald", bg: "rgba(16, 185, 129, 0.15)", border: "#10b981" },
  { label: "Cyan", bg: "rgba(6, 182, 212, 0.15)", border: "#06b6d4" },
  { label: "Amber", bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b" },
  { label: "Rose", bg: "rgba(244, 63, 94, 0.15)", border: "#f43f5e" }
];

export const PropertiesPanel: React.FC = () => {
  const {
    document,
    selectedNodeIds,
    selectedEdgeId,
    theme,
    updateNode,
    updateEdge,
    deleteSelected,
    duplicateSelected,
    deleteEdge,
    updateZIndex
  } = useEditorStore();

  const selectedNode = selectedNodeIds.length === 1
    ? document.nodes.find((n) => n.id === selectedNodeIds[0])
    : null;

  const selectedEdge = selectedEdgeId
    ? document.edges.find((e) => e.id === selectedEdgeId)
    : null;

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="w-72 h-full bg-[#eef0f3] dark:bg-[#0d1117] border-l border-slate-200 dark:border-white/5 p-4 flex flex-col justify-center items-center text-center text-slate-500 text-xs transition-colors">
        <Sliders className="w-8 h-8 mb-2 opacity-30" />
        <p>Select any shape, architecture component, or connection line to inspect and adjust dimensions, colors, and typography.</p>
      </aside>
    );
  }

  return (
    <aside className="w-72 h-full bg-[#eef0f3] dark:bg-[#0d1117] border-l border-slate-200 dark:border-white/5 flex flex-col z-10 p-4 space-y-4 overflow-y-auto transition-colors">
      {/* Node Properties */}
      {selectedNode && (
        <>
          <div className="flex items-center justify-between border-b border-slate-300 dark:border-white/5 pb-2">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Component Properties
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={duplicateSelected}
                title="Duplicate (Ctrl+D)"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateZIndex(selectedNode.id, "front")}
                title="Bring to Front"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateZIndex(selectedNode.id, "back")}
                title="Send to Back"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={deleteSelected}
                title="Delete (Backspace)"
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Label / Text Content */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Text / Label</label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Position Controls: X & Y */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Move className="w-3 h-3 text-slate-400" /> Position (X, Y)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md px-2 py-1">
                  <span className="text-[10px] text-slate-400 font-mono">X</span>
                  <input
                    type="number"
                    value={Math.round(selectedNode.position.x)}
                    onChange={(e) =>
                      useEditorStore.getState().updateNodePosition(
                        selectedNode.id,
                        parseInt(e.target.value, 10) || 0,
                        selectedNode.position.y
                      )
                    }
                    className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md px-2 py-1">
                  <span className="text-[10px] text-slate-400 font-mono">Y</span>
                  <input
                    type="number"
                    value={Math.round(selectedNode.position.y)}
                    onChange={(e) =>
                      useEditorStore.getState().updateNodePosition(
                        selectedNode.id,
                        selectedNode.position.x,
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions: Width & Height */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Maximize className="w-3 h-3 text-slate-400" /> Dimensions (W, H)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md px-2 py-1">
                  <span className="text-[10px] text-slate-400 font-mono">W</span>
                  <input
                    type="number"
                    min="40"
                    value={Math.round(selectedNode.width || 180)}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        width: Math.max(40, parseInt(e.target.value, 10) || 40)
                      })
                    }
                    className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md px-2 py-1">
                  <span className="text-[10px] text-slate-400 font-mono">H</span>
                  <input
                    type="number"
                    min="30"
                    value={Math.round(selectedNode.height || 85)}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        height: Math.max(30, parseInt(e.target.value, 10) || 30)
                      })
                    }
                    className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
            </div>

            {/* Typography & Alignment */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Type className="w-3 h-3 text-slate-400" /> Text Alignment & Size
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md p-0.5">
                  <button
                    onClick={() => updateNode(selectedNode.id, { style: { textAlign: "left" } })}
                    className={`p-1 rounded ${
                      selectedNode.style?.textAlign === "left"
                        ? "bg-slate-200 dark:bg-white/10 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500"
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateNode(selectedNode.id, { style: { textAlign: "center" } })}
                    className={`p-1 rounded ${
                      !selectedNode.style?.textAlign || selectedNode.style?.textAlign === "center"
                        ? "bg-slate-200 dark:bg-white/10 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500"
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateNode(selectedNode.id, { style: { textAlign: "right" } })}
                    className={`p-1 rounded ${
                      selectedNode.style?.textAlign === "right"
                        ? "bg-slate-200 dark:bg-white/10 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500"
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md px-2 py-1">
                  <span className="text-[10px] text-slate-400">Size</span>
                  <input
                    type="number"
                    min="10"
                    max="48"
                    value={selectedNode.style?.fontSize || 14}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        style: { fontSize: parseInt(e.target.value, 10) || 14 }
                      })
                    }
                    className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>
            </div>

            {/* Appearance Color Palette Presets */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                <Palette className="w-3 h-3 text-slate-400" /> Color Presets
              </label>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() =>
                      updateNode(selectedNode.id, {
                        style: {
                          backgroundColor: preset.bg,
                          borderColor: preset.border
                        }
                      })
                    }
                    className="p-1 rounded border border-slate-300 dark:border-white/10 flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-slate-300 hover:scale-105 transition-transform"
                    style={{ backgroundColor: preset.bg }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.border }} />
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Fill Color</label>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md p-1">
                  <input
                    type="color"
                    value={selectedNode.style?.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        style: { backgroundColor: e.target.value }
                      })
                    }
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-500">Pick</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Border Color</label>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md p-1">
                  <input
                    type="color"
                    value={selectedNode.style?.borderColor || "#6366f1"}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        style: { borderColor: e.target.value }
                      })
                    }
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-500">Pick</span>
                </div>
              </div>
            </div>

            {/* Border Width & Corner Radius */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Border Width</label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={selectedNode.style?.borderWidth || 1}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      style: { borderWidth: parseInt(e.target.value, 10) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Corner Radius</label>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={selectedNode.style?.borderRadius || 12}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      style: { borderRadius: parseInt(e.target.value, 10) }
                    })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* Description if architectural */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Description</label>
              <textarea
                rows={2}
                placeholder="Component purpose..."
                value={selectedNode.description || ""}
                onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none text-xs"
              />
            </div>
          </div>
        </>
      )}

      {/* Edge Properties */}
      {selectedEdge && (
        <>
          <div className="flex items-center justify-between border-b border-slate-300 dark:border-white/5 pb-2">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Connection Link
            </h3>
            <button
              onClick={() => deleteEdge(selectedEdge.id)}
              title="Delete Link"
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Label / Protocol</label>
              <input
                type="text"
                placeholder="e.g. HTTPS, gRPC, SQL"
                value={selectedEdge.label || ""}
                onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Line Style</label>
              <select
                value={selectedEdge.type || "arrow"}
                onChange={(e) => updateEdge(selectedEdge.id, { type: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="arrow">Solid Arrow (→)</option>
                <option value="dashed">Dashed Arrow (--→)</option>
                <option value="line">Plain Line (—)</option>
              </select>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
