import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk, UserButton } from "@clerk/react";
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
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { syncUser, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"diagrams" | "templates">("diagrams");

  // Sync user with backend
  React.useEffect(() => {
    if (clerkUser) {
      syncUser({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.firstName || "User",
        avatar: clerkUser.imageUrl
      });
    }
  }, [clerkUser, syncUser]);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">
            SystemCraft AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12.5px]">
            <UserButton />
            <span className="font-medium hidden sm:inline text-foreground">
              {clerkUser?.fullName || clerkUser?.primaryEmailAddress?.emailAddress}
            </span>
          </div>

          <button
            onClick={() => {
              logout();
              signOut(() => navigate("/"));
            }}
            className="p-2 rounded-lg hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Banner with Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Your architectures
            </h1>
            <p className="text-[13px] md:text-sm text-muted-foreground">
              Draw by hand, start from a template, or describe it and let AI generate the whole system.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => createMutation.mutate("Untitled Architecture")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-foreground text-background hover:opacity-90 text-[13px] font-medium transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Diagram</span>
            </button>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("diagrams")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === "diagrams"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>My diagrams</span>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === "templates"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>
          </div>

          {activeTab === "diagrams" && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search diagrams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[12.5px] bg-muted/70 border border-border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
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
                  <div key={i} className="h-44 rounded-3xl bg-muted border border-border animate-pulse" />
                ))}
              </div>
            ) : diagrams.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                  <Layers className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[15px] font-extrabold">No diagrams yet</h3>
                  <p className="text-[12.5px] text-muted-foreground">
                    Create a blank canvas, start from a template, or let AI generate one.
                  </p>
                </div>
                <button
                  onClick={() => createMutation.mutate("New Architecture Diagram")}
                  className="px-4 py-2.5 rounded-md bg-foreground text-background hover:opacity-90 text-[13px] font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create diagram
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {diagrams.map((diag: any) => (
                  <div
                    key={diag._id}
                    onClick={() => navigate(`/editor/${diag._id}`)}
                    className="group relative bg-card hover:border-muted-foreground/30 border border-border rounded-xl p-5 cursor-pointer transition-all shadow-card space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                        <Layers className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => duplicateMutation.mutate(diag._id)}
                          title="Duplicate"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(diag._id)}
                          title="Delete"
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold transition-colors truncate">
                        {diag.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
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
                className="group relative bg-card hover:border-muted-foreground/30 border border-border rounded-xl p-5 cursor-pointer transition-all shadow-card space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground">
                    {tmpl.category}
                  </span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    {tmpl.name}
                  </h3>
                  <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tmpl.tags.map((t) => (
                    <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
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
