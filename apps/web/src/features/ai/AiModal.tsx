import React, { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { api } from "../../services/api";
import { Sparkles, X, Loader2, ArrowRight, Lightbulb, AlertCircle } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Design a scalable food delivery application with customers, restaurants, drivers, payments, Redis, PostgreSQL, Kafka and notifications.",
  "Design an Instagram-like photo sharing architecture with Cloudflare CDN, S3 storage, precomputed Redis feed, and Kafka event streaming.",
  "Design a high-throughput URL Shortener with Redis cache cluster, PostgreSQL replica, and ClickHouse analytics pipeline.",
  "Add Redis cache and Kafka event bus to this architecture.",
  "Add Cloudflare CDN and Rate Limiting load balancer in front of API."
];

export const AiModal: React.FC = () => {
  const {
    isAiModalOpen,
    setAiModalOpen,
    document,
    setDiagram,
    diagramId
  } = useEditorStore();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isAiModalOpen) return null;

  const isExistingDiagram = document.nodes.length > 0;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    setStep("Understanding requirements & distributed constraints...");
    const t1 = setTimeout(() => setStep("Designing microservices & database schemas..."), 1200);
    const t2 = setTimeout(() => setStep("Wiring message buses & network flows..."), 2400);
    const t3 = setTimeout(() => setStep("Applying optimal Dagre graph layout..."), 3600);

    try {
      if (isExistingDiagram) {
        const res = await api.post("/ai/modify-diagram", {
          instruction: prompt,
          currentDiagram: document
        });
        const updatedDoc = res.data.data;
        setDiagram(diagramId, updatedDoc);
      } else {
        const res = await api.post("/ai/generate-diagram", {
          prompt
        });
        const newDoc = res.data.data;
        setDiagram(diagramId, newDoc);
      }

      setAiModalOpen(false);
      setPrompt("");
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(
        err.response?.data?.error?.message ||
        "Could not generate diagram. Please verify Gemini configuration or simplify the prompt."
      );
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setLoading(false);
      setStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0f131a] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                {isExistingDiagram ? "Modify Architecture with Gemini" : "Generate System Architecture"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isExistingDiagram
                  ? "Describe modifications (e.g. 'Add Redis cache between API and DB')"
                  : "Type requirements and let Gemini create full production architecture"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiModalOpen(false)}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Prompt Input Form */}
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              placeholder={
                isExistingDiagram
                  ? "e.g. Add Redis cache between API servers and PostgreSQL, and add Kafka for async event logging."
                  : "e.g. Design a scalable food delivery application with customers, restaurants, drivers, payments, Redis, PostgreSQL, Kafka and notifications."
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
            <div className="absolute right-3 bottom-3 text-[10px] text-slate-400">
              Enter to generate • Shift+Enter for newline
            </div>
          </div>

          {/* Loading Animation & Step */}
          {loading && (
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
              <div className="text-xs font-medium text-indigo-700 dark:text-indigo-200 animate-pulse">
                {step || "Consulting Google Gemini System Architect..."}
              </div>
            </div>
          )}

          {/* Quick Example Suggestions */}
          {!loading && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Example Prompts:
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className="w-full text-left text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{ex}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
            <button
              type="button"
              onClick={() => setAiModalOpen(false)}
              disabled={loading}
              className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Architecture...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isExistingDiagram ? "Apply Modification" : "Generate Diagram"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
