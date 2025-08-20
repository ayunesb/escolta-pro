import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import BottomNav from '@/components/mobile/BottomNav';
import { Receipt, DollarSign, CreditCard, Building, Banknote, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMXN } from '@/utils/pricing';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BillingPageProps {
  navigate: (path: string) => void;
}

interface Payout {
  id: string;
  amount_mxn_cents: number;
  status: 'pending' | 'paid' | 'failed';
  period_start: string;
  period_end: string;
  created_at: string;
}

export const BillingPage: React.FC<BillingPageProps> = ({ navigate }) => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  
  // Determine billing content based on user role
  const getBillingContent = () => {
    if (hasRole('freelancer') || hasRole('company_admin')) {
      return {
        title: 'Payouts & Earnings',
        description: 'View your earnings, payouts, and manage your bank account for receiving payments.',
        icon: <DollarSign className="h-6 w-6" />,
        showPayouts: true
      };
    }
    
    // Default for clients
    return {
      title: 'Billing & Payments',
      description: 'Manage your payments, billing history, and payment methods.',
      icon: <Receipt className="h-6 w-6" />,
      showPayouts: false
    };
  };

  // Load payouts for guards/companies
  const loadPayouts = async () => {
    if (!hasRole('freelancer') && !hasRole('company_admin')) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('payouts_list', {
        body: {} // Company ID would be passed here if needed
      });
      
      if (error) throw error;
      setPayouts(data.payouts || []);
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payouts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Connect onboarding
  const handleConnectOnboarding = async () => {
    setConnectLoading(true);
    try {
      const scope = hasRole('company_admin') ? 'company' : 'freelancer';
      const { data, error } = await supabase.functions.invoke('connect_onboarding_link', {
        body: { scope }
      });
      
      if (error) throw error;
      
      // Open Stripe onboarding in new tab
      window.open(data.url, '_blank');
      
      toast({
        title: 'Success',
        description: 'Opening Stripe Connect onboarding...'
      });
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      toast({
        title: 'Error',
        description: 'Failed to create onboarding link',
        variant: 'destructive'
      });
    } finally {
      setConnectLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const billingContent = getBillingContent();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 pb-20">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {billingContent.icon}
              {billingContent.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {billingContent.description}
            </p>
            
            {/* Bank Account Management for Guards/Companies */}
            {(hasRole('freelancer') || hasRole('company_admin')) && (
              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building className="h-5 w-5" />
                      Bank Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Connect your bank account to receive payouts
                        </p>
                        <Badge variant="outline" className="mt-2">
                          Not Connected
                        </Badge>
                      </div>
                      <Button 
                        onClick={handleConnectOnboarding}
                        disabled={connectLoading}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        {connectLoading ? 'Setting up...' : 'Connect Bank Account'}
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Payouts List */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5" />
                      Recent Payouts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-sm text-muted-foreground">Loading payouts...</p>
                    ) : payouts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No payouts yet</p>
                    ) : (
                      <div className="space-y-3">
                        {payouts.map((payout) => (
                          <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{formatMXN(payout.amount_mxn_cents)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payout.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                payout.status === 'paid' ? 'default' : 
                                payout.status === 'pending' ? 'secondary' : 
                                'destructive'
                              }
                            >
                              {payout.status.toUpperCase()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <BillingDashboard />
      </div>

      <BottomNav currentPath="/billing" navigate={navigate} />
    </div>
  );
};

export default BillingPage;