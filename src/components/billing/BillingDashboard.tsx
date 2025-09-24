import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Loader2, Receipt, CreditCard, DollarSign, Download, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { stripePromise } from '@/lib/stripe';
import { getErrorMessage } from '@/types/stripe';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethodsManager } from './PaymentMethodsManager';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PaymentRecord {
  id: string;
  booking_id: string;
  amount_captured: number;
  amount_preauth: number;
  status: string;
  created_at: string;
  provider: string;
  charge_id: string | null;
  booking?: {
    pickup_address: string;
    start_ts: string;
  };
}

interface PayoutRecord {
  id: string;
  guard_id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  guard?: {
    user?: {
      first_name: string;
      last_name: string;
    };
  };
}

export const BillingDashboard: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');
  const { toast } = useToast();

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          bookings:booking_id (
            pickup_address,
            start_ts
          )
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }

      // Fetch payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select(`
          *,
          guards:guard_id (
            user:user_id (
              first_name,
              last_name
            )
          )
        `)
        .order('period_start', { ascending: false });

      if (payoutsError) {
        throw payoutsError;
      }

      setPayments(paymentsData || []);
      setPayouts(payoutsData || []);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to fetch billing data');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount / 100);
  };

  const totalPayments = payments.reduce((sum, p) => sum + (p.amount_captured || 0), 0);
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

  useEffect(() => {
    fetchBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayments)}</div>
            <p className="text-xs text-muted-foreground">
              {payments.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayouts * 100)}</div>
            <p className="text-xs text-muted-foreground">
              {payouts.length} payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPayments - (totalPayouts * 100))}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue after payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Details */}
      <Card>
        <CardHeader>
          <CardTitle>Billing & Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payments">Payment History</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="space-y-4">
              <ScrollArea className="h-96">
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment records found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(payment.status)}
                          <div>
                            <div className="font-medium">
                              {formatCurrency(payment.amount_captured || payment.amount_preauth || 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.booking?.pickup_address || 'Booking Payment'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-4">
              <ScrollArea className="h-96">
                {payouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payout records found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(payout.status)}
                          <div>
                            <div className="font-medium">
                              {formatCurrency(payout.amount * 100)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Guard: {payout.guard?.user?.first_name} {payout.guard?.user?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(payout.status)}>
                          {payout.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="methods">
              <Elements stripe={stripePromise}>
                <PaymentMethodsManager />
              </Elements>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};