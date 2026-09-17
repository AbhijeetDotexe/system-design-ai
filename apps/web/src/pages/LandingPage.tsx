import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { 
  Sparkles, Layers, ShieldCheck, Zap, ArrowRight, 
  Cpu, GitFork, Database, CheckCircle2, Download
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-foreground flex flex-col selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <header className="h-16 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            SystemCraft<span className="text-indigo-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 text-center max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Powered by Google Gemini 2.5 Distributed System Architect</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
          Design Systems. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Describe Them. AI Draws Them.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Turn natural-language requirements into production-grade software architecture diagrams.
          Interact, edit manually, and collaborate on a high-performance visual canvas.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Start Designing Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/editor/new")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-semibold text-sm transition-all"
          >
            Open Scratchpad Canvas
          </button>
        </div>

        {/* Hero Interactive Diagram Preview Mockup */}
        <div className="pt-10">
          <div className="relative rounded-2xl border border-white/10 bg-[#0d1117] p-4 sm:p-6 shadow-2xl overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Live System: Real-time Food Delivery & Dispatch Platform</span>
              </div>
              <div className="text-[11px] px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                Dagre Auto-Layout
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-blue-500/30 space-y-1">
                <div className="text-[10px] font-mono text-blue-400 font-semibold">CLIENTS</div>
                <div className="text-xs font-bold text-white">Flutter Mobile & Web</div>
                <div className="text-[10px] text-slate-400">Customer & Driver apps</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-1">
                <div className="text-[10px] font-mono text-indigo-400 font-semibold">API GATEWAY</div>
                <div className="text-xs font-bold text-white">Kong Gateway</div>
                <div className="text-[10px] text-slate-400">JWT Auth & Rate Limiting</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-red-500/30 space-y-1">
                <div className="text-[10px] font-mono text-red-400 font-semibold">CACHE & GEO</div>
                <div className="text-xs font-bold text-white">Redis Cluster</div>
                <div className="text-[10px] text-slate-400">Geospatial driver tracking</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 font-semibold">DATA STORE</div>
                <div className="text-xs font-bold text-white">PostgreSQL 16</div>
                <div className="text-[10px] text-slate-400">ACID Order state machine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0f131a] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Google Gemini AI Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Describe requirements in plain English. Gemini infers caching, message brokers, databases, and microservices with typed connections.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f131a] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Architecture Component Library</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated components for PostgreSQL, MongoDB, Redis, Kafka, Kubernetes, AWS, Kong, CDN, and microservices with instant drag-and-drop.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f131a] border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Automatic Dagre Layout</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No overlapping nodes or tangled edges. Automatic hierarchical graph layout positions everything cleanly from Left-to-Right or Top-to-Bottom.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-8 text-center text-xs text-slate-500">
        SystemCraft AI — Production Architecture Platform. Built with React, Vite, Node.js & Google Gemini.
      </footer>
    </div>
  );
};
