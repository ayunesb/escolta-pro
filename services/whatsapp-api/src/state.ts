export type BookingState =
  | 'START'
  | 'ASK_DATETIME'
  | 'ASK_LOCATION'
  | 'ASK_COVERAGE'
  | 'ASK_NOTES'
  | 'MATCHING'
  | 'CONFIRM'
  | 'DONE';

export type CoverageType = 'residential' | 'nightclub' | 'vip' | 'event';

export interface DraftBooking {
  phone: string;
  state: BookingState;
  datetime?: string;
  location?: string;
  coverage?: CoverageType;
  notes?: string;
  selectedGuardId?: string;
}


import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function getDraft(user: { id: string }) {
  const { data, error } = await supabase
    .from('booking_drafts')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateDraft(user: { id: string }, step: string, payload: any) {
  const { error } = await supabase
    .from('booking_drafts')
    .upsert(
      [{ user_id: user.id, step, payload }],
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

export async function resetDraft(user: { id: string }) {
  const { error } = await supabase
    .from('booking_drafts')
    .delete()
    .eq('user_id', user.id);
  if (error) throw error;
}
