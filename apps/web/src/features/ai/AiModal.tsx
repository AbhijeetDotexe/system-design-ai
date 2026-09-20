import React, { useState } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { api } from "../../services/api";
import { Sparkles, X, Loader2, ArrowRight, Lightbulb, AlertCircle, Shrink } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Food delivery app with customers, drivers, payments and live tracking.",
  "Photo sharing app with feed, uploads and push notifications.",
  "URL shortener with cache and analytics.",
  "Add Redis cache between API and database.",
  "Add a message queue for background jobs.",
];

type Detail = "simple" | "standard" | "detailed";

const DETAIL_OPTIONS: { id: Detail; label: string; hint: string }[] = [
  { id: "simple", label: "Simple", hint: "≤7 boxes" },
  { id: "standard", label: "Standard", hint: "≤11 boxes" },
  { id: "detailed", label: "Detailed", hint: "≤15 boxes" },
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
  const [detail, setDetail] = useState<Detail>("standard");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isAiModalOpen) return null;

  const isExistingDiagram = document.nodes.length > 0;
  const isComplex = document.nodes.length > 12;

  const fitAfter = () => {
    requestAnimationFrame(() => {
      try {
        useEditorStore.getState().fitToScreen();
      } catch {
        // canvas may not be mounted (share view) — ignore
      }
    });
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    setStep("Understanding your idea...");
    const t1 = setTimeout(() => setStep("Picking the core boxes..."), 1200);
    const t2 = setTimeout(() => setStep("Connecting them simply..."), 2400);
    const t3 = setTimeout(() => setStep("Tidying up the layout..."), 3600);

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
          prompt,
          detail
        });
        const newDoc = res.data.data;
        setDiagram(diagramId, newDoc);
      }

      setAiModalOpen(false);
      setPrompt("");
      fitAfter();
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(
        err.response?.data?.error?.message ||
        "Could not generate diagram. Try a shorter description."
      );
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setLoading(false);
      setStep("");
    }
  };

  const handleSimplify = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setStep("Merging duplicates, keeping the core...");

    try {
      const res = await api.post("/ai/simplify-diagram", {
        currentDiagram: document,
        maxNodes: 8
      });
      setDiagram(diagramId, res.data.data);
      setAiModalOpen(false);
      setPrompt("");
      fitAfter();
    } catch (err: any) {
      console.error("Simplify Error:", err);
      setError(err.response?.data?.error?.message || "Could not simplify this diagram.");
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl p-6 shadow-card space-y-4 animate-pop-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold">
                {isExistingDiagram ? "Modify with AI" : "Generate with AI"}
              </h2>
              <p className="text-[12px] text-muted-foreground">
                {isExistingDiagram
                  ? "Describe a small change — AI keeps the rest untouched."
                  : "Describe your idea briefly — AI draws a few clear boxes."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiModalOpen(false)}
            disabled={loading}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simplify banner for overloaded diagrams */}
        {isComplex && !loading && (
          <button
            onClick={handleSimplify}
            className="w-full flex items-center gap-2.5 p-3 rounded-lg bg-muted border border-border hover:border-muted-foreground/30 transition text-left"
          >
            <Shrink className="w-4 h-4 shrink-0" />
            <span className="text-[12.5px]">
              <span className="font-semibold">This diagram has {document.nodes.length} boxes — hard to read. </span>
              <span className="text-muted-foreground">Click to shrink it to 8 core boxes.</span>
            </span>
          </button>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-[12px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Prompt Input Form */}
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              placeholder={
                isExistingDiagram
                  ? "e.g. Add Redis cache between API and database."
                  : "e.g. Food delivery app with customers, drivers and payments."
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              className="w-full p-3.5 bg-muted/60 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="absolute right-3 bottom-3 text-[10px] text-muted-foreground">
              Enter to generate • Shift+Enter for newline
            </div>
          </div>

          {/* Detail selector — only for fresh generations */}
          {!isExistingDiagram && !loading && (
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-medium text-muted-foreground">Detail:</span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
                {DETAIL_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setDetail(o.id)}
                    title={o.hint}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition ${
                      detail === o.id
                        ? "bg-card text-foreground shadow-card border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {o.label} <span className="opacity-60 font-normal hidden sm:inline">{o.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Animation & Step */}
          {loading && (
            <div className="p-3 rounded-lg bg-muted border border-border flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <div className="text-[12.5px] font-medium animate-pulse">
                {step || "Working..."}
              </div>
            </div>
          )}

          {/* Quick Example Suggestions */}
          {!loading && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> Try one:
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className="w-full text-left text-[12px] p-2 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{ex}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setAiModalOpen(false)}
              disabled={loading}
              className="px-4 py-2 rounded-md hover:bg-muted text-[13px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40 text-[13px] font-medium transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drawing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isExistingDiagram ? "Apply change" : "Generate"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
