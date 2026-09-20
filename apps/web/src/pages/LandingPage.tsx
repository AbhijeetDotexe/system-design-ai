import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import {
  Sparkles, Layers, Zap, ArrowRight,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const handleStart = () => {
    navigate(isSignedIn ? "/dashboard" : "/register");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden relative">
      {/* Navigation — Notion flat bar */}
      <header className="h-16 border-b border-border bg-card sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">
            SystemCraft AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-[13px] font-medium transition-all"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90 text-[13px] font-medium transition-all"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 pb-16 px-6 text-center max-w-3xl mx-auto space-y-6 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-[12px] font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI system architect, powered by Gemini</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
          Design systems by just describing them.
        </h1>

        <p className="text-[15px] sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Turn plain English into clean architecture diagrams.
          Drag blocks, connect services, or let AI draft the whole thing.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-foreground text-background hover:opacity-90 font-medium text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Start designing free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/editor/new")}
            className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-card hover:bg-muted border border-border font-medium text-sm transition-all"
          >
            Open scratchpad
          </button>
        </div>

        {/* Preview */}
        <div className="pt-10 text-left">
          <div className="relative rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline">Example: food delivery platform</span>
                <span className="sm:hidden">Food delivery platform</span>
              </div>
              <div className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground">
                1-click tidy layout
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 py-2">
              {[
                ["Clients", "Flutter + Web", "Customer & driver apps"],
                ["API gateway", "Kong", "Auth & rate limits"],
                ["Cache & geo", "Redis", "Driver tracking"],
                ["Data store", "PostgreSQL 16", "Orders state machine"],
              ].map(([k, v, d]) => (
                <div key={k} className="p-3.5 rounded-lg bg-muted/50 border border-border space-y-1">
                  <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{k}</div>
                  <div className="text-[13px] font-semibold">{v}</div>
                  <div className="text-[11px] text-muted-foreground">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-6 max-w-5xl mx-auto border-t border-border z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Sparkles className="w-5 h-5" />, t: "Describe → diagram", d: "Gemini infers gateways, services, caches, databases and wires them together with typed connections." },
            { icon: <Layers className="w-5 h-5" />, t: "Drag, drop, connect", d: "17 infrastructure blocks. Hover any card for connect dots, right-click for more, or click + to place." },
            { icon: <Zap className="w-5 h-5" />, t: "Always tidy & shareable", d: "Auto-layout removes overlaps, autosave keeps you safe, and one link shares a clean read-only view." },
          ].map((f) => (
            <div key={f.t} className="p-6 rounded-xl bg-card border border-border space-y-3 hover:border-muted-foreground/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-muted border border-border text-muted-foreground flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="text-[15px] font-semibold tracking-tight">{f.t}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-border py-8 text-center text-[12px] text-muted-foreground z-10">
        SystemCraft AI — React · Vite · Node.js · Gemini
      </footer>
    </div>
  );
};
