import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import { useEditorStore } from "../stores/editorStore";
import { api } from "../services/api";
import { Canvas } from "../features/editor/Canvas";
import { Sparkles, Loader2 } from "lucide-react";

interface AuthPageProps {
  isRegister?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ isRegister = false }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-6 z-10">
        <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-semibold text-base tracking-tight text-foreground">
          SystemCraft AI
        </span>
      </div>

      {/* Clerk Auth Card */}
      <div className="relative z-10 flex justify-center w-full max-w-md">
        {isRegister ? (
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
          />
        ) : (
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            fallbackRedirectUrl="/dashboard"
          />
        )}
      </div>

      {/* Back to Home Link */}
      <div className="mt-6 z-10 text-center">
        <Link
          to="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
};

export const ShareViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { setDiagram } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      <div className="h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />
        Loading shared architecture...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <Link to="/" className="px-4 py-2 bg-primary rounded-xl text-primary-foreground text-[12.5px] font-bold">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <header className="h-12 bg-card border-b border-border px-4 flex items-center justify-between text-[12.5px]">
        <div className="flex items-center gap-2 font-bold">
          <Sparkles className="w-4 h-4 text-primary" /> Shared architecture (read-only)
        </div>
        <Link to="/" className="px-3 py-1.5 bg-primary hover:bg-primary-hover rounded-xl text-primary-foreground font-bold">
          Create your own
        </Link>
      </header>
      <main className="flex-1 relative overflow-hidden">
        <Canvas />
      </main>
    </div>
  );
};
