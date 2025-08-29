import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { NativeWrapper } from "@/components/mobile/NativeWrapper";
import ClientRouter from "./ClientRouter";

const ClientApp = () => {
  
  return (
    <AccessibilityProvider>
      <NativeWrapper>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ClientRouter />
            {/* Overlays portal container */}
            <div id="overlays" />
          </TooltipProvider>
        </AuthProvider>
      </NativeWrapper>
    </AccessibilityProvider>
  );
};

export default ClientApp;