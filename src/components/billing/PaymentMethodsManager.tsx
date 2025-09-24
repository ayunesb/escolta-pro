import { useState, useEffect, useCallback } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Plus, CreditCard, Trash2, Loader2 } from 'lucide-react';

import { PaymentMethodForm } from './PaymentMethodForm';

import { supabase } from '@/integrations/supabase/client';
import { stripePromise } from '@/lib/stripe';
import { getErrorMessage } from '@/types/stripe';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PaymentMethod {
  id: string;
  type: 'card';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created: number;
}

interface PaymentMethodsManagerProps {
  _customerId?: string;
}

export const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({
  _customerId,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get_payment_methods');
      if (error) {
        throw new Error(getErrorMessage(error, 'Failed to fetch'));
      }

      setPaymentMethods(data?.payment_methods || []);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to fetch payment methods');
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deletePaymentMethod = async (paymentMethodId: string) => {
    setDeleting(paymentMethodId);
    
    try {
      const { error } = await supabase.functions.invoke('delete_payment_method', {
        body: { payment_method_id: paymentMethodId },
      });

      if (error) {
        throw new Error(getErrorMessage(error, 'Failed to delete'));
      }

      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
      toast({
        title: 'Success',
        description: 'Payment method removed successfully',
      });
    } catch (err: unknown) {
      const errMsg = getErrorMessage(err, 'Failed to delete payment method');
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handlePaymentMethodAdded = () => {
    setShowAddDialog(false);
    fetchPaymentMethods();
    toast({
      title: 'Success',
      description: 'Payment method added successfully',
    });
  };

  useEffect(() => {
    void fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment Methods</CardTitle>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <Elements stripe={stripePromise}>
              <PaymentMethodForm onSuccess={handlePaymentMethodAdded} />
            </Elements>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Alert>
            <AlertDescription>
              No payment methods found. Add a payment method to make bookings.
            </AlertDescription>
          </Alert>
        ) : (
          paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {method.card?.brand} ****{method.card?.last4}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {method.card?.exp_month}/{method.card?.exp_year}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Added {new Date(method.created * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePaymentMethod(method.id)}
                disabled={deleting === method.id}
              >
                {deleting === method.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};