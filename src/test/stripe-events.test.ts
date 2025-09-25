import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';
import { handleStripeEvent } from '../server/stripe-events';

// Mock persistence dependencies
vi.mock('../server/stripe-events', async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    // Override internal persistence helpers by re-exporting handleStripeEvent only (actual used)
  };
});

// Provide env for any lazy init (not invoking getStripe here)
process.env.STRIPE_SECRET_KEY = 'sk_test_X';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_X';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'service_key';

// Because handleStripeEvent calls persistence helpers that now rely on Supabase, we mock createClient globally
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: () => ({
        update: () => ({ eq: () => ({ error: null }) }),
        upsert: () => ({ error: null }),
      })
    })
  };
});

describe('handleStripeEvent', () => {
  function makeEvent(type: string, object: any): Stripe.Event {
    return { id: 'evt_test', type, data: { object } } as unknown as Stripe.Event;
  }

  it('handles payment_intent.succeeded', async () => {
    const evt = makeEvent('payment_intent.succeeded', { id: 'pi_1', amount: 1000, amount_received: 1000, metadata: {} });
    const res = await handleStripeEvent(evt);
    expect(res).toEqual({ handled: true, type: 'payment_intent.succeeded' });
  });

  it('handles payment_intent.canceled', async () => {
    const evt = makeEvent('payment_intent.canceled', { id: 'pi_2' });
    const res = await handleStripeEvent(evt);
    expect(res.type).toBe('payment_intent.canceled');
  });

  it('handles charge.refunded', async () => {
    const evt = makeEvent('charge.refunded', { id: 'ch_1' });
    const res = await handleStripeEvent(evt);
    expect(res.type).toBe('charge.refunded');
  });

  it('handles account.updated', async () => {
    const evt = makeEvent('account.updated', { id: 'acct_1', payouts_enabled: true, capabilities: {} });
    const res = await handleStripeEvent(evt);
    expect(res.type).toBe('account.updated');
  });

  it('handles payout.paid', async () => {
    const evt = makeEvent('payout.paid', { id: 'po_1', amount: 5000, status: 'paid', metadata: { guard_id: 'g1' } });
    const res = await handleStripeEvent(evt);
    expect(res.type).toBe('payout.paid');
  });

  it('logs unhandled event', async () => {
    const evt = makeEvent('some.new.event', { id: 'obj' });
    const res = await handleStripeEvent(evt);
    expect(res).toEqual({ handled: false, type: 'some.new.event' });
  });
});
