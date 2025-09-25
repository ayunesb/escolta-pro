import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/types/stripe';
interface PaymentMethodFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: 'hsl(var(--foreground))',
      '::placeholder': {
        color: 'hsl(var(--muted-foreground))',
      },
    },
  },
};

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        throw new Error(getErrorMessage(stripeError, 'Failed to create payment method'));
      }

      // Save payment method via edge function
      const { error: saveError } = await supabase.functions.invoke('save_payment_method', {
        body: {
          payment_method_id: paymentMethod.id,
        },
      });

      if (saveError) {
        throw new Error(getErrorMessage(saveError, 'Failed to save payment method'));
      }

      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to add payment method');

      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-background">
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add Payment Method'
        )}
      </Button>
    </form>
  );
};