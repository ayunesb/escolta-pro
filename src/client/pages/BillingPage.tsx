import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import BottomNav from '@/components/mobile/BottomNav';
import { Receipt, DollarSign, CreditCard, Building, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMXN } from '@/utils/pricing';

interface BillingPageProps {
  navigate: (path: string) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ navigate }) => {
  const { hasRole } = useAuth();
  
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
                      <Button onClick={() => navigate('/account/bank-setup')}>
                        <Banknote className="h-4 w-4 mr-2" />
                        Add Bank Account
                      </Button>
                    </div>
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