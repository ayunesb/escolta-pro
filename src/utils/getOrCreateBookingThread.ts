// src/utils/getOrCreateBookingThread.ts
export async function getOrCreateBookingThread(supabase, bookingId) {
  const { data, error } = await supabase.rpc('ensure_booking_thread', { p_booking_id: bookingId });
  if (error) throw error;
  return data;
}
