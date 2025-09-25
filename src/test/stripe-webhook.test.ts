import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';
import handler from '../../api/stripe/webhook';


// Mock environment
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';

// Mock getStripe to control constructEvent output
const constructEventMock = vi.fn((_raw: string, _sig: string, _secret: string) => ({
  id: 'evt_1',
  type: 'payment_intent.succeeded',
  data: { object: { id: 'pi_1', amount_received: 5000, customer: 'cus_1' } },
}) as unknown as Stripe.Event);

vi.mock('../server/stripe-events', () => {
  return {
    getStripe: () => ({
      webhooks: { constructEvent: constructEventMock },
    }) as unknown as Stripe,
    handleStripeEvent: async (_evt: any) => ({ handled: true, type: 'payment_intent.succeeded' }),
  };
});

vi.mock('../server/env', () => ({
  loadServerEnv: () => ({
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_WEBHOOK_SECRET: 'whsec_mock'
  })
}));

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.body = undefined;
  res.send = (body: any) => { res.body = body; return res; };
  res.json = (body: any) => { res.body = body; return res; };
  return res;
}

describe('Stripe Webhook Handler', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
  req = { method: 'POST', headers: { 'stripe-signature': 'sig_123' }, body: { test: true } };
    res = createMockRes();
  });

  it('verifies signature and handles payment_intent.succeeded', async () => {
    await handler(req, res);
    // If failed, expose mock call info for debugging
    if (res.statusCode !== 200) {
      // eslint-disable-next-line no-console
      console.error('constructEvent calls', constructEventMock.mock.calls);
      // eslint-disable-next-line no-console
      console.error('response body', res.body);
    }
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ received: true, handled: true, type: 'payment_intent.succeeded' });
  });

  it('rejects when signature missing', async () => {
    delete req.headers['stripe-signature'];
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });
});
