import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth, RedirectToSignIn } from "@clerk/react";
import { setClerkTokenGetter } from "./services/api";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage, ShareViewPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditorPage } from "./pages/EditorPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000
    }
  }
});

const AuthTokenSync: React.FC = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);

  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthTokenSync />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/*" element={<AuthPage isRegister={false} />} />
          <Route path="/register/*" element={<AuthPage isRegister={true} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route path="/share/:token" element={<ShareViewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
