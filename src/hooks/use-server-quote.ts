import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QuoteRequest {
  guard_id: string;
  hours: number;
  armed_required: boolean;
  vehicle_required: boolean;
  armored_required: boolean;
  client_total_cents: number;
}

interface QuoteResponse {
  valid: boolean;
  quote: {
    subtotal: number;
    serviceFee: number;
    total: number;
    effectiveHours: number;
    breakdown: {
      base: number;
      armed: number;
      vehicle: number;
      armored: number;
    };
  };
  error?: string;
}

export const useServerQuote = () => {
  const [loading, setLoading] = useState(false);
  const [lastValidatedQuote, setLastValidatedQuote] = useState<QuoteResponse | null>(null);
  const { toast } = useToast();

  const validateQuote = async (request: QuoteRequest): Promise<QuoteResponse | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('server_quote_validation', {
        body: request
      });

      if (error) {
        throw error;
      }

      const response = data as QuoteResponse;
      
      if (response.valid) {
        setLastValidatedQuote(response);
        toast({
          title: "Quote Validated",
          description: "Server-side pricing verification successful"
        });
      } else {
        toast({
          variant: "destructive", 
          title: "Quote Mismatch",
          description: response.error || "Server and client quotes don't match"
        });
      }

      return response;
    } catch (error) {
      console.error('Quote validation error:', error);
      toast({
        variant: "destructive",
        title: "Validation Error", 
        description: "Failed to validate quote with server"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    validateQuote,
    loading,
    lastValidatedQuote,
    clearValidatedQuote: () => setLastValidatedQuote(null)
  };
};