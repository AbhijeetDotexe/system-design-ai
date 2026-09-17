import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { SYSTEM_TEMPLATES } from "@systemcraft/shared";
import { 
  Plus, Search, Sparkles, Folder, Clock, MoreVertical, 
  Copy, Trash2, ExternalLink, LogOut, LayoutTemplate, Layers
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"diagrams" | "templates">("diagrams");

  // Fetch Diagrams
  const { data: diagrams = [], isLoading } = useQuery({
    queryKey: ["diagrams", search],
    queryFn: async () => {
      const res = await api.get(`/diagrams?search=${encodeURIComponent(search)}`);
      return res.data.data;
    }
  });

  // Create New Blank Diagram
  const createMutation = useMutation({
    mutationFn: async (title: string = "Untitled Architecture") => {
      const res = await api.post("/diagrams", { title });
      return res.data.data;
    },
    onSuccess: (newDiagram) => {
      navigate(`/editor/${newDiagram._id}`);
    }
  });

  // Create From Template
  const createFromTemplateMutation = useMutation({
    mutationFn: async (template: typeof SYSTEM_TEMPLATES[0]) => {
      const res = await api.post("/diagrams", {
        title: template.document.title,
        document: template.document
      });
      return res.data.data;
    },
    onSuccess: (newDiagram) => {
      navigate(`/editor/${newDiagram._id}`);
    }
  });

  // Delete Diagram
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/diagrams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagrams"] });
    }
  });

  // Duplicate Diagram
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/diagrams/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagrams"] });
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0c10] text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-white/5 bg-[#0d1117] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            SystemCraft<span className="text-indigo-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {user?.avatar && (
              <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full border border-white/10" />
            )}
            <span className="font-medium">{user?.name}</span>
          </div>

          <button
            onClick={() => logout().then(() => navigate("/"))}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Banner with Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Software Architecture & System Diagrams
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Draw manually, choose from production templates, or ask Gemini AI to generate complete distributed architectures.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => createMutation.mutate("Untitled Architecture")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Diagram</span>
            </button>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("diagrams")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "diagrams"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>My Diagrams</span>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "templates"
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>System Templates</span>
            </button>
          </div>

          {activeTab === "diagrams" && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search diagrams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Tab: Diagrams List */}
        {activeTab === "diagrams" && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : diagrams.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
                  <Layers className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">No diagrams found</h3>
                  <p className="text-xs text-slate-400">
                    Create your first system design diagram or let Gemini generate one automatically.
                  </p>
                </div>
                <button
                  onClick={() => createMutation.mutate("New Architecture Diagram")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Diagram
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {diagrams.map((diag: any) => (
                  <div
                    key={diag._id}
                    onClick={() => navigate(`/editor/${diag._id}`)}
                    className="group relative bg-[#0f131a] hover:bg-[#131924] border border-white/5 hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition-all shadow-md hover:shadow-xl hover:shadow-indigo-500/5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                        <Layers className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => duplicateMutation.mutate(diag._id)}
                          title="Duplicate"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(diag._id)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {diag.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated {new Date(diag.updatedAt).toLocaleDateString()}</span>
                        <span>• v{diag.version || 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: System Templates */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SYSTEM_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => createFromTemplateMutation.mutate(tmpl)}
                className="group relative bg-[#0f131a] hover:bg-[#131924] border border-white/5 hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition-all shadow-md hover:shadow-xl space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30">
                    {tmpl.category}
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tmpl.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
