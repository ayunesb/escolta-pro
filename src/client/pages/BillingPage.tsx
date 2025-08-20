import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import BottomNav from '@/components/mobile/BottomNav';
import { Receipt } from 'lucide-react';

interface BillingPageProps {
  navigate: (path: string) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 pb-20">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-6 w-6" />
              Billing & Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Manage your payments, billing history, and payment methods.
            </p>
          </CardContent>
        </Card>

        <BillingDashboard />
      </div>

      <BottomNav currentPath="/billing" navigate={navigate} />
    </div>
  );
};

export default BillingPage;