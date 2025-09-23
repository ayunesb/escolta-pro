import { supabase } from './db.js';
import type { CoverageType, DraftBooking, BookingState } from './state.js';

const DEFAULT_STATE: BookingState = 'ASK_DATETIME';

export async function getDraft(phone: string): Promise<DraftBooking> {
  const { data } = await supabase
    .from('booking_drafts')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (data) {
    return {
      phone: data.phone,
      state: data.state as BookingState,
      datetime: data.datetime_text ?? undefined,
      location: data.location ?? undefined,
      coverage: data.coverage as CoverageType | undefined,
      notes: data.notes ?? undefined,
      selectedGuardId: data.selected_guard_id ?? undefined
    };
  }

  const { data: created, error } = await supabase
    .from('booking_drafts')
    .insert({ phone, state: DEFAULT_STATE })
    .select('*')
    .single();
  if (error) throw error;

  return {
    phone: created.phone,
    state: created.state as BookingState
  };
}

export async function updateDraft(phone: string, patch: Partial<DraftBooking>): Promise<void> {
  const upd = {
    state: patch.state,
    datetime_text: patch.datetime,
    location: patch.location,
    coverage: patch.coverage,
    notes: patch.notes,
    selected_guard_id: patch.selectedGuardId
  };
  Object.keys(upd).forEach(k => (upd as any)[k] === undefined && delete (upd as any)[k]);

  const { error } = await supabase
    .from('booking_drafts')
    .update(upd)
    .eq('phone', phone);
  if (error) throw error;
}

export async function resetDraft(phone: string): Promise<void> {
  const { error } = await supabase
    .from('booking_drafts')
    .delete()
    .eq('phone', phone);
  if (error) throw error;
}
