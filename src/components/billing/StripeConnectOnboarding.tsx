import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard } from "lucide-react";

interface StripeConnectOnboardingProps {
  accountType: 'freelancer' | 'company';
  companyId?: string;
}

export const StripeConnectOnboarding = ({ accountType, companyId }: StripeConnectOnboardingProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOnboarding = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('connect_stripe_onboarding', {
        body: {
          account_type: accountType,
          company_id: companyId
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe onboarding in new tab for mobile compatibility
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start onboarding process. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center gap-2 justify-center">
          <CreditCard className="h-5 w-5" />
          Setup Payments
        </CardTitle>
        <CardDescription>
          Connect your bank account to receive payments securely through Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleOnboarding}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            'Setup Bank Account'
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Powered by Stripe. Your financial information is secure and encrypted.
        </p>
      </CardContent>
    </Card>
  );
};