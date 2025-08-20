import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51QWl3eEdgYwNlsYGvr5Qno2RnZf4oScOpNMZW5WHUKv2VL4qNBKQDV3g3QUa8PJ3vw2GNObMZUEWdLuVcjrTl8gE00CmMCsFeD');

export { stripePromise };

export interface PaymentMethod {
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

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface PaymentHistory {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at: string;
  description?: string;
}