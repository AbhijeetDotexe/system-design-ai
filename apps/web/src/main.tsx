import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { App } from "./App";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "hsl(205, 55%, 57%)",
          colorPrimaryForeground: "#ffffff",
          colorBackground: "hsl(0, 0%, 12.5%)",
          colorForeground: "hsl(60, 4%, 90%)",
          colorMutedForeground: "hsl(0, 0%, 60%)",
          colorInput: "hsl(0, 0%, 14%)",
          colorInputForeground: "hsl(60, 4%, 90%)",
          colorNeutral: "hsl(0, 0%, 25%)",
          borderRadius: "0.75rem",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        },
        elements: {
          card: "shadow-card border border-[hsl(0,0%,18%)]",
          formButtonPrimary: "bg-[hsl(205,55%,57%)] hover:bg-[hsl(205,55%,63%)] text-white font-semibold",
          footerActionLink: "text-[hsl(205,55%,57%)] hover:text-[hsl(205,55%,63%)]",
          socialButtonsBlockButton: "border-[hsl(0,0%,18%)] hover:bg-[hsl(0,0%,16%)]",
        },
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
