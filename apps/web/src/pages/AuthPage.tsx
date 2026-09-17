import React, { useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useEditorStore } from "../stores/editorStore";
import { api } from "../services/api";
import { Canvas } from "../features/editor/Canvas";
import { Sparkles, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

interface AuthPageProps {
  isRegister?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ isRegister = false }) => {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        "Authentication failed. Please check your credentials."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f131a] border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white">
            {isRegister ? "Create SystemCraft Account" : "Welcome Back"}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister
              ? "Start generating and drawing system architecture diagrams."
              : "Sign in to access your diagrams and architecture workspaces."}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? "Create Account" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          {isRegister ? (
            <span>
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-400 hover:underline">
                Sign In
              </Link>
            </span>
          ) : (
            <span>
              Don't have an account yet?{" "}
              <Link to="/register" className="text-indigo-400 hover:underline">
                Create Account
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const ShareViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { setDiagram } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    api
      .get(`/share/${token}`)
      .then((res: any) => {
        setDiagram(null, res.data.data.document);
      })
      .catch(() => setError("Shared architecture diagram not found or link has expired."))
      .finally(() => setLoading(false));
  }, [token, setDiagram]);

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0c10] flex items-center justify-center text-slate-400 text-sm">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-400" />
        Loading Shared Architecture...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#0a0c10] flex flex-col items-center justify-center text-center p-4">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <Link to="/" className="px-4 py-2 bg-indigo-600 rounded-lg text-white text-xs">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c10]">
      <header className="h-12 bg-[#0d1117] border-b border-white/5 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Sparkles className="w-4 h-4 text-indigo-400" /> Read-only Shared Architecture Viewer
        </div>
        <Link to="/" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-medium">
          Create Your Own
        </Link>
      </header>
      <main className="flex-1 relative overflow-hidden">
        <Canvas />
      </main>
    </div>
  );
};
