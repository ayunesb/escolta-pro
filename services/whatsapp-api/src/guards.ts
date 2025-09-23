import { supabase } from './db.js';

export async function fetchCandidateGuards() {
  const { data, error } = await supabase
    .from('guards')
    .select('id, full_name, armed, rating, certifications, is_active, last_active')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data || []).map(g => ({
    guard_id: g.id,
    display_name: g.full_name,
    armed: !!g.armed,
    rating: Number(g.rating ?? 0),
    km: undefined,
    certs: g.certifications || []
  }));
}
