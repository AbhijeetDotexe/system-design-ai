import React, { useMemo, useState } from "react";
import { ARCHITECTURE_CATEGORIES } from "./nodeConfig";
import { useEditorStore } from "../../stores/editorStore";
import {
  ChevronDown, Search, X, Plus, GripVertical, Sparkles,
  Monitor, Globe, Smartphone, Zap, Network, ShieldAlert,
  Server, Cpu, Box, Database, Layers, HardDrive, GitFork,
  MessageSquare, KeyRound, Activity, Shapes, PanelLeftClose,
} from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  Monitor: <Monitor className="w-4 h-4" />,
  Globe: <Globe className="w-4 h-4" />,
  Smartphone: <Smartphone className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Network: <Network className="w-4 h-4" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4" />,
  Server: <Server className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
  Boxes: <Box className="w-4 h-4" />,
  Box: <Box className="w-4 h-4" />,
  Database: <Database className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  HardDrive: <HardDrive className="w-4 h-4" />,
  GitFork: <GitFork className="w-4 h-4" />,
  MessageSquare: <MessageSquare className="w-4 h-4" />,
  KeyRound: <KeyRound className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "Clients & Edge": <Globe className="w-3.5 h-3.5" />,
  "Networking & Gateways": <Network className="w-3.5 h-3.5" />,
  "Compute & Services": <Cpu className="w-3.5 h-3.5" />,
  "Data Stores & Caches": <Database className="w-3.5 h-3.5" />,
  "Messaging & Streaming": <GitFork className="w-3.5 h-3.5" />,
  "Observability & Security": <ShieldAlert className="w-3.5 h-3.5" />,
};

export const Sidebar: React.FC<{ onCollapse?: () => void }> = ({ onCollapse }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({
    "Clients & Edge": true,
    "Networking & Gateways": true,
    "Compute & Services": true,
    "Data Stores & Caches": true,
  });
  const addNode = useEditorStore((s) => s.addNode);
  const setAiModalOpen = useEditorStore((s) => s.setAiModalOpen);

  const total = useMemo(
    () => ARCHITECTURE_CATEGORIES.reduce((n, c) => n + c.items.length, 0),
    []
  );

  const handleDragStart = (e: React.DragEvent, item: any) => {
    e.dataTransfer.setData("application/systemcraft-node", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  const quickAdd = (item: any) => {
    const vp = useEditorStore.getState().document.viewport;
    // drop near viewport centre with slight jitter so multiples don't stack
    const jx = Math.round((Math.random() - 0.5) * 120);
    const jy = Math.round((Math.random() - 0.5) * 120);
    const baseX = Math.round((-vp.x + 400) / Math.max(vp.zoom, 0.3));
    const baseY = Math.round((-vp.y + 260) / Math.max(vp.zoom, 0.3));
    addNode({
      type: item.type,
      label: item.label,
      description: item.description,
      tech: item.tech,
      position: { x: baseX + jx, y: baseY + jy },
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ARCHITECTURE_CATEGORIES;
    return ARCHITECTURE_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.tech.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      ),
    })).filter((c) => c.items.length > 0);
  }, [search]);

  return (
    <aside className="w-[280px] h-full bg-card border-r border-border flex flex-col z-10 shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <Shapes className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight leading-none">Components</h2>
              <p className="text-[11px] text-muted-foreground mt-1">{total} building blocks</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAiModalOpen(true)}
              title="Generate with AI"
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover active:scale-95 transition"
            >
              <Sparkles className="w-3 h-3" /> AI
            </button>
            {onCollapse && (
              <button
                onClick={onCollapse}
                title="Hide components panel ( [ )"
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search — try “redis”, “kafka”…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-[12.5px] bg-muted/70 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/50 border border-border rounded-lg px-2.5 py-2">
          <span className="font-semibold text-foreground">Drag</span> onto canvas or <span className="font-semibold text-foreground">click +</span> to place. Hover for details.
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="w-11 h-11 mx-auto rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-[13px] font-semibold">No matches for “{search}”</p>
            <p className="text-[11.5px] text-muted-foreground mt-1">Try “postgres”, “gateway”, “cache”…</p>
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-[12px] font-semibold text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {filtered.map((cat) => {
          const isOpen = open[cat.title] ?? false;
          return (
            <div key={cat.title} className="rounded-2xl border border-border bg-background/40 overflow-hidden">
              <button
                onClick={() => setOpen((p) => ({ ...p, [cat.title]: !isOpen }))}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition text-left"
              >
                <span className="w-6 h-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  {CATEGORY_ICON[cat.title] ?? <Box className="w-3.5 h-3.5" />}
                </span>
                <span className="flex-1 text-[12px] font-semibold tracking-tight truncate">{cat.title}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {cat.items.length}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
              </button>

              {isOpen && (
                <div className="px-2 pb-2 grid grid-cols-1 gap-1.5 animate-fade-up">
                  {cat.items.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      title={`${item.label} — ${item.description} (${item.tech})`}
                      className="group relative flex items-start gap-2.5 p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-soft cursor-grab active:cursor-grabbing active:scale-[0.98] transition-all"
                    >
                      <div
                        className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 border mt-0.5"
                        style={{ backgroundColor: item.bgColor, borderColor: `${item.borderColor}55`, color: item.borderColor }}
                      >
                        {ICONS[item.icon] ?? <Box className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-semibold tracking-tight truncate leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[10.5px] font-mono mt-0.5 font-semibold" style={{ color: item.borderColor }}>
                          {item.tech}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground mt-1 leading-snug line-clamp-2 group-hover:line-clamp-none transition-all">
                          {item.description}
                        </div>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5" />
                      <button
                        onClick={(e) => { e.stopPropagation(); quickAdd(item); }}
                        title={`Add ${item.label} to canvas`}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-primary text-primary-foreground items-center justify-center gap-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity hidden group-hover:flex"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border">
        <div className="rounded-xl bg-muted border border-border p-3 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">Stuck?</span> Describe it and let AI draw the whole system.
          </p>
        </div>
      </div>
    </aside>
  );
};
