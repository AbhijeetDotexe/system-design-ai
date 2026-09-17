import React, { useState } from "react";
import { ARCHITECTURE_CATEGORIES } from "./nodeConfig";
import { 
  ChevronDown, ChevronRight, Search, 
  Layers, Database, Network, Server, Cpu, Box, HardDrive, Zap, Globe, Smartphone, KeyRound, Activity
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (title: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleDragStart = (e: React.DragEvent, item: any) => {
    e.dataTransfer.setData("application/systemcraft-node", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-64 h-full bg-[#eef0f3] dark:bg-[#0d1117] border-r border-slate-200 dark:border-white/5 flex flex-col z-10 shrink-0 transition-colors">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-300 dark:border-white/5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Component Library List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {ARCHITECTURE_CATEGORIES.map((cat) => {
          const filteredItems = cat.items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            item.tech.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredItems.length === 0) return null;
          const isCollapsed = collapsedCategories[cat.title];

          return (
            <div key={cat.title} className="space-y-1">
              <button
                onClick={() => toggleCategory(cat.title)}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                <span>{cat.title}</span>
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {filteredItems.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-grab active:cursor-grabbing transition-all group shadow-sm"
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 border border-black/5 dark:border-white/10"
                        style={{ backgroundColor: item.bgColor, borderColor: item.borderColor }}
                      >
                        <span className={item.color}>●</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {item.tech}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
