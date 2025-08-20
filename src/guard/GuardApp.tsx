import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import GuardRouter from "./GuardRouter";

const queryClient = new QueryClient();

const GuardApp = () => {
  console.log('✅ Guard App component rendered');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="blindado-guard-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <GuardRouter />
            {/* Overlays portal container */}
            <div id="overlays" />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default GuardApp;