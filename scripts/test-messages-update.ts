import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function run() {
  // sign in a participant (seed account)
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'sofia.client@demo.mx',
    password: 'Demo123!',
  });
  if (signInErr || !signInData.session) throw signInErr ?? new Error('sign-in failed');

  // find a message in a booking Sofia participates in
  const { data: msgs, error: selErr } = await supabase
    .from('messages')
    .select('id, booking_id, body')
    .limit(1);
  if (selErr) throw selErr;
  if (!msgs?.length) throw new Error('No messages to test.');

  const { id } = msgs[0];
  const { error: updErr } = await supabase
    .from('messages')
    .update({ body: 'updated by participant ✅' })
    .eq('id', id);

  console.log('participant update:', updErr ?? 'OK');

  // 2) Sign in someone not in that booking and confirm UPDATE is denied
  const supabase2 = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data: s2, error: s2err } = await supabase2.auth.signInWithPassword({
    email: 'freelance1@demo.mx',
    password: 'Demo123!',
  });
  if (s2err || !s2.session) throw s2err ?? new Error('sign-in2 failed');

  const { error: badUpd } = await supabase2
    .from('messages')
    .update({ body: 'should be blocked ❌' })
    .eq('id', id);

  console.log('non-participant update (expected error):', badUpd?.message ?? 'no error');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
