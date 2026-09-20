import React from "react";
import { useEditorStore } from "../../stores/editorStore";
import {
  Trash2, Copy, Link, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, Palette, Type, MousePointer2, PanelRightClose,
} from "lucide-react";

const COLOR_PRESETS = [
  { label: "Violet", bg: "rgba(110,86,207,.12)", border: "#6E56CF" },
  { label: "Blue", bg: "rgba(59,130,246,.12)", border: "#3b82f6" },
  { label: "Cyan", bg: "rgba(6,182,212,.12)", border: "#06b6d4" },
  { label: "Green", bg: "rgba(16,185,129,.12)", border: "#10b981" },
  { label: "Amber", bg: "rgba(245,158,11,.14)", border: "#f59e0b" },
  { label: "Orange", bg: "rgba(249,115,22,.12)", border: "#f97316" },
  { label: "Rose", bg: "rgba(244,63,94,.12)", border: "#f43f5e" },
  { label: "Slate", bg: "transparent", border: "#64748b" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-3 space-y-2.5">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

const fieldCls =
  "w-full px-2.5 py-2 bg-card border border-border rounded-xl text-[12.5px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

export const PropertiesPanel: React.FC<{ onCollapse?: () => void }> = ({ onCollapse }) => {
  const {
    document, selectedNodeIds, selectedEdgeId,
    updateNode, updateEdge, deleteSelected, duplicateSelected, deleteEdge, updateZIndex,
  } = useEditorStore();

  const selectedNode = selectedNodeIds.length === 1
    ? document.nodes.find((n) => n.id === selectedNodeIds[0])
    : null;

  const selectedEdge = selectedEdgeId
    ? document.edges.find((e) => e.id === selectedEdgeId)
    : null;

  const multi = selectedNodeIds.length > 1;

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="w-[280px] h-full bg-card border-l border-border p-4 hidden lg:flex flex-col">
        {onCollapse && (
          <div className="flex justify-end -mb-2">
            <button
              onClick={onCollapse}
              title="Hide properties panel ( ] )"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-3 py-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <MousePointer2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[13px] font-bold">Nothing selected</p>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Click any component to edit its label, size, colors and text. Click a connector line to rename it.
            </p>
          </div>
          <div className="w-full rounded-2xl border border-dashed border-border p-3 text-left space-y-1.5 bg-muted/40">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Quick tips</p>
            <p className="text-[11.5px] text-muted-foreground">· Drag from left panel or click <span className="font-semibold text-foreground">+</span></p>
            <p className="text-[11.5px] text-muted-foreground">· Hover a card → <span className="font-semibold text-foreground">● dots</span> to connect</p>
            <p className="text-[11.5px] text-muted-foreground">· Right-click a card for more</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] h-full bg-card border-l border-border hidden lg:flex flex-col z-10">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-[12px] font-extrabold uppercase tracking-[0.08em]">
          {selectedNode ? "Edit component" : "Edit connection"}
        </h3>
        <div className="flex items-center gap-1">
          {selectedNode && (
            <>
              <button onClick={duplicateSelected} title="Duplicate (Ctrl+D)" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => updateZIndex(selectedNode.id, "front")} title="Bring to front" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => updateZIndex(selectedNode.id, "back")} title="Send to back" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={deleteSelected} title="Delete" className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {selectedEdge && (
            <button onClick={() => deleteEdge(selectedEdge.id)} title="Delete connection" className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onCollapse && (
            <button onClick={onCollapse} title="Hide properties panel ( ] )" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {multi && (
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3 text-[12px]">
            <span className="font-bold">{selectedNodeIds.length} components selected.</span>
            <span className="text-muted-foreground"> Select just one to fine-tune it, or press Delete to remove all.</span>
          </div>
        )}

        {selectedNode && !multi && (
          <>
            <Section title="Label">
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                placeholder="e.g. API Gateway"
                className={fieldCls}
              />
              <textarea
                rows={2}
                placeholder="What does this do? (optional)"
                value={selectedNode.description || ""}
                onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                className={`${fieldCls} resize-none`}
              />
            </Section>

            <Section title="Text style">
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-card border border-border rounded-xl p-1">
                  {([
                    ["left", <AlignLeft key="l" className="w-3.5 h-3.5" />],
                    ["center", <AlignCenter key="c" className="w-3.5 h-3.5" />],
                    ["right", <AlignRight key="r" className="w-3.5 h-3.5" />],
                  ] as const).map(([align, icon]) => (
                    <button
                      key={align}
                      onClick={() => updateNode(selectedNode.id, { style: { textAlign: align } })}
                      className={`p-1.5 rounded-lg transition ${(!selectedNode.style?.textAlign && align === "center") || selectedNode.style?.textAlign === align
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground"}`}
                      title={`Align ${align}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex-1 flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 py-[7px]">
                  <Type className="w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="number" min={10} max={48}
                    value={selectedNode.style?.fontSize || 14}
                    onChange={(e) => updateNode(selectedNode.id, { style: { fontSize: parseInt(e.target.value, 10) || 14 } })}
                    className="w-full bg-transparent outline-none text-[12.5px] font-semibold"
                  />
                </div>
              </div>
            </Section>

            <Section title="Color">
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_PRESETS.map((preset) => {
                  const active = selectedNode.style?.borderColor === preset.border;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => updateNode(selectedNode.id, { style: { backgroundColor: preset.bg, borderColor: preset.border } })}
                      title={preset.label}
                      className={`h-9 rounded-xl border-2 transition-all hover:scale-105 ${active ? "border-primary shadow-glow scale-105" : "border-border"}`}
                      style={{ backgroundColor: preset.bg === "transparent" ? undefined : preset.bg }}
                    >
                      <span className="block w-3 h-3 mx-auto rounded-full" style={{ backgroundColor: preset.border }} />
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 bg-card border border-border rounded-xl px-2 py-1.5 cursor-pointer">
                  <input
                    type="color"
                    value={/^#/.test(selectedNode.style?.backgroundColor || "") ? selectedNode.style!.backgroundColor as string : "#ffffff"}
                    onChange={(e) => updateNode(selectedNode.id, { style: { backgroundColor: e.target.value } })}
                    className="w-7 h-7 rounded-lg shrink-0"
                  />
                  <span className="text-[11px] font-semibold text-muted-foreground">Fill</span>
                </label>
                <label className="flex items-center gap-2 bg-card border border-border rounded-xl px-2 py-1.5 cursor-pointer">
                  <input
                    type="color"
                    value={/^#/.test(selectedNode.style?.borderColor || "") ? selectedNode.style!.borderColor as string : "#6E56CF"}
                    onChange={(e) => updateNode(selectedNode.id, { style: { borderColor: e.target.value } })}
                    className="w-7 h-7 rounded-lg shrink-0"
                  />
                  <span className="text-[11px] font-semibold text-muted-foreground">Edge</span>
                </label>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                    <span>Border thickness</span><span>{selectedNode.style?.borderWidth || 1}px</span>
                  </div>
                  <input type="range" min={1} max={8} value={selectedNode.style?.borderWidth || 1.5}
                    onChange={(e) => updateNode(selectedNode.id, { style: { borderWidth: parseInt(e.target.value, 10) } })}
                    className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                    <span>Roundness</span><span>{selectedNode.style?.borderRadius ?? 16}px</span>
                  </div>
                  <input type="range" min={0} max={32} value={selectedNode.style?.borderRadius ?? 16}
                    onChange={(e) => updateNode(selectedNode.id, { style: { borderRadius: parseInt(e.target.value, 10) } })}
                    className="w-full" />
                </div>
              </div>
            </Section>

            <Section title="Size & position">
              <div className="grid grid-cols-2 gap-2">
                {(["width", "height"] as const).map((dim) => (
                  <div key={dim} className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 py-[7px]">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{dim[0]}</span>
                    <input
                      type="number" min={dim === "width" ? 40 : 30}
                      value={Math.round((selectedNode as any)[dim] || (dim === "width" ? 180 : 85))}
                      onChange={(e) => updateNode(selectedNode.id, { [dim]: Math.max(dim === "width" ? 40 : 30, parseInt(e.target.value, 10) || 40) } as any)}
                      className="w-full bg-transparent outline-none text-[12px] font-semibold"
                    />
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {selectedEdge && (
          <>
            <Section title="Connection label">
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-2.5">
                <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. HTTPS, gRPC, SQL…"
                  value={selectedEdge.label || ""}
                  onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
                  className="w-full py-2 bg-transparent outline-none text-[12.5px] font-medium placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-1 p-1">
                <Palette className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                <span className="text-[11.5px] font-semibold text-muted-foreground ml-1">Style</span>
              </div>
              <select
                value={selectedEdge.type || "arrow"}
                onChange={(e) => updateEdge(selectedEdge.id, { type: e.target.value as any })}
                className={fieldCls}
              >
                <option value="arrow">Solid arrow →</option>
                <option value="dashed">Dashed - - →</option>
                <option value="line">Plain line —</option>
              </select>
            </Section>
          </>
        )}
      </div>
    </aside>
  );
};
