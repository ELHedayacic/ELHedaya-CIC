import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ConfigNotice } from "@/components/shared/ConfigNotice";
import { GeometricBackdrop } from "@/components/shared/GeometricBackdrop";
import { isSupabaseConfigured } from "@/lib/supabase";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GeometricBackdrop />
    <ErrorBoundary>
      {isSupabaseConfigured ? (
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      ) : (
        <ConfigNotice />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
