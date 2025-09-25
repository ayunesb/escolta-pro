// Unified data access layer that routes to demo shims when VITE_DEMO_MODE=true
import { supabase } from '@/integrations/supabase/client';
import { demoAuth, demoDb, demoStripe } from '@/demo/shims';

const demo = import.meta.env.VITE_DEMO_MODE === 'true';

export async function signInAs(role: 'client'|'company'|'guard') {
  if (demo) return demoAuth(role);
  // real path placeholder: implement real auth selection if needed
  return null;
}

export async function listBookings(role: 'client'|'company'|'guard', userId: string) {
  if (demo) return demoDb.listBookings(role, userId);
  // Fallback to supabase query (simplified)
  const { data } = await supabase.from('bookings').select('*');
  return data || [];
}

export async function createBooking(payload: { pickup_address: string; start_ts: string; end_ts: string; total_mxn_cents: number; client_id: string; }) {
  if (demo) return demoDb.createBooking(payload);
  const { data } = await supabase.from('bookings').insert(payload).select().single();
  return data;
}

export async function sendMessageDemoAware(booking_id: string, sender_id: string|null, body: string) {
  if (demo) return demoDb.addMessage(booking_id, sender_id, body);
  const { data } = await supabase.from('messages').insert({ booking_id, sender_id, body }).select().single();
  return data;
}

export function listMessagesDemoAware(booking_id: string) {
  if (demo) return Promise.resolve(demoDb.listMessages(booking_id));
  return supabase.from('messages').select('*').eq('booking_id', booking_id).then(r => r.data || []);
}

export function simulatePayment(booking_id: string, amount_cents: number) {
  if (demo) return demoStripe.transferSplit(booking_id, amount_cents);
  // Real path would call an edge function / stripe webhook sequence
  return { id: 'noop', booking_id, amount_cents, status: 'pending' };
}

export function getPaymentLedger() {
  if (demo) return demoDb.listPayments();
  return [];
}
