import Stripe from 'stripe';
import { loadServerEnv } from './env';
import { logger } from './logger';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

// Shape of internal persistence result
export interface EventHandlingResult {
  handled: boolean;
  type: string;
}

// Dead-letter record interface (mirrors potential DB schema `stripe_failed_events`)
interface FailedEventRecord {
  id: string;
  type: string;
  payload: Stripe.Event;
  error: string;
  created_at?: string;
}

// Supabase service client (lazy)
let supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!supabase) {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = loadServerEnv();
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY for server persistence.');
    }
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabase;
}

// Persistence helpers
async function recordPaymentSucceeded(pi: Stripe.PaymentIntent) {
  const sb = getSupabase();
  // Update payment by preauth_id (payment intent id) if exists
  const updatePayment = async () => sb
    .from('payments')
    .update({
      status: 'succeeded',
      amount_captured: pi.amount_received ?? pi.amount,
      charge_id: pi.latest_charge as string | null,
    })
    .eq('preauth_id', pi.id);
  await withRetry('payment_intent.succeeded.update', updatePayment, 3, 150);
  // Optionally update booking status if metadata has booking_id
  const bookingId = (pi.metadata && pi.metadata['booking_id']) || undefined;
  if (bookingId) {
    const updateBooking = async () => sb
      .from('bookings')
      .update({ status: 'paid', total_mxn_cents: pi.amount })
      .eq('id', bookingId);
    try {
  await withRetry('booking.update.paid', updateBooking, 3, 200);
    } catch (err) {
      logger.error('booking.update.failed', { bookingId, err: (err as Error).message });
    }
  }
  return { id: pi.id };
}

async function recordPaymentCanceled(pi: Stripe.PaymentIntent) {
  const sb = getSupabase();
  const updatePayment = async () => sb
    .from('payments')
    .update({ status: 'canceled' })
    .eq('preauth_id', pi.id);
  await withRetry('payment_intent.canceled.update', updatePayment, 3, 150);
  return { id: pi.id };
}

async function recordChargeRefunded(charge: Stripe.Charge) {
  const sb = getSupabase();
  // Mark payment refunded based on charge id linkage
  const updatePayment = async () => sb
    .from('payments')
    .update({ status: 'refunded' })
    .eq('charge_id', charge.id);
  await withRetry('charge.refunded.update', updatePayment, 3, 150);
  return { id: charge.id };
}

async function recordPaymentFailed(pi: Stripe.PaymentIntent) {
  const sb = getSupabase();
  const updatePayment = async () => sb
    .from('payments')
    .update({ status: 'failed' })
    .eq('preauth_id', pi.id);
  await withRetry('payment_intent.payment_failed.update', updatePayment, 3, 150);
  return { id: pi.id };
}

async function recordPayoutFailed(payout: Stripe.Payout) {
  const sb = getSupabase();
  const upsertPayout = async () => sb
    .from('payouts')
    .upsert({
      id: payout.id,
      guard_id: (payout.metadata && payout.metadata['guard_id']) || 'unknown',
      company_id: (payout.metadata && payout.metadata['company_id']) || null,
      amount: payout.amount,
      status: payout.status || 'failed',
      period_start: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
      period_end: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
    });
  await withRetry('payout.failed.upsert', upsertPayout, 3, 150);
  return { id: payout.id };
}

async function persistFailedEvent(evt: Stripe.Event, error: unknown) {
  try {
    const sb = getSupabase();
    const rec: FailedEventRecord = {
      id: evt.id,
      type: evt.type,
      payload: evt,
      error: error instanceof Error ? error.message : String(error),
      created_at: new Date().toISOString(),
    };
    // Attempt insert into stripe_failed_events if table exists; ignore error if not.
    await sb.from('stripe_failed_events' as any).insert({
      id: rec.id,
      type: rec.type,
      payload: rec.payload as any,
      error: rec.error,
      created_at: rec.created_at,
    } as any);
  } catch (persistErr) {
    logger.warn('failed_event.persist.error', { id: evt.id, err: (persistErr as Error).message });
  }
}

