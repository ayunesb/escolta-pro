import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientRouter from "./ClientRouter";

const ClientApp = () => {
  console.log('✅ Client App component rendered');
  
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ClientRouter />
        {/* Overlays portal container */}
        <div id="overlays" />
      </TooltipProvider>
    </AuthProvider>
  );
};

export default ClientApp;