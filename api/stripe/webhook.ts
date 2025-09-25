import type { VercelRequest, VercelResponse } from '@vercel/node';
// If this endpoint migrates into a Next.js /pages/api or /app route, ensure:
// export const config = { api: { bodyParser: false } }; to preserve raw body for Stripe signature verification.
import Stripe from 'stripe';
// Shared helpers (relative path since api/ outside src/ root alias)
import { getErrorMessage } from '../../src/types/stripe';
import { getStripe } from '../../src/server/stripe-events';
import { loadServerEnv } from '../../src/server/env';
import { handleStripeEvent } from '../../src/server/stripe-events';

// Reusable lazy Stripe client (avoid re-instantiation in serverless envs)
// Raw body acquisition note: For Vercel, configure middleware to retain raw body if needed.
// If "req.rawBody" exists (commonly added by custom middleware), prefer it for signature verification.

// Stripe webhook handler for production
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const sig = req.headers['stripe-signature'];
  const { STRIPE_WEBHOOK_SECRET: webhookSecret } = loadServerEnv();
  if (!sig || !webhookSecret) {
    res.status(400).json({ error: 'Missing Stripe signature or webhook secret' });
    return;
  }

  let event: Stripe.Event;
  try {
    // Vercel may have already parsed body; ensure we have raw body for verification.
    // If using body parsing middleware, configure to provide raw body buffer.
    // Here we assume req.body is the raw payload (adjust integration if not).
    // Try multiple raw body sources. If none available and body already parsed, we stringify.
    const candidate = (req as any).rawBody ?? req.body;
    const rawBody = typeof candidate === 'string' ? candidate : JSON.stringify(candidate);
    event = getStripe().webhooks.constructEvent(rawBody, sig as string, webhookSecret);
  } catch (err: unknown) {
    res.status(400).json({ error: `Webhook signature verification failed: ${getErrorMessage(err)}` });
    return;
  }

  try {
    const result = await handleStripeEvent(event);
    res.status(200).json({ received: true, handled: result.handled, type: result.type });
  } catch (err: unknown) {
    res.status(500).json({ error: `Webhook handler error: ${getErrorMessage(err)}` });
  }
}
