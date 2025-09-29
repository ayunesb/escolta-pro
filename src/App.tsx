import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.warn('✅ Main App component rendered');
  // In demo mode, if the main shell is opened with a role hint, push users to the right entry HTML.
  if (typeof window !== 'undefined' && import.meta.env.VITE_DEMO_MODE === 'true') {
    const isRootShell = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
    if (isRootShell) {
      const qs = window.location.search || '';
      const as = new URLSearchParams(qs).get('as');
      if (as === 'company') window.location.replace(`/admin.html${qs}`);
      else if (as === 'guard') window.location.replace(`/guard.html${qs}`);
      else if (as === 'client') window.location.replace(`/client.html${qs}`);
    }
  }
  
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Support direct navigation to /index.html by redirecting to root while preserving query params */}
                    <Route
                      path="/index.html"
                      element={<Navigate to={`/${typeof window !== 'undefined' ? window.location.search : ''}`} replace />}
                    />
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/client" element={<Navigate to="/client.html" replace />} />
                    <Route path="/guard" element={<Navigate to="/guard.html" replace />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
};

export default App;
