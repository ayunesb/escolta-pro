import { describe, it, expect, vi } from 'vitest';
import Stripe from 'stripe';
import { handleStripeEvent } from '../server/stripe-events';

// Mock Supabase & environment
process.env.STRIPE_SECRET_KEY = 'sk_test_X';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_X';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'service_key';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({ eq: () => ({ error: null }) }),
      upsert: () => ({ error: null }),
      insert: () => ({ error: null }),
      eq: () => ({ error: null })
    })
  })
}));

describe('additional Stripe events', () => {
  function makeEvent(type: string, object: any): Stripe.Event {
    return { id: 'evt_new', type, data: { object } } as unknown as Stripe.Event;
  }

  it('handles payment_intent.payment_failed', async () => {
    const evt = makeEvent('payment_intent.payment_failed', { id: 'pi_failed' });
    const res = await handleStripeEvent(evt);
    expect(res.handled).toBe(true);
  });

  it('handles payout.failed', async () => {
    const evt = makeEvent('payout.failed', { id: 'po_failed', amount: 1000, status: 'failed', metadata: {} });
    const res = await handleStripeEvent(evt);
    expect(res.handled).toBe(true);
  });
});