async function syncAccount(account: Stripe.Account) {
  // Placeholder: store payout capability status inside a companies table if mapping exists.
  // Without a direct mapping reference, just log.
  // Attempt to map Stripe account to company via stripe_account_id
  const sb = getSupabase();
  // companies table lacks explicit payout/capabilities columns; store status via status field if desired.
  const statusValue = account.payouts_enabled ? 'payouts_enabled' : 'pending';
  const updateCompany = async () => sb
    .from('companies')
    .update({ status: statusValue })
    .eq('stripe_account_id', account.id);
  try {
    await withRetry('account.updated.company', updateCompany, 3, 200);
    logger.info('account.updated.mapped', { account: account.id });
  } catch (err) {
    logger.warn('account.updated.unmapped', { account: account.id, err: (err as Error).message });
  }
  return { id: account.id };
}

async function recordPayout(payout: Stripe.Payout) {
  const sb = getSupabase();
  // Insert or upsert payout (guard_id/company_id association unknown here; log only if missing)
  const metadata = payout.metadata || {};
  const guardId = metadata['guard_id'];
  const companyId = metadata['company_id'];
  if (!guardId) {
    console.warn('[stripe-events] payout without guard_id metadata', { payout: payout.id });
  }
  const upsertPayout = async () => sb
    .from('payouts')
    .upsert({
      id: payout.id,
      guard_id: guardId || 'unknown',
      company_id: companyId || null,
      amount: payout.amount,
      status: payout.status,
      period_start: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
      period_end: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
    });
  await withRetry('payout.paid.upsert', upsertPayout, 3, 150);
  return { id: payout.id };
}

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const { STRIPE_SECRET_KEY } = loadServerEnv();
    stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
  return stripe;
}

export async function handleStripeEvent(event: Stripe.Event): Promise<EventHandlingResult> {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await recordPaymentSucceeded(pi);
      return { handled: true, type: event.type };
    }
    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await recordPaymentCanceled(pi);
      return { handled: true, type: event.type };
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await recordPaymentFailed(pi);
      return { handled: true, type: event.type };
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      await recordChargeRefunded(charge);
      return { handled: true, type: event.type };
    }
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      await syncAccount(account);
      return { handled: true, type: event.type };
    }
    case 'payout.paid': {
      const payout = event.data.object as Stripe.Payout;
      await recordPayout(payout);
      return { handled: true, type: event.type };
    }
    case 'payout.failed': {
      const payout = event.data.object as Stripe.Payout;
      await recordPayoutFailed(payout);
      return { handled: true, type: event.type };
    }
    default:
  // Structured log for observability
      logger.info('stripe.event.unhandled', { type: event.type, id: event.id });
  return { handled: false, type: event.type };
  }
}

// Generic retry with exponential backoff + jitter + optional max elapsed time budget.
// Jitter helps reduce thundering herd if many lambdas retry simultaneously.
export async function withRetry<T>(
  label: string,
  op: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 100,
  evt?: Stripe.Event,
  opts?: { jitter?: boolean; maxElapsedMs?: number }
): Promise<T> {
  let lastErr: unknown;
  const start = Date.now();
  const jitter = opts?.jitter ?? true;
  const maxElapsed = opts?.maxElapsedMs ?? 10_000; // default 10s safety budget
  for (let i = 1; i <= attempts; i++) {
    try {
      const result = await op();
      if (i > 1) logger.info('retry.success', { label, attempt: i });
      return result;
    } catch (err) {
      lastErr = err;
      logger.warn('retry.failure', { label, attempt: i, err: (err as Error).message });
      if (i < attempts) {
        const elapsed = Date.now() - start;
        if (elapsed >= maxElapsed) {
          logger.warn('retry.aborted.maxElapsed', { label, elapsed, maxElapsed });
          break; // abort further retries
        }
        let delay = baseDelayMs * Math.pow(2, i - 1);
        if (jitter) {
          const spread = delay * 0.3; // 30% jitter
          delay = Math.round(delay - spread / 2 + Math.random() * spread);
        }
        // Clamp remaining time if close to budget
        if (elapsed + delay > maxElapsed) {
          delay = Math.max(0, maxElapsed - elapsed);
        }
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
    }
  }
  // Exhausted retries -> dead-letter persistence if event context provided
  if (evt) await persistFailedEvent(evt, lastErr);
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
