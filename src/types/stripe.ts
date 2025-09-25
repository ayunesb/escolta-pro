// src/types/stripe.ts
import type {
  StripeError,
  PaymentIntent,
  SetupIntent,
  PaymentMethod,
  Stripe,
  StripeElements
} from '@stripe/stripe-js';
// Minimal local declaration for the card element change event to avoid
// depending on specific exported type names from @stripe/react-stripe-js.
export type CardElementChangeEvent = {
  complete?: boolean;
  error?: { message?: string } | null;
};

export type {
  StripeError,
  PaymentIntent,
  SetupIntent,
  PaymentMethod,
  Stripe,
  StripeElements,
};

export type CreatePaymentIntentResponse = {
  clientSecret: string;
};

export type CreateSetupIntentResponse = {
  clientSecret: string;
};

export type BillingCustomer = {
  id: string;
  email: string | null;
};

export type StripeActionResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Safely extract a human-friendly message from unknown errors.
 * Prefer using this helper instead of casting `any` at call sites.
 */
export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    try {
      return String((err as Record<string, unknown>)['message']);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
